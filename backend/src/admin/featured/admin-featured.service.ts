import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BannerPlacement, FeaturedPlacementType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import {
  BannerQueryDto,
  CreateBannerDto,
  CreateFeaturedPlacementDto,
  FeaturedQueryDto,
  ReorderFeaturedDto,
  UpdateBannerDto,
  UpdateFeaturedPlacementDto,
} from './dto/featured.dto';

@Injectable()
export class AdminFeaturedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  // ── Placements ───────────────────────────────────────────────────────────

  async listPlacements(query: FeaturedQueryDto) {
    const now = new Date();
    const where: Prisma.FeaturedPlacementWhereInput = {};
    if (query.placement) where.placement = query.placement;
    if (query.currentOnly) {
      where.active = true;
      where.startsAt = { lte: now };
      where.OR = [{ endsAt: null }, { endsAt: { gte: now } }];
    }
    return this.prisma.featuredPlacement.findMany({
      where,
      orderBy: [{ placement: 'asc' }, { displayOrder: 'asc' }],
      include: {
        property: {
          select: {
            id: true, title: true, city: true, category: true, status: true,
            images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
    });
  }

  async createPlacement(dto: CreateFeaturedPlacementDto, adminId: string) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt <= startsAt) throw new BadRequestException('endsAt must be after startsAt.');

    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId }, select: { id: true, status: true } });
    if (!property) throw new NotFoundException('Property not found.');

    const existing = await this.prisma.featuredPlacement.findUnique({
      where: { propertyId_placement: { propertyId: dto.propertyId, placement: dto.placement } },
    });
    if (existing) throw new ConflictException('This property already has a placement of this type. Update the existing one instead.');

    return this.audit.runWithAudit(
      (tx) => tx.featuredPlacement.create({
        data: {
          propertyId: dto.propertyId, placement: dto.placement,
          displayOrder: dto.displayOrder ?? 0, startsAt, endsAt,
          active: dto.active ?? true, createdById: adminId,
        },
      }),
      (r) => ({ adminId, action: 'CREATE_FEATURED_PLACEMENT', targetType: 'PROPERTY', targetId: r.propertyId, details: { placementId: r.id, placement: r.placement } }),
    );
  }

  async updatePlacement(id: string, dto: UpdateFeaturedPlacementDto, adminId: string) {
    const existing = await this.prisma.featuredPlacement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Featured placement not found.');
    const data: Prisma.FeaturedPlacementUpdateInput = {};
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt === null ? null : new Date(dto.endsAt);
    if (dto.active !== undefined) data.active = dto.active;
    return this.audit.runWithAudit(
      (tx) => tx.featuredPlacement.update({ where: { id }, data }),
      (r) => ({ adminId, action: 'UPDATE_FEATURED_PLACEMENT', targetType: 'PROPERTY', targetId: r.propertyId, details: { id } }),
    );
  }

  async deletePlacement(id: string, adminId: string) {
    const existing = await this.prisma.featuredPlacement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Featured placement not found.');
    await this.audit.runWithAudit(
      (tx) => tx.featuredPlacement.delete({ where: { id } }),
      (r) => ({ adminId, action: 'DELETE_FEATURED_PLACEMENT', targetType: 'PROPERTY', targetId: r.propertyId, details: { id } }),
    );
    return { id, deleted: true as const };
  }

  async reorderPlacements(placement: FeaturedPlacementType, dto: ReorderFeaturedDto, adminId: string) {
    await this.prisma.$transaction(
      dto.entries.map((e) => this.prisma.featuredPlacement.update({ where: { id: e.id }, data: { displayOrder: e.displayOrder } })),
    );
    await this.audit.record({ adminId, action: 'REORDER_FEATURED_PLACEMENTS', targetType: 'PROPERTY', targetId: placement, details: { count: dto.entries.length } });
    return { reordered: dto.entries.length };
  }

  // ── Banners ──────────────────────────────────────────────────────────────

  async listBanners(query: BannerQueryDto) {
    const now = new Date();
    const where: Prisma.ContentBannerWhereInput = {};
    if (query.placement) where.placement = query.placement;
    if (query.currentOnly) {
      where.active = true;
      where.startsAt = { lte: now };
      where.OR = [{ endsAt: null }, { endsAt: { gte: now } }];
    }
    return this.prisma.contentBanner.findMany({ where, orderBy: [{ placement: 'asc' }, { displayOrder: 'asc' }] });
  }

  async createBanner(dto: CreateBannerDto, adminId: string) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt <= startsAt) throw new BadRequestException('endsAt must be after startsAt.');
    return this.audit.runWithAudit(
      (tx) => tx.contentBanner.create({ data: { title: dto.title, subtitle: dto.subtitle ?? null, imageUrl: dto.imageUrl, linkUrl: dto.linkUrl ?? null, placement: dto.placement, displayOrder: dto.displayOrder ?? 0, startsAt, endsAt, active: dto.active ?? true, createdById: adminId } }),
      (r) => ({ adminId, action: 'CREATE_BANNER', targetType: 'PROPERTY', targetId: r.id, details: { placement: r.placement } }),
    );
  }

  async updateBanner(id: string, dto: UpdateBannerDto, adminId: string) {
    const existing = await this.prisma.contentBanner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found.');
    const data: Prisma.ContentBannerUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.linkUrl !== undefined) data.linkUrl = dto.linkUrl;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt === null ? null : new Date(dto.endsAt);
    if (dto.active !== undefined) data.active = dto.active;
    return this.audit.runWithAudit(
      (tx) => tx.contentBanner.update({ where: { id }, data }),
      (r) => ({ adminId, action: 'UPDATE_BANNER', targetType: 'PROPERTY', targetId: r.id, details: { id } }),
    );
  }

  async deleteBanner(id: string, adminId: string) {
    const existing = await this.prisma.contentBanner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner not found.');
    await this.audit.runWithAudit(
      (tx) => tx.contentBanner.delete({ where: { id } }),
      (r) => ({ adminId, action: 'DELETE_BANNER', targetType: 'PROPERTY', targetId: r.id, details: {} }),
    );
    return { id, deleted: true as const };
  }
}
