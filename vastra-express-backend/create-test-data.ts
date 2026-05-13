import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRIVER_SEED = {
  name: 'Sarvesh',
  mobileNumber: '8765434567',
  email: 'joy_kujur_mca@moderncoe.edu.in',
  employeeId: 'D001',
};

const DELIVERY_HOURS = [8, 9, 10, 11, 12];
const DELIVERIES_PER_HOUR = 5;
const SERVICE_TYPES = ['WASH_FOLD', 'DRY_CLEAN', 'IRON_ONLY'];

async function main() {
  try {
    const driverRole = await prisma.role.findUnique({ where: { name: 'DRIVER' } });
    if (!driverRole) {
      throw new Error('DRIVER role not found');
    }

    const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (!customerRole) {
      throw new Error('CUSTOMER role not found');
    }

    const admin = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });
    if (!admin) {
      throw new Error('No admin user found for assignments');
    }

    const facility = await prisma.facility.findFirst();
    if (!facility) {
      throw new Error('No facility found');
    }

    const driver = await ensureSarveshDriver(driverRole.id, facility.id);
    console.log('✅ Using driver Sarvesh:', driver.id);

    let customer = await prisma.user.findFirst({ where: { mobileNumber: '9777777777' } });
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          mobileNumber: '9777777777',
          roleId: customerRole.id,
          name: 'Test Customer',
        },
      });
    }

    let address = await prisma.address.findFirst({ where: { userId: customer.id } });
    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: customer.id,
          houseFlatNo: '123 Test House',
          street: 'MG Road',
          pincode: '411001',
          cityId: 1,
          latitude: 18.5204,
          longitude: 73.8567,
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let pickupSlot = await prisma.pickupSlot.findFirst({
      where: {
        facilityId: facility.id,
        slotDate: today,
        isActive: true,
      },
    });

    if (!pickupSlot) {
      pickupSlot = await prisma.pickupSlot.create({
        data: {
          facilityId: facility.id,
          slotDate: today,
          startTime: '09:00',
          endTime: '12:00',
          maxCapacity: 50,
          currentBookings: 0,
          isActive: true,
        },
      });
      console.log('✅ Created pickup slot for today');
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    console.log(
      `\n📋 Creating ${DELIVERY_HOURS.length * DELIVERIES_PER_HOUR} deliveries for Driver Sarvesh (5 per hour until 12 PM)...\n`,
    );

    let orderCount = 0;
    for (const hour of DELIVERY_HOURS) {
      for (let i = 0; i < DELIVERIES_PER_HOUR; i++) {
        const createdAt = new Date(dayStart);
        createdAt.setHours(hour, i * 12, 0, 0);

        const scheduledTime = `${String(hour).padStart(2, '0')}:${String(i * 12).padStart(2, '0')}`;
        const serviceType = SERVICE_TYPES[orderCount % SERVICE_TYPES.length];
        const orderNumber = `SAR-${String(hour).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}-${Date.now()}-${orderCount}`;

        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            addressId: address.id,
            facilityId: facility.id,
            pickupSlotId: pickupSlot.id,
            currentStatus: 'DELIVERY_ASSIGNED',
            serviceType,
            isExpress: orderCount % 3 === 0,
            initialWeight: 2.5 + orderCount * 0.1,
            customerNotes: `Seed delivery ${orderCount + 1} - ${serviceType} (${scheduledTime})`,
            createdAt,
          },
        });

        await prisma.deliveryAssignment.create({
          data: {
            orderId: order.id,
            driverId: driver.id,
            assignmentType: 'DELIVERY',
            assignedByUserId: admin.id,
            status: 'ASSIGNED',
            assignedAt: createdAt,
            notes: `Seed delivery assigned to ${DRIVER_SEED.name} at ${scheduledTime}`,
          },
        });

        console.log(
          `  ✓ Order ${orderCount + 1}: ${orderNumber} (${scheduledTime}) - ${serviceType} → Assigned to ${DRIVER_SEED.name}`,
        );
        orderCount++;
      }
    }

    console.log(`\n✅ Successfully created ${orderCount} deliveries assigned to Driver Sarvesh`);
  } finally {
    await prisma.$disconnect();
  }
}

async function ensureSarveshDriver(driverRoleId, facilityId) {
  const staffWithD001 = await prisma.staff.findFirst({
    where: { employeeId: DRIVER_SEED.employeeId },
    include: { user: true },
  });

  if (staffWithD001?.user) {
    const user = await prisma.user.update({
      where: { id: staffWithD001.userId },
      data: {
        name: DRIVER_SEED.name,
        mobileNumber: DRIVER_SEED.mobileNumber,
        email: DRIVER_SEED.email,
        roleId: driverRoleId,
        isActive: true,
      },
    });

    await prisma.staff.update({
      where: { id: staffWithD001.id },
      data: {
        employeeId: DRIVER_SEED.employeeId,
        facilityId,
        roleId: driverRoleId,
      },
    });

    return user;
  }

  let driver = await prisma.user.findFirst({
    where: { mobileNumber: DRIVER_SEED.mobileNumber },
  });

  if (!driver) {
    driver = await prisma.user.create({
      data: {
        mobileNumber: DRIVER_SEED.mobileNumber,
        roleId: driverRoleId,
        name: DRIVER_SEED.name,
        email: DRIVER_SEED.email,
        isActive: true,
      },
    });
  } else {
    driver = await prisma.user.update({
      where: { id: driver.id },
      data: {
        name: DRIVER_SEED.name,
        mobileNumber: DRIVER_SEED.mobileNumber,
        email: DRIVER_SEED.email,
        roleId: driverRoleId,
        isActive: true,
      },
    });
  }

  const existingStaff = await prisma.staff.findUnique({ where: { userId: driver.id } });
  if (!existingStaff) {
    await prisma.staff.create({
      data: {
        userId: driver.id,
        employeeId: DRIVER_SEED.employeeId,
        facilityId,
        roleId: driverRoleId,
      },
    });
  } else {
    await prisma.staff.update({
      where: { id: existingStaff.id },
      data: {
        employeeId: DRIVER_SEED.employeeId,
        facilityId,
        roleId: driverRoleId,
      },
    });
  }

  return driver;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
