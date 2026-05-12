import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'customer@test.com';

  console.log(`Seeding sample data for ${email}...`);

  const user = await prisma.user.findFirst({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    console.error(`❌ User ${email} not found. Run seed-test-customer.ts first.`);
    return;
  }

  // 1. Seed a City if none exists
  let city = await prisma.city.findFirst();
  if (!city) {
    city = await prisma.city.create({
      data: {
        name: 'Mumbai',
        state: 'Maharashtra',
      },
    });
    console.log('✅ Created sample city: Mumbai');
  }

  // 2. Seed a Facility if none exists
  let facility = await prisma.facility.findFirst();
  if (!facility) {
    facility = await prisma.facility.create({
      data: {
        facilityCode: 'ANDHERI_WEST_01',
        name: 'Andheri Central Facility',
        address: 'Veera Desai Road, Andheri West',
        cityId: city.id,
        latitude: 19.1363,
        longitude: 72.8277,
        contactNumber: '0221234567',
        isActive: true,
      },
    });
    console.log('✅ Created sample facility');
  }

  // 3. Seed an Address
  const existingAddress = await prisma.address.findFirst({
    where: { userId: user.id },
  });

  let address = existingAddress;
  if (!existingAddress) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        cityId: city.id,
        houseFlatNo: 'B-402, Sunshine Apts',
        street: 'Link Road, Andheri West',
        landmark: 'Near Infinity Mall',
        pincode: '400053',
        latitude: 19.1334,
        longitude: 72.8223,
        isDefault: true,
      },
    });
    console.log('✅ Created sample address');
  }

  // 4. Seed Pickup Slots for today and tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dates = [today, tomorrow];
  const timeSlots = [
    { start: '09:00', end: '11:00' },
    { start: '11:00', end: '13:00' },
    { start: '15:00', end: '17:00' },
  ];

  for (const date of dates) {
    for (const ts of timeSlots) {
      const existingSlot = await prisma.pickupSlot.findFirst({
        where: {
          facilityId: facility!.id,
          slotDate: date,
          startTime: ts.start,
          endTime: ts.end,
        }
      });

      if (!existingSlot) {
        await prisma.pickupSlot.create({
          data: {
            facilityId: facility!.id,
            slotDate: date,
            startTime: ts.start,
            endTime: ts.end,
            maxCapacity: 10,
            isActive: true,
          },
        });
      }
    }
  }
  console.log('✅ Ensured pickup slots exist');

  // 5. Seed sample orders
  const existingOrders = await prisma.order.findMany({
    where: { customerId: user.id },
  });

  if (existingOrders.length === 0) {
    const slot = await prisma.pickupSlot.findFirst({
      where: { facilityId: facility!.id, isActive: true },
    });

    if (slot) {
      await prisma.order.create({
        data: {
          customerId: user.id,
          addressId: address!.id,
          facilityId: facility!.id,
          pickupSlotId: slot.id,
          orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          serviceType: 'WASH_FOLD',
          isExpress: false,
          currentStatus: 'ORDER_CONFIRMED',
        },
      });

      await prisma.order.create({
        data: {
          customerId: user.id,
          addressId: address!.id,
          facilityId: facility!.id,
          pickupSlotId: slot.id,
          orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          serviceType: 'DRY_CLEAN',
          isExpress: true,
          currentStatus: 'DELIVERED',
        },
      });
      console.log('✅ Created sample orders');
    }
  }

  console.log('\n✨ Sample data seeding complete!');
  console.log('   You can now see orders and addresses in the app.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding sample data:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
