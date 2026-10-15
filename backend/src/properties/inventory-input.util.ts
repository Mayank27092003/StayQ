import { BadRequestException, ConflictException } from '@nestjs/common';
import { dateOnly, integer, money, text } from '../common/utils/input.util';
/** Called while holding the property lock; historical room IDs are preserved. */
export async function saveDraftInventory(
  tx: any,
  propertyId: string,
  source: any,
) {
  if (source.roomCategories !== undefined) {
    if (
      !Array.isArray(source.roomCategories) ||
      source.roomCategories.length > 100
    )
      throw new BadRequestException('Invalid room categories');
    const old = await tx.roomType.findMany({ where: { propertyId } });
    const rooms = source.roomCategories.map((r: any) => {
      const parsedBase = Number(r.pricePerNight ?? r.basePrice ?? source.pricePerNight ?? 1000);
      const safeBase = Number.isFinite(parsedBase) && parsedBase > 0 ? Math.round(parsedBase * 100) / 100 : 1000;
      const parsedWeekend = r.weekendPrice != null ? Number(r.weekendPrice) : null;
      const safeWeekend = parsedWeekend != null && Number.isFinite(parsedWeekend) && parsedWeekend > 0
        ? Math.round(parsedWeekend * 100) / 100
        : null;

      return {
        propertyId,
        name: String(r.categoryName || r.name || 'Standard Room').trim().slice(0, 200) || 'Standard Room',
        totalRooms: Math.max(1, Math.min(1000, Math.round(Number(r.quantity ?? r.totalRooms ?? 1)) || 1)),
        guestCapacity: Math.max(1, Math.min(100, Math.round(Number(r.maxGuests ?? r.guestCapacity ?? 2)) || 2)),
        basePrice: safeBase,
        weekendPrice: safeWeekend,
        amenities: ['hasAc', 'hasTv', 'hasBalcony', 'hasBreakfast'].filter(
          (k) => r[k] === true,
        ),
      };
    });
    const unchanged =
      rooms.length === old.length &&
      rooms.every(
        (r: any, i: number) =>
          old[i].name === r.name &&
          old[i].totalRooms === r.totalRooms &&
          old[i].guestCapacity === r.guestCapacity &&
          Number(old[i].basePrice) === r.basePrice &&
          Number(old[i].weekendPrice || 0) === Number(r.weekendPrice || 0),
      );
    if (unchanged) {
      for (let i = 0; i < rooms.length; i++)
        await tx.roomType.update({
          where: { id: old[i].id },
          data: { amenities: rooms[i].amenities },
        });
    }
    if (!unchanged) {
      if (
        await tx.booking.count({
          where: { propertyId, roomTypeId: { not: null } },
        })
      )
        throw new ConflictException(
          'Room inventory with booking history requires an individual inventory edit',
        );
      await tx.roomType.deleteMany({ where: { propertyId } });
      if (rooms.length) await tx.roomType.createMany({ data: rooms });
    }
  }
  const rawBlocked = source.initialBlockedDates ?? source.blockedDates;
  if (rawBlocked !== undefined && Array.isArray(rawBlocked)) {
    const dates: string[] = [];
    for (const d of rawBlocked.slice(0, 730)) {
      try {
        const dt = new Date(d);
        if (!isNaN(dt.getTime())) {
          dates.push(dt.toISOString());
        }
      } catch (_) {}
    }
    const uniqueDates = [...new Set(dates)];
    const blocks = uniqueDates.map((d) => ({
      propertyId,
      type: 'HOST_BLOCKED',
      source: 'MANUAL',
      startDate: new Date(d),
      endDate: new Date(new Date(d).getTime() + 86400000),
    }));
    for (const block of blocks)
      if (
        await tx.booking.findFirst({
          where: {
            propertyId,
            status: {
              in: ['PENDING_PAYMENT', 'PENDING_HOST_APPROVAL', 'CONFIRMED'],
            },
            checkIn: { lt: block.endDate },
            checkOut: { gt: block.startDate },
          },
        })
      )
        throw new ConflictException('Blocked dates overlap a reservation');
    await tx.availabilityBlock.deleteMany({
      where: {
        propertyId,
        type: 'HOST_BLOCKED',
        OR: [{ source: null }, { source: 'MANUAL' }],
      },
    });
    if (blocks.length) await tx.availabilityBlock.createMany({ data: blocks });
  }
}
