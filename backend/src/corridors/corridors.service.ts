import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CorridorRegion } from '@prisma/client';
import { CURATED_CORRIDORS } from './corridors.data';

@Injectable()
export class CorridorsService implements OnModuleInit {
  private readonly logger = new Logger(CorridorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.SEED_CORRIDORS === 'true')
      await this.seedCorridorsIfNecessary();
  }

  /**
   * Seed all 30 curated corridors into PostgreSQL if not present,
   * or upsert them so any updates stay synchronized with verified data.
   */
  async seedCorridorsIfNecessary() {
    try {
      this.logger.log('Checking campervan corridors in database...');
      for (const item of CURATED_CORRIDORS) {
        await this.prisma.campervanCorridor.upsert({
          where: { slug: item.slug },
          update: {},
          create: {
            slug: item.slug,
            region: item.region,
            name: item.name,
            sortOrder: item.sortOrder,
            durationMinDays: item.durationMinDays,
            durationMaxDays: item.durationMaxDays,
            distanceKm: item.distanceKm,
            stops: item.stops,
            theme: item.theme,
            description: item.description,
            sourceName: item.sourceName,
            sourceUrl: item.sourceUrl,
            permits: item.permits,
            advisoryNotes: item.advisoryNotes,
            badge: item.badge,
            highlights: item.highlights,
            imageKey: item.imageKey,
            isActive: true,
          },
        });
      }
      this.logger.log(
        `Successfully synced ${CURATED_CORRIDORS.length} curated campervan corridors in PostgreSQL.`,
      );
    } catch (error) {
      this.logger.error('Failed to sync campervan corridors:', error);
    }
  }

  /**
   * Get all active corridors, optionally filtered by exact region enum.
   */
  async findAll(region?: CorridorRegion) {
    const where: any = { isActive: true };
    if (region && !Object.values(CorridorRegion).includes(region))
      throw new BadRequestException('Invalid corridor region');
    if (region) {
      where.region = region;
    }
    return this.prisma.campervanCorridor.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Group corridors by the 4 distinct regions.
   */
  async getGroupedByRegion() {
    const all = await this.findAll();
    return {
      NORTH_INDIA: all.filter((c) => c.region === CorridorRegion.NORTH_INDIA),
      SOUTH_INDIA: all.filter((c) => c.region === CorridorRegion.SOUTH_INDIA),
      GUJARAT_RAJASTHAN: all.filter(
        (c) => c.region === CorridorRegion.GUJARAT_RAJASTHAN,
      ),
      NORTH_EAST: all.filter((c) => c.region === CorridorRegion.NORTH_EAST),
      totalCount: all.length,
    };
  }

  /**
   * Find corridor by UUID or unique slug.
   */
  async findBySlugOrId(idOrSlug: string) {
    const corridor = await this.prisma.campervanCorridor.findFirst({
      where: {
        isActive: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!corridor) {
      throw new NotFoundException(`Corridor '${idOrSlug}' not found`);
    }

    return corridor;
  }

  /**
   * Create a new custom or host-created overland corridor.
   */
  async createCorridor(data: {
    name: string;
    region?: CorridorRegion;
    durationMinDays?: number;
    durationMaxDays?: number;
    distanceKm?: number;
    stops?: string[];
    theme?: string;
    description?: string;
    highlights?: string[];
    permits?: string[];
    sourceName?: string;
  }) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      throw new BadRequestException('Corridor name is required');
    }

    const slugBase = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${slugBase || 'custom-corridor'}-${randomSuffix}`;

    return this.prisma.campervanCorridor.create({
      data: {
        slug,
        region: data.region && Object.values(CorridorRegion).includes(data.region)
          ? data.region
          : CorridorRegion.NORTH_INDIA,
        name: data.name.trim(),
        sortOrder: 200,
        durationMinDays: Math.max(1, Number(data.durationMinDays) || 2),
        durationMaxDays: Math.max(1, Number(data.durationMaxDays) || 5),
        distanceKm: Math.max(10, Number(data.distanceKm) || 200),
        stops: Array.isArray(data.stops) ? data.stops.filter((s) => typeof s === 'string' && s.trim()) : [],
        theme: data.theme?.trim() || 'Overland Explorer',
        description: data.description?.trim() || `Overland Corridor: ${data.name.trim()}`,
        highlights: Array.isArray(data.highlights) ? data.highlights.filter((h) => typeof h === 'string' && h.trim()) : [],
        permits: Array.isArray(data.permits) ? data.permits.filter((p) => typeof p === 'string' && p.trim()) : [],
        sourceName: data.sourceName?.trim() || 'Host Created',
        isActive: true,
      },
    });
  }
}

