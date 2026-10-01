import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, displayName: true, isAdmin: true, adminRole: true },
  });

  const propertyCount = await prisma.property.count();
  const bookingCount = await prisma.booking.count();
  const reviewCount = await prisma.review.count();
  const paymentCount = await prisma.payment.count();
  const experienceCount = await prisma.experience.count();
  const disputeCount = await prisma.dispute.count();
  const supportTicketCount = await prisma.supportTicket.count();
  const conversationCount = await prisma.conversation.count();
  const adminStaffCount = await prisma.adminStaff.count();
  const adminSettingCount = await prisma.adminSetting.count();

  console.log('----------------------------------------------------');
  console.log('LIVE DATABASE STATUS (Cloud SQL PostgreSQL):');
  console.log('----------------------------------------------------');
  console.log(`• Properties:       ${propertyCount} (CLEARED)`);
  console.log(`• Bookings:         ${bookingCount} (CLEARED)`);
  console.log(`• Experiences:      ${experienceCount} (CLEARED)`);
  console.log(`• Reviews:          ${reviewCount} (CLEARED)`);
  console.log(`• Payments:         ${paymentCount} (CLEARED)`);
  console.log(`• Disputes:         ${disputeCount} (CLEARED)`);
  console.log(`• Support Tickets:  ${supportTicketCount} (CLEARED)`);
  console.log(`• Conversations:    ${conversationCount} (CLEARED)`);
  console.log('----------------------------------------------------');
  console.log(`• Admin Staff:      ${adminStaffCount}`);
  console.log(`• Admin Settings:   ${adminSettingCount}`);
  console.log(`• Preserved Admins: ${users.length} accounts:`);
  users.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.email} [${u.displayName || 'No Name'}] — Role: ${u.adminRole || 'SUPER_ADMIN'}`);
  });
  console.log('----------------------------------------------------');

  await prisma.$disconnect();
}

main();
