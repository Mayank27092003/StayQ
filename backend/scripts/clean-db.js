const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    console.log("Cleaning database...");
    
    // Delete everything in order to avoid Foreign Key violations
    await prisma.adminAuditLog.deleteMany();
    await prisma.propertyImage.deleteMany();
    await prisma.roomType.deleteMany();
    await prisma.propertyTag.deleteMany();
    await prisma.property.deleteMany();
    await prisma.hostPayoutAccount.deleteMany();

    // Now safe to delete non-admin users
    const result = await prisma.user.deleteMany({
      where: {
        isAdmin: false
      }
    });

    console.log(`Successfully deleted ${result.count} non-admin users and all their associated properties/data.`);
  } catch (error) {
    console.error("Error cleaning DB:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
