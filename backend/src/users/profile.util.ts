import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export function profileView(user: any) {
  const isPro = Boolean(
    user.isHostPro &&
    user.hostProExpiresAt &&
    user.hostProExpiresAt > new Date(),
  );
  return {
    ...user,
    isEmailVerified: user.emailVerified === true,
    isPhoneVerified: user.phoneVerified === true,
    isHostPro: isPro,
    isProSubscriber: isPro,
  };
}
export async function updateUserProfile(
  prisma: PrismaService,
  userId: string,
  dto: any,
) {
  const current = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });
  const allowed = [
    'displayName',
    'photoUrl',
    'bio',
    'email',
    'phone',
    'location',
    'gender',
    'dob',
  ];
  const data: any = {};
  for (const key of Object.keys(dto)) {
    if (!allowed.includes(key)) {
      if (['firstName', 'lastName', 'avatarUrl', 'id'].includes(key)) {
        continue;
      }
      throw new BadRequestException(`Profile field ${key} cannot be updated`);
    }
    if (key === 'displayName') {
      if (typeof dto[key] === 'string' && dto[key].trim().length > 0) {
        data.displayName = dto[key].trim().slice(0, 500);
      } else {
        data.displayName = current.displayName || 'Stay Q Traveler';
      }
      continue;
    }
    if (dto[key] === null || dto[key] === undefined) {
      data[key] = null;
      continue;
    }
    if (typeof dto[key] !== 'string') {
      throw new BadRequestException(`Invalid ${key}`);
    }
    const val = dto[key].trim();
    if (val.length > (key === 'bio' ? 2000 : 500)) {
      throw new BadRequestException(`Invalid ${key}`);
    }
    data[key] = val.length > 0 ? val : null;
  }
  if ('email' in data && data.email) {
    data.email = data.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      throw new BadRequestException('Invalid email');
    if (data.email !== current.email) data.emailVerified = false;
  }
  if ('phone' in data && data.phone) {
    if (!/^\+?[0-9 ()-]{10,20}$/.test(data.phone))
      throw new BadRequestException('Invalid phone');
    if (data.phone !== current.phone) data.phoneVerified = false;
  }
  if ('dob' in data && data.dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dob))
      throw new BadRequestException('Date of birth must be YYYY-MM-DD');
    const dob = new Date(data.dob + 'T00:00:00Z');
    if (
      !Number.isFinite(dob.getTime()) ||
      dob.toISOString().slice(0, 10) !== data.dob ||
      dob > new Date() ||
      dob.getUTCFullYear() < 1900
    )
      throw new BadRequestException('Invalid date of birth');
    data.dob = dob;
  }
  return profileView(await prisma.user.update({ where: { id: userId }, data }));
}
