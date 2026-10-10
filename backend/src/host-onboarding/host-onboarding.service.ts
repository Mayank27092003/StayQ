import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesService } from '../properties/properties.service';
import { EmailService } from '../notifications/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { integer, money, text } from '../common/utils/input.util';

@Injectable()
export class HostOnboardingService {
  private readonly logger = new Logger(HostOnboardingService.name);

  constructor(
    private prisma: PrismaService,
    private properties: PropertiesService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}
  createDraft(hostId: string, data: any) {
    return this.properties.create(data, { id: hostId });
  }

  updateStep(id: string, hostId: string, data: any) {
    return this.properties.update(id, data, { id: hostId });
  }
  async setRooms(id: string, hostId: string, rooms: any[]) {
    if (!Array.isArray(rooms) || rooms.length > 100)
      throw new BadRequestException('Invalid room inventory');
    const data = rooms.map((room) => ({
      propertyId: id,
      name: text(room.name, 'Room name', 200),
      totalRooms: integer(room.totalRooms, 'Room quantity', 1, 1000),
      guestCapacity: integer(room.guestCapacity, 'Room capacity', 1, 100),
      basePrice: money(room.basePrice, 'Room price'),
      weekendPrice:
        room.weekendPrice === undefined || room.weekendPrice === null
          ? null
          : money(room.weekendPrice, 'Weekend room price'),
      amenities:
        Array.isArray(room.amenities) &&
        room.amenities.every((v) => typeof v === 'string')
          ? room.amenities.slice(0, 100)
          : [],
    }));
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${id} FOR UPDATE`;
      const property = await tx.property.findUnique({ where: { id } });
      if (!property) throw new NotFoundException('Property not found');
      if (property.hostId !== hostId)
        throw new ForbiddenException(
          'Only the owner can change room inventory',
        );
      if (
        await tx.booking.count({
          where: { propertyId: id, roomTypeId: { not: null } },
        })
      )
        throw new ConflictException(
          'Room inventory with booking history cannot be replaced; update existing rooms individually',
        );
      await tx.roomType.deleteMany({ where: { propertyId: id } });
      if (data.length) await tx.roomType.createMany({ data });
      return tx.property.findUnique({
        where: { id },
        include: { roomTypes: true },
      });
    });
  }
  async submitProperty(id: string, hostId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${id} FOR UPDATE`;
      const p = await tx.property.findUnique({
        where: { id },
        include: {
          host: { include: { payoutAccount: true } },
          images: true,
          roomTypes: true,
        },
      });
      if (!p) throw new NotFoundException('Property not found');
      if (p.hostId !== hostId)
        throw new ForbiddenException('Only the owner can submit this property');
      if (p.status === 'PENDING_REVIEW') return { ...p, success: true };
      if (!['DRAFT', 'REJECTED', 'PAUSED'].includes(p.status))
        throw new ConflictException(
          'Property cannot be submitted from its current state',
        );
      if (p.host.hostStatus === 'SUSPENDED')
        throw new ForbiddenException('Host account is suspended');
      if (
        !p.title.trim() ||
        !p.description.trim() ||
        !p.address.trim() ||
        !p.city.trim() ||
        !p.state.trim() ||
        Number(p.pricePerNight) <= 0 ||
        !p.images.length
      )
        throw new BadRequestException(
          'Complete the listing description, location, images and positive price',
        );
      if (p.lat === null || p.lng === null || (p.lat === 0 && p.lng === 0))
        throw new BadRequestException('A real map location is required');
      if (!p.host.emailVerified && !p.host.phoneVerified)
        throw new BadRequestException(
          'Verify email or phone before submission',
        );

      const isOutdoorListing = p.type === 'RV' || p.type === 'CAMPING_SITE';

      // For standard residential stays, verify utility and property ownership docs
      if (!isOutdoorListing) {
        if (!p.electricityBillDocUrl) {
          throw new BadRequestException(
            'Property electricity bill is required for residential stay verification',
          );
        }
        if (p.ownershipType === 'OWNED' && !p.propertyRegistryDocUrl) {
          throw new BadRequestException(
            'Owned property registry document is required',
          );
        }
        if (
          p.ownershipType === 'LEASED_SUBLET' &&
          (!p.leaseAgreementDocUrl || !p.landlordNocDocUrl)
        ) {
          throw new BadRequestException(
            'Leased property requires its lease and landlord permission',
          );
        }
        if (p.isInsideGatedSociety && !p.societyNocDocUrl) {
          throw new BadRequestException('Society permission is required');
        }
      }

      const result = await tx.property.update({
        where: { id },
        data: { status: 'PENDING_REVIEW' },
      });

      // Dispatch confirmation email to Host, alert to Admin, and in-app/push notification
      const hostEmail = p.host.email || (p as any).contactEmail;
      if (hostEmail) {
        this.emailService
          .sendHostApplicationReceivedEmail({
            to: hostEmail,
            hostName: p.host.displayName || 'Host',
            propertyTitle: p.title,
            city: p.city,
          })
          .catch((err) =>
            this.logger.error('Failed to send host application email: ' + err.message),
          );
      }

      this.emailService
        .sendNewHostAdminAlert({
          hostName: p.host.displayName || 'Host',
          hostEmail: hostEmail || 'N/A',
          hostPhone: p.host.phone || 'N/A',
          propertyTitle: p.title,
          city: p.city,
        })
        .catch((err) =>
          this.logger.error('Failed to send admin host alert email: ' + err.message),
        );

      this.notificationsService
        .sendNotification(
          p.hostId,
          NotificationType.SYSTEM,
          'Host Application Under Review ⏳',
          `Your host application for "${p.title}" in ${p.city} has been submitted for review. The StayQ Trust & Safety team is reviewing your documents.`,
          {
            propertyId: p.id,
            eventKey: `host-applied:${p.id}`,
          },
        )
        .catch((err) =>
          this.logger.error('Failed to send host application push: ' + err.message),
        );

      return { ...result, success: true };
    });
  }
}

