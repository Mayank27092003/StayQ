import { BadRequestException, ConflictException } from '@nestjs/common';
export function assertListingDocuments(p: any) {
  if (p.propertyDocsVerified) return;
  for (const key of [
    'ownerIdProofDocUrl',
    'selfieFaceProofDocUrl',
    'electricityBillDocUrl',
  ])
    if (!p[key])
      throw new BadRequestException(
        'Required listing document is missing: ' + key,
      );
  if (p.ownershipType === 'OWNED' && !p.propertyRegistryDocUrl)
    throw new BadRequestException('Property registry is required');
  if (
    p.ownershipType === 'LEASED_SUBLET' &&
    (!p.leaseAgreementDocUrl || !p.landlordNocDocUrl)
  )
    throw new BadRequestException('Lease and landlord permission are required');
  if (!['OWNED', 'LEASED_SUBLET'].includes(p.ownershipType))
    throw new BadRequestException('Ownership type is required');
  if (p.isInsideGatedSociety && !p.societyNocDocUrl)
    throw new BadRequestException('Society permission is required');
}
export function assertPublishable(p: any) {
  assertListingDocuments(p);
  if (
    !p.propertyDocsVerified ||
    !p.host?.isHostVerified ||
    p.host?.hostStatus !== 'APPROVED' ||
    p.host?.deletedAt ||
    !p.host?.payoutAccount?.verified ||
    !(p.host.emailVerified || p.host.phoneVerified)
  )
    throw new ConflictException(
      'Verified host, contact, payout and listing documents are required',
    );
  if (
    !p.title?.trim() ||
    !p.description?.trim() ||
    !p.address?.trim() ||
    !p.city?.trim() ||
    !p.state?.trim() ||
    Number(p.pricePerNight) <= 0 ||
    !p.images?.length ||
    p.lat === null ||
    p.lng === null ||
    (p.lat === 0 && p.lng === 0)
  )
    throw new BadRequestException(
      'Complete listing details, price, images and map location before publication',
    );
}
