import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get or create test address for admin user (id=4)
  const adminUser = await prisma.user.findUnique({ where: { id: 4 } });
  if (!adminUser) {
    console.error('Admin user not found');
    process.exit(1);
  }
  
  // Delete existing admin addresses and create fresh one
  await prisma.address.deleteMany({ where: { userId: 4 } });
  
  // Create address with real GPS coordinates (Pune city, India)
  const address = await prisma.address.create({
    data: {
      userId: 4,
      houseFlatNo: 'Test Admin Address',
      street: 'MG Road',
      pincode: '411001',
      cityId: 1,
      latitude: 18.5204, // Pune center
      longitude: 73.8567
    }
  });
  
  // Update facility with real GPS coordinates (near the address)
  const facility = await prisma.facility.upsert({
    where: { id: 3 },
    update: {
      latitude: 18.5300, // ~1.3 km from address
      longitude: 73.8600
    },
    create: {
      facilityCode: 'TEST_01',
      name: 'Test Facility',
      cityId: 1,
      address: 'Test Address',
      contactNumber: '1234567890',
      isActive: true,
      latitude: 18.5300,
      longitude: 73.8600
    }
  });
  
  console.log('✅ Test data created:');
  console.log('   Address ID:', address.id, `(${address.latitude}, ${address.longitude}) for admin user`);
  console.log('   Facility ID 3:', facility.id, `(${facility.latitude}, ${facility.longitude})`);
  
  // Create pickup slots for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const existingSlot = await prisma.pickupSlot.findFirst({
    where: {
      facilityId: 3,
      slotDate: tomorrow,
      startTime: '10:00'
    }
  });

  if (existingSlot) {
    await prisma.pickupSlot.update({
      where: { id: existingSlot.id },
      data: { isActive: true, currentBookings: 0 }
    });
  } else {
    await prisma.pickupSlot.create({
      data: {
        facilityId: 3,
        slotDate: tomorrow,
        startTime: '10:00',
        endTime: '12:00',
        maxCapacity: 10,
        currentBookings: 0,
        isActive: true
      }
    });
  }
  
  console.log('   Pickup slot:', `${tomorrow.toISOString().split('T')[0]} 10:00-12:00`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
