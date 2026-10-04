import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CorridorRegion } from '@prisma/client';
import { CURATED_CORRIDORS } from './corridors.data';

@Injectable()
export class CorridorsService implements OnModuleInit {
  private readonly logger = new Logger(CorridorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
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
          update: {
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
      this.logger.log(`Successfully synced ${CURATED_CORRIDORS.length} curated campervan corridors in PostgreSQL.`);
    } catch (error) {
      this.logger.error('Failed to sync campervan corridors:', error);
    }
  }

  /**
   * Get all active corridors, optionally filtered by exact region enum.
   */
  async findAll(region?: CorridorRegion) {
    const where: any = { isActive: true };
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
      GUJARAT_RAJASTHAN: all.filter((c) => c.region === CorridorRegion.GUJARAT_RAJASTHAN),
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
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!corridor) {
      throw new NotFoundException(`Corridor '${idOrSlug}' not found`);
    }

    return corridor;
  }
}
