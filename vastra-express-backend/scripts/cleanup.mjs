import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database cleanup...');

  try {
    // The order of deletion is important to avoid foreign key constraint violations
    
    console.log('  - Deleting Reviews...');
    await prisma.review.deleteMany();

    console.log('  - Deleting Delivery Assignments...');
    await prisma.deliveryAssignment.deleteMany();

    console.log('  - Deleting Order Status History...');
    await prisma.orderStatusHistory.deleteMany();

    console.log('  - Deleting Orders...');
    await prisma.order.deleteMany();

    console.log('  - Deleting Inventory Logs...');
    await prisma.inventoryLog.deleteMany();

    console.log('  - Deleting Inventory Items...');
    await prisma.inventoryItem.deleteMany();

    console.log('  - Deleting Pickup Slots...');
    await prisma.pickupSlot.deleteMany();

    console.log('  - Deleting Staff profiles...');
    await prisma.staff.deleteMany();

    console.log('  - Deleting Addresses...');
    await prisma.address.deleteMany();

    // Preserve ADMIN role and users
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (adminRole) {
      const { count } = await prisma.user.deleteMany({
        where: {
          roleId: { not: adminRole.id },
        },
      });
      console.log(`  - Deleted ${count} non-admin user(s)`);
    } else {
      console.log('  - ⚠️ ADMIN role not found, skipping user deletion to prevent accidental loss.');
    }

    // Optional: Facilities and Cities are usually master data/setup.
    // If you want to clear them too, uncomment the following:
    // console.log('  - Deleting Facilities...');
    // await prisma.facility.deleteMany();
    // console.log('  - Deleting Cities...');
    // await prisma.city.deleteMany();

    console.log('✅ Cleanup complete. Admin users and Roles have been preserved.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
