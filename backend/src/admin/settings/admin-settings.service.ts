import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminSettingValueType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { UpsertSettingDto, SettingQueryDto } from './dto/settings.dto';

/** Safe keys that may never be deleted — removing them would break platform behaviour. */
const PROTECTED_KEYS = new Set([
  'platform.maintenance_mode',
  'booking.instant_book_enabled',
  'payout.minimum_amount',
]);

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(query: SettingQueryDto) {
    const where: Prisma.AdminSettingWhereInput = {};
    if (query.group) where.group = query.group;
    if (query.search)
      where.OR = [
        { key: { contains: query.search, mode: 'insensitive' } },
        { label: { contains: query.search, mode: 'insensitive' } },
      ];
    return this.prisma.adminSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async upsert(dto: UpsertSettingDto, adminId: string) {
    this.validateValue(
      dto.value,
      dto.valueType ?? AdminSettingValueType.STRING,
    );
    return this.audit.runWithAudit(
      (tx) =>
        tx.adminSetting.upsert({
          where: { key: dto.key },
          create: {
            key: dto.key,
            value: dto.value,
            valueType: dto.valueType ?? AdminSettingValueType.STRING,
            group: dto.group,
            label: dto.label,
            description: dto.description ?? null,
            updatedById: adminId,
          },
          update: {
            value: dto.value,
            label: dto.label,
            description: dto.description ?? null,
            updatedById: adminId,
          },
        }),
      (r) => ({
        adminId,
        action: 'UPSERT_SETTING',
        targetType: 'SYSTEM_SETTINGS',
        targetId: r.id,
        details: { key: r.key, group: r.group },
      }),
    );
  }

  async delete(id: string, adminId: string) {
    const s = await this.prisma.adminSetting.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Setting not found.');
    if (PROTECTED_KEYS.has(s.key))
      throw new BadRequestException(
        `"${s.key}" is a protected setting and cannot be deleted.`,
      );
    await this.audit.runWithAudit(
      (tx) => tx.adminSetting.delete({ where: { id } }),
      (r) => ({
        adminId,
        action: 'DELETE_SETTING',
        targetType: 'SYSTEM_SETTINGS',
        targetId: r.id,
        details: { key: r.key },
      }),
    );
    return { id, deleted: true as const };
  }

  async groups() {
    const rows = await this.prisma.adminSetting.groupBy({
      by: ['group'],
      _count: { _all: true },
    });
    return rows.map((r) => ({ group: r.group, count: r._count._all }));
  }

  private validateValue(value: string, type: AdminSettingValueType) {
    if (
      type === AdminSettingValueType.NUMBER &&
      !Number.isFinite(Number(value))
    )
      throw new BadRequestException(
        'Value must be a valid finite number for NUMBER type settings.',
      );
    if (
      type === AdminSettingValueType.BOOLEAN &&
      value !== 'true' &&
      value !== 'false'
    )
      throw new BadRequestException(
        'Value must be "true" or "false" for BOOLEAN type settings.',
      );
    if (type === AdminSettingValueType.JSON) {
      try {
        JSON.parse(value);
      } catch {
        throw new BadRequestException(
          'Value must be valid JSON for JSON type settings.',
        );
      }
    }
  }

  /**
   * NEW-024: Aggregate reconciliation against authoritative canonical rows
   */
  async reconcileAggregates() {
    // 1. Reconcile coupon used counts against confirmed/completed bookings
    const coupons = await this.prisma.coupon.findMany();
    let couponFixed = 0;
    for (const c of coupons) {
      const actualCount = await this.prisma.booking.count({
        where: {
          couponCode: { equals: c.code, mode: 'insensitive' },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      });
      if (actualCount !== c.usedCount) {
        await this.prisma.coupon.update({
          where: { id: c.id },
          data: { usedCount: actualCount },
        });
        couponFixed++;
      }
    }

    // 2. Reconcile property faultCount & hasActiveFault against active incidents
    const properties = await this.prisma.property.findMany({
      select: { id: true, faultCount: true, hasActiveFault: true },
    });
    let propertyFaultFixed = 0;
    for (const p of properties) {
      const activeIncidents = await this.prisma.propertyIncident.count({
        where: {
          propertyId: p.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      });
      const shouldHaveFault = activeIncidents > 0;
      if (
        p.faultCount !== activeIncidents ||
        p.hasActiveFault !== shouldHaveFault
      ) {
        await this.prisma.property.update({
          where: { id: p.id },
          data: {
            faultCount: activeIncidents,
            hasActiveFault: shouldHaveFault,
          },
        });
        propertyFaultFixed++;
      }
    }

    return {
      success: true,
      couponReconciled: couponFixed,
      propertyFaultReconciled: propertyFaultFixed,
      timestamp: new Date().toISOString(),
    };
  }
}
