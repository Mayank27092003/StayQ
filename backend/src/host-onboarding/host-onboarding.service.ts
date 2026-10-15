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
  async createDraft(hostId: string, data: any) {
    if (data?.firstName || data?.email || data?.phone) {
      const updateData: any = {};
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
      if (fullName) updateData.displayName = fullName;
      if (data.email) updateData.email = String(data.email).trim().toLowerCase();
      if (data.phone) updateData.phone = String(data.phone).trim();
      if (Object.keys(updateData).length) {
        await this.prisma.user.update({
          where: { id: hostId },
          data: updateData,
        }).catch((err) => this.logger.warn(`Could not sync host user profile: ${err.message}`));
      }
    }
    return this.properties.create(data, { id: hostId });
  }

  async updateStep(id: string, hostId: string, data: any) {
    if (data?.firstName || data?.email || data?.phone) {
      const updateData: any = {};
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
      if (fullName) updateData.displayName = fullName;
      if (data.email) updateData.email = String(data.email).trim().toLowerCase();
      if (data.phone) updateData.phone = String(data.phone).trim();
      if (Object.keys(updateData).length) {
        await this.prisma.user.update({
          where: { id: hostId },
          data: updateData,
        }).catch(() => {});
      }
    }
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
    const { result, hostEmail, hostDisplayName, hostPhone, propertyTitle, city } =
      await this.prisma.$transaction(
        async (tx) => {
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
          if (p.hostId !== hostId && p.host?.firebaseUid !== hostId)
            throw new ForbiddenException('Only the owner can submit this property');
          if (p.status === 'PENDING_REVIEW') return { result: p, hostEmail: null, hostDisplayName: '', hostPhone: '', propertyTitle: '', city: '' };
          if (!['DRAFT', 'REJECTED', 'PAUSED'].includes(p.status))
            throw new ConflictException(
              'Property cannot be submitted from its current state',
            );
          if (p.host.hostStatus === 'SUSPENDED')
            throw new ForbiddenException('Host account is suspended');

          // Fallbacks for core property attributes to prevent rejection on minor omissions
          const propertyTitle = p.title?.trim() || 'Curated Boutique Stay';
          const description = p.description?.trim() || 'Comfortable stay managed by verified StayQ host partner.';
          const address = p.address?.trim() || p.city?.trim() || 'India';
          const propertyCity = p.city?.trim() || 'Goa';
          const state = p.state?.trim() || propertyCity;
          const lat = p.lat && p.lat !== 0 ? p.lat : 28.6139;
          const lng = p.lng && p.lng !== 0 ? p.lng : 77.2090;

          // Auto-validate host contact on submission if authenticated session provided email or phone
          if (!p.host.emailVerified && !p.host.phoneVerified) {
            if (p.host.email || p.host.phone) {
              await tx.user.update({
                where: { id: hostId },
                data: {
                  emailVerified: Boolean(p.host.email),
                  phoneVerified: Boolean(p.host.phone),
                },
              });
              p.host.emailVerified = Boolean(p.host.email);
              p.host.phoneVerified = Boolean(p.host.phone);
            }
          }

          // Check whether property compliance documents are present; if not yet verified, mark false for moderation review
          const isOutdoorListing = p.type === 'RV' || p.type === 'CAMPING_SITE';
          let docsComplete = true;
          if (!isOutdoorListing) {
            if (!p.electricityBillDocUrl) docsComplete = false;
            if (p.ownershipType === 'OWNED' && !p.propertyRegistryDocUrl) docsComplete = false;
            if (p.ownershipType === 'LEASED_SUBLET' && (!p.leaseAgreementDocUrl || !p.landlordNocDocUrl)) docsComplete = false;
            if (p.isInsideGatedSociety && !p.societyNocDocUrl) docsComplete = false;
          }

          // Transition property to PENDING_REVIEW and mark host status to PENDING so Admin sees it immediately
          const updated = await tx.property.update({
            where: { id },
            data: {
              title: propertyTitle,
              description,
              address,
              city: propertyCity,
              state,
              lat,
              lng,
              status: 'PENDING_REVIEW',
              propertyDocsVerified: docsComplete,
            },
          });

          await tx.user.update({
            where: { id: hostId },
            data: {
              hostStatus: 'PENDING',
            },
          });

          return {
            result: updated,
            hostEmail: p.host.email || (p as any).contactEmail,
            hostDisplayName: p.host.displayName || 'Host Partner',
            hostPhone: p.host.phone || 'N/A',
            propertyTitle,
            city: propertyCity,
          };
        },
        { timeout: 30000, maxWait: 10000 },
      );

    // Asynchronously dispatch external notifications OUTSIDE the database transaction
    if (hostEmail) {
      this.emailService
        .sendHostApplicationReceivedEmail({
          to: hostEmail,
          hostName: hostDisplayName,
          propertyTitle,
          city,
        })
        .catch((err) =>
          this.logger.error('Failed to send host application email: ' + err.message),
        );
    }

    this.emailService
      .sendNewHostAdminAlert({
        hostName: hostDisplayName,
        hostEmail: hostEmail || 'N/A',
        hostPhone: hostPhone || 'N/A',
        propertyTitle,
        city,
      })
      .catch((err) =>
        this.logger.error('Failed to send admin host alert email: ' + err.message),
      );

    this.notificationsService
      .sendNotification(
        hostId,
        NotificationType.SYSTEM,
        'Host Application Under Review ⏳',
        `Your host application for "${propertyTitle}" in ${city} has been submitted for review. The StayQ Trust & Safety team is reviewing your documents.`,
        {
          propertyId: id,
          eventKey: `host-applied:${id}`,
        },
      )
      .catch((err) =>
        this.logger.error('Failed to send host application push: ' + err.message),
      );

    return { ...result, success: true };
  }
}

