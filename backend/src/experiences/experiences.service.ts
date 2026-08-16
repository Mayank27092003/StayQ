import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Experience, ExperienceCategory, PropertyStatus } from '@prisma/client';

@Injectable()
export class ExperiencesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Experience> {
    let hostId = data.hostId;
    if (!hostId) {
      const defaultHost = await this.prisma.user.findFirst();
      if (defaultHost) {
        hostId = defaultHost.id;
      } else {
        const newHost = await this.prisma.user.create({
          data: {
            firebaseUid: `admin-exp-host-${Date.now()}`,
            email: 'host@stayq.space',
            displayName: 'Stay Q Experience Host',
            roles: ['HOST'],
            isAdmin: true,
          },
        });
        hostId = newHost.id;
      }
    }

    let category: ExperienceCategory = ExperienceCategory.ADVENTURE;
    const catStr = (data.category || '').toUpperCase().replace(/[\s&]+/g, '_');
    if (Object.values(ExperienceCategory).includes(catStr as ExperienceCategory)) {
      category = catStr as ExperienceCategory;
    }

    const experience = await this.prisma.experience.create({
      data: {
        hostId,
        title: data.title || 'Untitled Experience',
        description: data.description || '',
        category,
        durationMinutes: Number(data.durationMinutes || 120),
        maxGroupSize: Number(data.maxGroupSize || 10),
        pricePerPerson: Number(data.pricePerPerson || data.price || 1500),
        includes: Array.isArray(data.includes) ? data.includes : [],
        whatToBring: Array.isArray(data.whatToBring) ? data.whatToBring : [],
        location: data.location || data.city || 'Goa',
        meetingPoint: data.meetingPoint || '',
        lat: data.lat ? Number(data.lat) : null,
        lng: data.lng ? Number(data.lng) : null,
        status: data.status || PropertyStatus.ACTIVE,
      },
      include: {
        images: true,
        slots: true,
        host: true,
      },
    });

    if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
      for (let i = 0; i < data.imageUrls.length; i++) {
        const url = data.imageUrls[i];
        if (typeof url === 'string' && url.trim()) {
          await this.prisma.experienceImage.create({
            data: {
              experienceId: experience.id,
              url: url.trim(),
              order: i,
            },
          }).catch(() => {});
        }
      }
    }

    return experience;
  }

  async findAll(adminView: boolean = false): Promise<Experience[]> {
    return this.prisma.experience.findMany({
      where: adminView ? undefined : { status: PropertyStatus.ACTIVE },
      include: {
        images: true,
        slots: true,
        host: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Experience | null> {
    return this.prisma.experience.findUnique({
      where: { id },
      include: {
        images: true,
        slots: true,
        host: true,
      },
    });
  }

  async update(id: string, updateDto: any): Promise<Experience> {
    const data: any = {};
    if (updateDto.title !== undefined) data.title = updateDto.title;
    if (updateDto.description !== undefined) data.description = updateDto.description;
    if (updateDto.category !== undefined) {
      const catStr = updateDto.category.toUpperCase().replace(/[\s&]+/g, '_');
      if (Object.values(ExperienceCategory).includes(catStr as ExperienceCategory)) {
        data.category = catStr as ExperienceCategory;
      }
    }
    if (updateDto.durationMinutes !== undefined) data.durationMinutes = Number(updateDto.durationMinutes);
    if (updateDto.maxGroupSize !== undefined) data.maxGroupSize = Number(updateDto.maxGroupSize);
    if (updateDto.pricePerPerson !== undefined) data.pricePerPerson = Number(updateDto.pricePerPerson);
    if (updateDto.price !== undefined && updateDto.pricePerPerson === undefined) data.pricePerPerson = Number(updateDto.price);
    if (updateDto.location !== undefined) data.location = updateDto.location;
    if (updateDto.meetingPoint !== undefined) data.meetingPoint = updateDto.meetingPoint;
    if (updateDto.lat !== undefined) data.lat = Number(updateDto.lat) || null;
    if (updateDto.lng !== undefined) data.lng = Number(updateDto.lng) || null;
    if (updateDto.status !== undefined) data.status = updateDto.status;
    if (Array.isArray(updateDto.includes)) data.includes = updateDto.includes;
    if (Array.isArray(updateDto.whatToBring)) data.whatToBring = updateDto.whatToBring;

    return this.prisma.experience.update({
      where: { id },
      data,
      include: {
        images: true,
        slots: true,
        host: true,
      },
    });
  }

  async remove(id: string): Promise<Experience> {
    return this.prisma.experience.delete({ where: { id } });
  }

  async findSlots(experienceId: string) {
    return this.prisma.experienceSlot.findMany({ where: { experienceId } });
  }
}
