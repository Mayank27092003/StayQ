import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { safeDownload } from '../common/utils/safe-fetch.util';
import { dateOnly } from '../common/utils/input.util';
@Injectable()
export class CalendarSyncService {
  constructor(private prisma: PrismaService) {}
  async generateIcal(propertyId: string): Promise<string> {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PENDING_HOST_APPROVAL'] } },
        },
        availabilityBlocks: { where: { type: 'HOST_BLOCKED' } },
      },
    });
    if (!p) throw new NotFoundException('Property not found');
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const events = [
      ...p.bookings.map((b) => ({
        id: 'booking-' + b.id,
        start: b.checkIn,
        end: b.checkOut,
      })),
      ...p.availabilityBlocks.map((b) => ({
        id: 'block-' + b.id,
        start: b.startDate,
        end: b.endDate,
      })),
    ];
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StayQ//Availability//EN',
      'CALSCALE:GREGORIAN',
    ];
    for (const e of events)
      lines.push(
        'BEGIN:VEVENT',
        'UID:' + e.id + '@stayq.space',
        'DTSTAMP:' +
          new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}Z$/, 'Z'),
        'DTSTART;VALUE=DATE:' + fmt(e.start),
        'DTEND;VALUE=DATE:' + fmt(e.end),
        'SUMMARY:Reserved',
        'END:VEVENT',
      );
    return lines.concat('END:VCALENDAR', '').join('\r\n');
  }
  async syncIcal(propertyId: string, value: string) {
    if (typeof value !== 'string' || value.length > 4096)
      throw new BadRequestException('Invalid calendar URL');
    const allowed = (
      process.env.CALENDAR_ALLOWED_HOSTS ||
      'www.airbnb.com,airbnb.com,www.vrbo.com,vrbo.com'
    )
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
    const raw = (await safeDownload(value, allowed)).toString('utf8');
    const events = this.parseIcalEvents(raw).filter(
      (e) => e.endDate > new Date(),
    );
    const source =
      'CALENDAR:' + createHash('sha256').update(value).digest('hex');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${propertyId} FOR UPDATE`;
      if (!(await tx.property.findUnique({ where: { id: propertyId } })))
        throw new NotFoundException('Property not found');
      // Only this feed's imported blocks can be replaced. Manual and other feeds survive.
      await tx.availabilityBlock.deleteMany({
        where: { propertyId, type: 'HOST_BLOCKED', source },
      });
      if (events.length)
        await tx.availabilityBlock.createMany({
          data: events.map((e) => ({
            propertyId,
            type: 'HOST_BLOCKED' as const,
            source,
            startDate: e.startDate,
            endDate: e.endDate,
          })),
        });
      return {
        success: true,
        importedCount: events.length,
        message: 'Calendar synchronized',
      };
    });
  }
  private parseIcalEvents(
    raw: string,
  ): Array<{ startDate: Date; endDate: Date }> {
    const unfolded = raw.replace(/\r?\n[ \t]/g, '');
    if (
      !/^BEGIN:VCALENDAR\r?\n/i.test(unfolded) ||
      !/(?:^|\n)END:VCALENDAR\s*$/i.test(unfolded)
    )
      throw new BadRequestException('Invalid iCalendar feed');
    const blocks = [
      ...unfolded.matchAll(
        /(?:^|\n)BEGIN:VEVENT\r?\n([\s\S]*?)\r?\nEND:VEVENT(?:\r?\n|$)/gi,
      ),
    ];
    if (
      blocks.length !== (unfolded.match(/BEGIN:VEVENT/g) || []).length ||
      blocks.length > 2000
    )
      throw new BadRequestException('Invalid or oversized iCalendar feed');
    const events: Array<{ startDate: Date; endDate: Date }> = [];
    for (const [, b] of blocks) {
      if (/^STATUS:CANCELLED\s*$/im.test(b)) continue;
      if (/^(RRULE|RDATE|EXDATE|DURATION)[;:]/im.test(b))
        throw new BadRequestException(
          'Calendar recurrence or duration is unsupported; provide explicit date ranges',
        );
      const start = /^DTSTART(?:;([^:]+))?:([^\r\n]+)$/im.exec(b),
        end = /^DTEND(?:;([^:]+))?:([^\r\n]+)$/im.exec(b);
      if (!start) throw new BadRequestException('Calendar event has no start');
      if ([start, end].some((m) => m?.[1] && m[1] !== 'VALUE=DATE'))
        throw new BadRequestException(
          'Calendar timezone parameters are unsupported; use date-only events',
        );
      const startDate = this.parseIcalDateString(start[2]);
      const endDate = end
        ? this.parseIcalDateString(end[2])
        : new Date(startDate.getTime() + 86400000);
      if (endDate <= startDate)
        throw new BadRequestException(
          'Calendar event end must follow its start',
        );
      events.push({ startDate, endDate });
    }
    return events;
  }
  private parseIcalDateString(s: string) {
    if (!/^\d{8}$/.test(s))
      throw new BadRequestException('Use all-day date-only calendar events');
    return dateOnly(
      s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8),
      'Calendar date',
    );
  }
}
