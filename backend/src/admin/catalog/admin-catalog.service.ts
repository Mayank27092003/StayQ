import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PropertyCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import {
  CreateAmenityDto,
  UpdateAmenityDto,
  UpdateCategoryDto,
  UpsertCategoryDto,
} from './dto/catalog.dto';

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  // --------------------------------------------------------------------------
  // Categories
  // --------------------------------------------------------------------------

  /**
   * Lists every category the platform supports.
   *
   * The enum is the source of truth, so enum members without a metadata row are
   * still returned with `configured: false`. This shows the real state rather
   * than hiding categories that exist in data but have no presentation record.
   */
  async listCategories(activeOnly = false) {
    const [records, usage] = await Promise.all([
      this.prisma.catalogCategory.findMany({ orderBy: { displayOrder: 'asc' } }),
      this.prisma.property.groupBy({ by: ['category'], _count: { _all: true } }),
    ]);

    const byCategory = new Map(records.map((record) => [record.category, record]));
    const usageByCategory = new Map(usage.map((row) => [row.category, row._count._all]));

    const rows = Object.values(PropertyCategory).map((category) => {
      const record = byCategory.get(category);

      return {
        id: record?.id ?? null,
        category,
        configured: Boolean(record),
        // Falls back to the enum name so the UI always has a label to render.
        label: record?.label ?? category,
        description: record?.description ?? null,
        iconName: record?.iconName ?? null,
        imageUrl: record?.imageUrl ?? null,
        displayOrder: record?.displayOrder ?? 0,
        active: record?.active ?? true,
        propertyCount: usageByCategory.get(category) ?? 0,
        updatedAt: record?.updatedAt ?? null,
      };
    });

    const filtered = activeOnly ? rows.filter((row) => row.active) : rows;

    return filtered.sort(
      (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label),
    );
  }

  /** Creates or replaces the metadata row for one category. */
  async upsertCategory(dto: UpsertCategoryDto, adminId: string) {
    return this.audit.runWithAudit(
      (tx) =>
        tx.catalogCategory.upsert({
          where: { category: dto.category },
          create: {
            category: dto.category,
            label: dto.label,
            description: dto.description ?? null,
            iconName: dto.iconName ?? null,
            imageUrl: dto.imageUrl ?? null,
            displayOrder: dto.displayOrder ?? 0,
            active: dto.active ?? true,
            updatedById: adminId,
          },
          update: {
            label: dto.label,
            description: dto.description ?? null,
            iconName: dto.iconName ?? null,
            imageUrl: dto.imageUrl ?? null,
            ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
            ...(dto.active !== undefined ? { active: dto.active } : {}),
            updatedById: adminId,
          },
        }),
      (record) => ({
        adminId,
        action: 'UPSERT_CATALOG_CATEGORY',
        targetType: 'PROPERTY',
        targetId: record.id,
        details: { category: record.category, label: record.label, active: record.active },
      }),
    );
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, adminId: string) {
    const existing = await this.prisma.catalogCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category metadata not found.');

    const data: Prisma.CatalogCategoryUpdateInput = { updatedById: adminId };
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.iconName !== undefined) data.iconName = dto.iconName;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.active !== undefined) data.active = dto.active;

    return this.audit.runWithAudit(
      (tx) => tx.catalogCategory.update({ where: { id }, data }),
      (record) => ({
        adminId,
        action: 'UPDATE_CATALOG_CATEGORY',
        targetType: 'PROPERTY',
        targetId: record.id,
        details: { category: record.category, changedFields: Object.keys(dto) },
      }),
    );
  }

  // --------------------------------------------------------------------------
  // Amenities
  // --------------------------------------------------------------------------

  /**
   * Lists amenity definitions with real usage counts.
   *
   * Usage is counted against `Property.amenities`, which stores amenity keys as
   * a string array, so the count reflects genuine listing data.
   */
  async listAmenities(activeOnly = false) {
    const where: Prisma.AmenityWhereInput = activeOnly ? { active: true } : {};

    const amenities = await this.prisma.amenity.findMany({
      where,
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
    });

    const counts = await Promise.all(
      amenities.map((amenity) =>
        this.prisma.property.count({ where: { amenities: { has: amenity.key } } }),
      ),
    );

    return amenities.map((amenity, index) => ({ ...amenity, propertyCount: counts[index] }));
  }

  /**
   * Reports amenity keys present on properties that have no definition row, so
   * operators can see real gaps instead of an artificially clean list.
   */
  async listUndefinedAmenityKeys() {
    const [properties, defined] = await Promise.all([
      this.prisma.property.findMany({ select: { amenities: true } }),
      this.prisma.amenity.findMany({ select: { key: true } }),
    ]);

    const definedKeys = new Set(defined.map((row) => row.key));
    const counts = new Map<string, number>();

    for (const property of properties) {
      for (const key of property.amenities) {
        if (definedKeys.has(key)) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([key, propertyCount]) => ({ key, propertyCount }))
      .sort((a, b) => b.propertyCount - a.propertyCount);
  }

  async createAmenity(dto: CreateAmenityDto, adminId: string) {
    const existing = await this.prisma.amenity.findUnique({ where: { key: dto.key } });
    if (existing) throw new ConflictException(`An amenity with key "${dto.key}" already exists.`);

    return this.audit.runWithAudit(
      (tx) =>
        tx.amenity.create({
          data: {
            key: dto.key,
            label: dto.label,
            description: dto.description ?? null,
            iconName: dto.iconName ?? null,
            category: dto.category ?? null,
            displayOrder: dto.displayOrder ?? 0,
            active: dto.active ?? true,
            updatedById: adminId,
          },
        }),
      (record) => ({
        adminId,
        action: 'CREATE_AMENITY',
        targetType: 'PROPERTY',
        targetId: record.id,
        details: { key: record.key, label: record.label },
      }),
    );
  }

  async updateAmenity(id: string, dto: UpdateAmenityDto, adminId: string) {
    const existing = await this.prisma.amenity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Amenity not found.');

    const data: Prisma.AmenityUpdateInput = { updatedById: adminId };
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.iconName !== undefined) data.iconName = dto.iconName;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.active !== undefined) data.active = dto.active;

    return this.audit.runWithAudit(
      (tx) => tx.amenity.update({ where: { id }, data }),
      (record) => ({
        adminId,
        action: 'UPDATE_AMENITY',
        targetType: 'PROPERTY',
        targetId: record.id,
        details: { key: record.key, changedFields: Object.keys(dto) },
      }),
    );
  }

  /**
   * Removes an amenity definition. Refused while listings still reference the
   * key, because deleting it would leave those properties with an unresolvable
   * amenity. Deactivating is the correct action in that case.
   */
  async deleteAmenity(id: string, adminId: string) {
    const existing = await this.prisma.amenity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Amenity not found.');

    const inUse = await this.prisma.property.count({
      where: { amenities: { has: existing.key } },
    });

    if (inUse > 0) {
      throw new BadRequestException(
        `"${existing.key}" is used by ${inUse} propert${inUse === 1 ? 'y' : 'ies'} and cannot be deleted. Deactivate it instead.`,
      );
    }

    await this.audit.runWithAudit(
      (tx) => tx.amenity.delete({ where: { id } }),
      (record) => ({
        adminId,
        action: 'DELETE_AMENITY',
        targetType: 'PROPERTY',
        targetId: record.id,
        details: { key: record.key },
      }),
    );

    return { id, deleted: true as const };
  }
}
