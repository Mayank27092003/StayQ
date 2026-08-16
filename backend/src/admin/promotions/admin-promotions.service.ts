import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Coupon, CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import {
  buildPaginatedResult,
  PaginatedResult,
  toSkipTake,
} from '../dto/pagination.dto';
import { decimalToNumber, roundCurrency, sumDecimals } from '../common/serialization';
import {
  CreatePromotionDto,
  PromotionQueryDto,
  PromotionStatus,
  PromotionSummaryQueryDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';

/** Bookings that represent real, recognised redemptions. */
const REDEEMED_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

export interface PromotionRedemptionStats {
  bookings: number;
  discountGiven: number;
  grossBookingValue: number;
}

export interface PromotionResponse {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minBookingAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  remainingRedemptions: number | null;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
  status: PromotionStatus;
  applicableCategories: string[];
  applicableCities: string[];
  createdAt: Date;
  updatedAt: Date;
  redemptions: PromotionRedemptionStats;
}

@Injectable()
export class AdminPromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  /**
   * Derives lifecycle state. Order matters: an expired window and an exhausted
   * allowance are both terminal and take precedence over the `active` flag.
   */
  private resolveStatus(coupon: Coupon, now = new Date()): PromotionStatus {
    if (coupon.validUntil.getTime() < now.getTime()) return PromotionStatus.EXPIRED;
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return PromotionStatus.EXHAUSTED;
    }
    if (!coupon.active) return PromotionStatus.PAUSED;
    if (coupon.validFrom.getTime() > now.getTime()) return PromotionStatus.SCHEDULED;
    return PromotionStatus.ACTIVE;
  }

  /**
   * Reads redemption figures from bookings rather than trusting `usedCount`
   * alone, so reported discount and booking value reflect real transactions.
   */
  private async loadRedemptionStats(codes: string[]): Promise<Map<string, PromotionRedemptionStats>> {
    const stats = new Map<string, PromotionRedemptionStats>();
    if (codes.length === 0) return stats;

    const grouped = await this.prisma.booking.groupBy({
      by: ['couponCode'],
      where: { couponCode: { in: codes }, status: { in: REDEEMED_BOOKING_STATUSES } },
      _count: { _all: true },
      _sum: { couponDiscount: true, totalAmount: true },
    });

    for (const row of grouped) {
      if (!row.couponCode) continue;
      stats.set(row.couponCode, {
        bookings: row._count._all,
        discountGiven: roundCurrency(decimalToNumber(row._sum.couponDiscount) ?? 0),
        grossBookingValue: roundCurrency(decimalToNumber(row._sum.totalAmount) ?? 0),
      });
    }

    return stats;
  }

  private toResponse(coupon: Coupon, stats?: PromotionRedemptionStats): PromotionResponse {
    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: decimalToNumber(coupon.value) ?? 0,
      minBookingAmount: decimalToNumber(coupon.minBookingAmount),
      maxDiscount: decimalToNumber(coupon.maxDiscount),
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      perUserLimit: coupon.perUserLimit,
      remainingRedemptions:
        coupon.usageLimit === null ? null : Math.max(0, coupon.usageLimit - coupon.usedCount),
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      active: coupon.active,
      status: this.resolveStatus(coupon),
      applicableCategories: coupon.applicableCategories,
      applicableCities: coupon.applicableCities,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      redemptions: stats ?? { bookings: 0, discountGiven: 0, grossBookingValue: 0 },
    };
  }

  /**
   * Validates the invariants the schema cannot express: a percentage cannot
   * exceed 100, a cap only applies to percentage coupons, and the window must
   * move forward in time.
   */
  private assertConsistent(input: {
    type: CouponType;
    value: number;
    maxDiscount?: number | null;
    validFrom: Date;
    validUntil: Date;
  }): void {
    if (input.type === CouponType.PERCENTAGE && input.value > 100) {
      throw new BadRequestException('A percentage promotion cannot exceed 100.');
    }
    if (input.type === CouponType.FLAT && input.maxDiscount != null) {
      throw new BadRequestException(
        'maxDiscount only applies to percentage promotions; a flat promotion is already a fixed amount.',
      );
    }
    if (input.validUntil.getTime() <= input.validFrom.getTime()) {
      throw new BadRequestException('validUntil must be later than validFrom.');
    }
  }

  async list(query: PromotionQueryDto): Promise<PaginatedResult<PromotionResponse>> {
    const { skip, take } = toSkipTake(query);
    const now = new Date();

    const where: Prisma.CouponWhereInput = {};
    if (query.search) {
      where.code = { contains: query.search, mode: 'insensitive' };
    }
    if (query.type) {
      where.type = query.type;
    }

    // Narrow in SQL where the status maps cleanly onto columns. EXHAUSTED
    // compares two columns, which Prisma cannot express in a filter, so it is
    // applied after loading.
    switch (query.status) {
      case PromotionStatus.EXPIRED:
        where.validUntil = { lt: now };
        break;
      case PromotionStatus.PAUSED:
        where.active = false;
        where.validUntil = { gte: now };
        break;
      case PromotionStatus.SCHEDULED:
        where.active = true;
        where.validFrom = { gt: now };
        where.validUntil = { gte: now };
        break;
      case PromotionStatus.ACTIVE:
        where.active = true;
        where.validFrom = { lte: now };
        where.validUntil = { gte: now };
        break;
      default:
        break;
    }

    if (query.status === PromotionStatus.EXHAUSTED) {
      // Column-to-column comparison: evaluate over the limited set only.
      const limited = await this.prisma.coupon.findMany({
        where: { ...where, usageLimit: { not: null } },
        orderBy: { createdAt: 'desc' },
      });
      const exhausted = limited.filter(
        (coupon) => coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit,
      );
      const paged = exhausted.slice(skip, skip + take);
      const stats = await this.loadRedemptionStats(paged.map((c) => c.code));

      return buildPaginatedResult(
        paged.map((coupon) => this.toResponse(coupon, stats.get(coupon.code))),
        exhausted.length,
        query,
      );
    }

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.coupon.count({ where }),
    ]);

    const stats = await this.loadRedemptionStats(coupons.map((c) => c.code));

    return buildPaginatedResult(
      coupons.map((coupon) => this.toResponse(coupon, stats.get(coupon.code))),
      total,
      query,
    );
  }

  async findOne(id: string): Promise<PromotionResponse> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Promotion not found.');

    const stats = await this.loadRedemptionStats([coupon.code]);
    return this.toResponse(coupon, stats.get(coupon.code));
  }

  async create(dto: CreatePromotionDto, adminId: string): Promise<PromotionResponse> {
    const code = dto.code.trim().toUpperCase();
    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);

    this.assertConsistent({
      type: dto.type,
      value: dto.value,
      maxDiscount: dto.maxDiscount,
      validFrom,
      validUntil,
    });

    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictException(`Promotion code "${code}" already exists.`);
    }

    const created = await this.audit.runWithAudit(
      (tx) =>
        tx.coupon.create({
          data: {
            code,
            type: dto.type,
            value: new Prisma.Decimal(dto.value),
            minBookingAmount:
              dto.minBookingAmount != null ? new Prisma.Decimal(dto.minBookingAmount) : null,
            maxDiscount: dto.maxDiscount != null ? new Prisma.Decimal(dto.maxDiscount) : null,
            usageLimit: dto.usageLimit ?? null,
            perUserLimit: dto.perUserLimit ?? 1,
            validFrom,
            validUntil,
            active: dto.active ?? true,
            applicableCategories: dto.applicableCategories ?? [],
            applicableCities: dto.applicableCities ?? [],
          },
        }),
      (coupon) => ({
        adminId,
        action: 'CREATE_PROMOTION',
        targetType: 'PROMOTION',
        targetId: coupon.id,
        details: { code: coupon.code, type: coupon.type, value: coupon.value.toString() },
      }),
    );

    return this.toResponse(created);
  }

  async update(id: string, dto: UpdatePromotionDto, adminId: string): Promise<PromotionResponse> {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found.');

    const nextType = dto.type ?? existing.type;
    const nextValue = dto.value ?? decimalToNumber(existing.value) ?? 0;
    const nextMaxDiscount =
      dto.maxDiscount !== undefined ? dto.maxDiscount : decimalToNumber(existing.maxDiscount);
    const nextValidFrom = dto.validFrom ? new Date(dto.validFrom) : existing.validFrom;
    const nextValidUntil = dto.validUntil ? new Date(dto.validUntil) : existing.validUntil;

    this.assertConsistent({
      type: nextType,
      value: nextValue,
      maxDiscount: nextMaxDiscount,
      validFrom: nextValidFrom,
      validUntil: nextValidUntil,
    });

    // A redeemed promotion cannot have its economics rewritten: bookings
    // already priced against the old terms would no longer be explainable.
    if (existing.usedCount > 0) {
      const economicsChanged =
        (dto.type !== undefined && dto.type !== existing.type) ||
        (dto.value !== undefined && dto.value !== decimalToNumber(existing.value));

      if (economicsChanged) {
        throw new ConflictException(
          `This promotion has ${existing.usedCount} redemption(s); its type and value can no longer be changed. Pause it and create a replacement code instead.`,
        );
      }
    }

    if (dto.usageLimit != null && dto.usageLimit < existing.usedCount) {
      throw new BadRequestException(
        `usageLimit cannot be lower than the ${existing.usedCount} redemption(s) already recorded.`,
      );
    }

    const data: Prisma.CouponUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = new Prisma.Decimal(dto.value);
    if (dto.minBookingAmount !== undefined) {
      data.minBookingAmount =
        dto.minBookingAmount === null ? null : new Prisma.Decimal(dto.minBookingAmount);
    }
    if (dto.maxDiscount !== undefined) {
      data.maxDiscount = dto.maxDiscount === null ? null : new Prisma.Decimal(dto.maxDiscount);
    }
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.perUserLimit !== undefined) data.perUserLimit = dto.perUserLimit;
    if (dto.validFrom !== undefined) data.validFrom = nextValidFrom;
    if (dto.validUntil !== undefined) data.validUntil = nextValidUntil;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.applicableCategories !== undefined) data.applicableCategories = dto.applicableCategories;
    if (dto.applicableCities !== undefined) data.applicableCities = dto.applicableCities;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No changes were supplied.');
    }

    const updated = await this.audit.runWithAudit(
      (tx) => tx.coupon.update({ where: { id }, data }),
      (coupon) => ({
        adminId,
        action: 'UPDATE_PROMOTION',
        targetType: 'PROMOTION',
        targetId: coupon.id,
        details: { code: coupon.code, changedFields: Object.keys(data) },
      }),
    );

    const stats = await this.loadRedemptionStats([updated.code]);
    return this.toResponse(updated, stats.get(updated.code));
  }

  async setActive(id: string, active: boolean, adminId: string): Promise<PromotionResponse> {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found.');

    const updated = await this.audit.runWithAudit(
      (tx) => tx.coupon.update({ where: { id }, data: { active } }),
      (coupon) => ({
        adminId,
        action: active ? 'ACTIVATE_PROMOTION' : 'PAUSE_PROMOTION',
        targetType: 'PROMOTION',
        targetId: coupon.id,
        details: { code: coupon.code, active },
      }),
    );

    const stats = await this.loadRedemptionStats([updated.code]);
    return this.toResponse(updated, stats.get(updated.code));
  }

  /**
   * Deletion is refused once a promotion has been redeemed, because
   * `Booking.couponCode` references the code and the discount must stay
   * auditable. Pausing is the correct action for a live code.
   */
  async remove(id: string, adminId: string): Promise<{ id: string; deleted: true }> {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found.');

    const redeemedBookings = await this.prisma.booking.count({
      where: { couponCode: existing.code },
    });

    if (existing.usedCount > 0 || redeemedBookings > 0) {
      throw new ConflictException(
        `"${existing.code}" has been used on ${redeemedBookings || existing.usedCount} booking(s) and cannot be deleted. Pause it instead to stop further redemptions.`,
      );
    }

    await this.audit.runWithAudit(
      (tx) => tx.coupon.delete({ where: { id } }),
      (coupon) => ({
        adminId,
        action: 'DELETE_PROMOTION',
        targetType: 'PROMOTION',
        targetId: coupon.id,
        details: { code: coupon.code },
      }),
    );

    return { id, deleted: true };
  }

  /**
   * Aggregate performance over a trailing window. Every figure is computed from
   * coupon rows and redeemed bookings; nothing is estimated.
   */
  async summary(query: PromotionSummaryQueryDto) {
    const days = query.days ?? 30;
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [total, activeCount, coupons, redeemedBookings] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({
        where: { active: true, validFrom: { lte: now }, validUntil: { gte: now } },
      }),
      this.prisma.coupon.findMany({ select: { code: true, usedCount: true, usageLimit: true } }),
      this.prisma.booking.findMany({
        where: {
          couponCode: { not: null },
          status: { in: REDEEMED_BOOKING_STATUSES },
          createdAt: { gte: since },
        },
        select: { couponCode: true, couponDiscount: true, totalAmount: true, createdAt: true },
      }),
    ]);

    const discountGiven = roundCurrency(sumDecimals(redeemedBookings.map((b) => b.couponDiscount)));
    const grossBookingValue = roundCurrency(
      sumDecimals(redeemedBookings.map((b) => b.totalAmount)),
    );

    // Redemptions per code within the window, ranked by discount value.
    const perCode = new Map<string, { code: string; bookings: number; discountGiven: number }>();
    for (const booking of redeemedBookings) {
      if (!booking.couponCode) continue;
      const entry =
        perCode.get(booking.couponCode) ??
        { code: booking.couponCode, bookings: 0, discountGiven: 0 };
      entry.bookings += 1;
      entry.discountGiven += decimalToNumber(booking.couponDiscount) ?? 0;
      perCode.set(booking.couponCode, entry);
    }

    const topPromotions = [...perCode.values()]
      .map((entry) => ({ ...entry, discountGiven: roundCurrency(entry.discountGiven) }))
      .sort((a, b) => b.discountGiven - a.discountGiven)
      .slice(0, 5);

    // Daily redemption series across the window, including zero-activity days
    // so the client renders a continuous axis without inventing points.
    const dailyMap = new Map<string, { bookings: number; discountGiven: number }>();
    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(since.getTime() + offset * 24 * 60 * 60 * 1000);
      dailyMap.set(day.toISOString().slice(0, 10), { bookings: 0, discountGiven: 0 });
    }
    for (const booking of redeemedBookings) {
      const key = booking.createdAt.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (!entry) continue;
      entry.bookings += 1;
      entry.discountGiven += decimalToNumber(booking.couponDiscount) ?? 0;
    }

    const redemptionSeries = [...dailyMap.entries()].map(([date, value]) => ({
      date,
      bookings: value.bookings,
      discountGiven: roundCurrency(value.discountGiven),
    }));

    return {
      windowDays: days,
      totalPromotions: total,
      activePromotions: activeCount,
      lifetimeRedemptions: coupons.reduce((sum, c) => sum + c.usedCount, 0),
      windowRedemptions: redeemedBookings.length,
      discountGiven,
      grossBookingValue,
      averageDiscountPerBooking:
        redeemedBookings.length === 0
          ? 0
          : roundCurrency(discountGiven / redeemedBookings.length),
      topPromotions,
      redemptionSeries,
    };
  }
}
