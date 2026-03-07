import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup...');

  await prisma.walletTransaction.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.deliveryAssignment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pickupSlot.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.address.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.pricingConfiguration.deleteMany();

  // Delete all non-ADMIN users
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    const deleted = await prisma.user.deleteMany({ where: { roleId: { not: adminRole.id } } });
    console.log(`  Deleted ${deleted.count} non-admin user(s)`);
  }

  console.log('✅ Cleanup complete — admin user and roles preserved');
}

main().catch(console.error).finally(() => prisma.$disconnect());
