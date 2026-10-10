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
    const rooms = source.roomCategories.map((r: any) => ({
      propertyId,
      name: text(r.categoryName || r.name, 'Room name', 200),
      totalRooms: integer(r.quantity ?? r.totalRooms, 'Room quantity', 1, 1000),
      guestCapacity: integer(
        r.maxGuests ?? r.guestCapacity,
        'Room capacity',
        1,
        100,
      ),
      basePrice: money(r.pricePerNight ?? r.basePrice, 'Room price'),
      weekendPrice:
        r.weekendPrice == null ? null : money(r.weekendPrice, 'Weekend price'),
      amenities: ['hasAc', 'hasTv', 'hasBalcony', 'hasBreakfast'].filter(
        (k) => r[k] === true,
      ),
    }));
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
  if (source.initialBlockedDates !== undefined) {
    if (
      !Array.isArray(source.initialBlockedDates) ||
      source.initialBlockedDates.length > 730
    )
      throw new BadRequestException('Invalid initial blocked dates');
    const dates = [
      ...new Set(
        source.initialBlockedDates.map((d: any) =>
          dateOnly(d, 'Blocked date').toISOString(),
        ),
      ),
    ] as string[];
    const blocks = dates.map((d) => ({
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
