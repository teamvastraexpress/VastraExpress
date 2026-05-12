/**
 * Seed customers + orders spanning the past 2-3 months.
 * Run: node scripts/seed-orders.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIG = {
  customers: intEnv('SEED_CUSTOMERS', 30),
  orders: intEnv('SEED_ORDERS', 240),
  drivers: intEnv('SEED_DRIVERS', 6),
  staff: intEnv('SEED_STAFF', 2),
  minDaysBack: intEnv('SEED_DAYS_MIN', 60),
  maxDaysBack: intEnv('SEED_DAYS_MAX', 90),
  facilityId: intEnv('SEED_FACILITY_ID', 0),
  cityName: process.env.SEED_CITY_NAME ?? 'Pune',
  cityState: process.env.SEED_CITY_STATE ?? 'Maharashtra',
};

const SERVICE_TYPES = [
  { value: 'WASH_FOLD', weight: 0.6 },
  { value: 'DRY_CLEAN', weight: 0.25 },
  { value: 'IRON_ONLY', weight: 0.15 },
];

const MAIN_FLOW = [
  'ORDER_CREATED',
  'ORDER_CONFIRMED',
  'PICKUP_SCHEDULED',
  'PICKUP_ASSIGNED',
  'OUT_FOR_PICKUP',
  'PICKUP_ARRIVED',
  'PICKED_UP',
  'RECEIVED_AT_FACILITY',
  'SORTING',
  'WASHING',
  'IRONING',
  'PACKING',
  'READY_FOR_DISPATCH',
  'DELIVERY_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERY_ARRIVED',
  'DELIVERED',
];

const FAILURE_TIMELINES = {
  CANCELLED: ['ORDER_CREATED', 'ORDER_CONFIRMED', 'CANCELLED'],
  PICKUP_FAILED: [
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'PICKUP_SCHEDULED',
    'PICKUP_ASSIGNED',
    'OUT_FOR_PICKUP',
    'PICKUP_FAILED',
  ],
  PROCESSING_ISSUE: [
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'PICKUP_SCHEDULED',
    'PICKUP_ASSIGNED',
    'OUT_FOR_PICKUP',
    'PICKUP_ARRIVED',
    'PICKED_UP',
    'RECEIVED_AT_FACILITY',
    'SORTING',
    'PROCESSING_ISSUE',
  ],
  DELIVERY_FAILED: [
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'PICKUP_SCHEDULED',
    'PICKUP_ASSIGNED',
    'OUT_FOR_PICKUP',
    'PICKUP_ARRIVED',
    'PICKED_UP',
    'RECEIVED_AT_FACILITY',
    'SORTING',
    'WASHING',
    'IRONING',
    'PACKING',
    'READY_FOR_DISPATCH',
    'DELIVERY_ASSIGNED',
    'OUT_FOR_DELIVERY',
    'DELIVERY_FAILED',
  ],
};

const DRIVER_STATUSES = new Set([
  'OUT_FOR_PICKUP',
  'PICKUP_ARRIVED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERY_ARRIVED',
  'DELIVERED',
  'PICKUP_FAILED',
  'DELIVERY_FAILED',
]);

const FACILITY_STATUSES = new Set([
  'ORDER_CONFIRMED',
  'PICKUP_SCHEDULED',
  'PICKUP_ASSIGNED',
  'RECEIVED_AT_FACILITY',
  'SORTING',
  'WASHING',
  'IRONING',
  'PACKING',
  'READY_FOR_DISPATCH',
  'DELIVERY_ASSIGNED',
  'PROCESSING_ISSUE',
]);

const timeSlots = buildTimeSlots();
const orderCountsByDay = new Map();
const slotCache = new Map();
const slotUsage = new Map();
const seedTag = new Date().toISOString().slice(2, 10).replace(/-/g, '');
const seedBase = Number(String(Date.now()).slice(-9));

try {
  const roles = await ensureRoles();
  const adminUser = await ensureAdminUser(roles.ADMIN.id);
  const city = await ensureCity(CONFIG.cityName, CONFIG.cityState);
  const facility = await ensureFacility(CONFIG.facilityId, city.id);

  const staffUsers = await ensureStaffUsers(CONFIG.staff, roles.FACILITY_STAFF.id, facility.id, city.id);
  const driverUsers = await ensureDriverUsers(CONFIG.drivers, roles.DRIVER.id, city.id);
  const customers = await createCustomers(CONFIG.customers, roles.CUSTOMER.id, city.id, facility);

  const ordersToCreate = CONFIG.orders;
  let createdOrders = 0;
  let createdStatusRows = 0;
  let createdAssignments = 0;

  for (let i = 0; i < ordersToCreate; i++) {
    const customer = customers[randInt(0, customers.length - 1)];
    const createdAt = randomPastDate(CONFIG.minDaysBack, CONFIG.maxDaysBack);
    const slotDate = pickSlotDate(createdAt);
    const slotResult = await getOrCreateSlot(facility.id, slotDate, timeSlots);
    const slot = slotResult.slot;
    const slotKey = slotResult.key;

    const isExpress = Math.random() < 0.18;
    const serviceType = pickWeighted(SERVICE_TYPES);
    const orderNumber = nextOrderNumber(createdAt, isExpress);

    const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
    const finalStatus = chooseFinalStatus(daysAgo);
    const timeline = buildStatusTimeline(createdAt, finalStatus);

    const initialWeight = shouldHaveInitialWeight(finalStatus)
      ? roundTo(randFloat(2.0, 8.0), 2)
      : null;
    const finalWeight = shouldHaveFinalWeight(finalStatus)
      ? roundTo((initialWeight ?? randFloat(2.0, 8.0)) - randFloat(0, 0.5), 2)
      : null;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        addressId: customer.addressId,
        facilityId: facility.id,
        pickupSlotId: slot.id,
        currentStatus: finalStatus,
        serviceType,
        isExpress,
        initialWeight,
        finalWeight,
        customerNotes: Math.random() < 0.2 ? 'Leave at the door if not reachable.' : null,
        createdAt,
        updatedAt: timeline[timeline.length - 1].timestamp,
      },
    });

    const actors = {
      customerId: customer.id,
      driverId: driverUsers[randInt(0, driverUsers.length - 1)]?.id ?? adminUser.id,
      staffId: staffUsers[randInt(0, staffUsers.length - 1)]?.id ?? adminUser.id,
      adminId: adminUser.id,
    };

    const statusRows = timeline.map((entry) => ({
      orderId: order.id,
      status: entry.status,
      changedByUserId: resolveStatusActor(entry.status, actors),
      notes: entry.status === 'CANCELLED' ? 'Order cancelled by customer' : null,
      timestamp: entry.timestamp,
      createdAt: entry.timestamp,
    }));

    if (statusRows.length > 0) {
      await prisma.orderStatusHistory.createMany({ data: statusRows });
      createdStatusRows += statusRows.length;
    }

    const assignments = buildAssignments(order.id, timeline, actors);
    for (const assignment of assignments) {
      await prisma.deliveryAssignment.create({ data: assignment });
      createdAssignments++;
    }

    await incrementSlotBooking(slot.id, slotKey);
    createdOrders++;
  }

  console.log('Seed complete');
  console.log(`Customers created: ${customers.length}`);
  console.log(`Orders created: ${createdOrders}`);
  console.log(`Status rows created: ${createdStatusRows}`);
  console.log(`Assignments created: ${createdAssignments}`);
} catch (error) {
  console.error('Seed failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

function intEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function ensureRoles() {
  const roles = ['CUSTOMER', 'DRIVER', 'FACILITY_STAFF', 'ADMIN'];
  const result = {};

  for (const name of roles) {
    let role = await prisma.role.findUnique({ where: { name } });
    if (!role) {
      role = await prisma.role.create({ data: { name, permissions: {} } });
    }
    result[name] = role;
  }

  return result;
}

async function ensureAdminUser(adminRoleId) {
  const existing = await prisma.user.findFirst({ where: { roleId: adminRoleId } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      mobileNumber: buildMobileNumber(1),
      name: 'Seed Admin',
      username: `seed-admin-${seedTag}`,
      passwordHash: null,
      roleId: adminRoleId,
      isActive: true,
    },
  });
}

async function ensureCity(name, state) {
  const existing = await prisma.city.findFirst({ where: { name } });
  if (existing) return existing;

  return prisma.city.create({
    data: {
      name,
      state,
      isActive: true,
    },
  });
}

async function ensureFacility(facilityId, cityId) {
  if (facilityId) {
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) {
      throw new Error(`Facility not found for id ${facilityId}`);
    }
    return facility;
  }

  const existing = await prisma.facility.findFirst({ where: { isActive: true } });
  if (existing) return existing;

  return prisma.facility.create({
    data: {
      facilityCode: `SEED_FAC_${seedTag}`,
      name: 'Seed Facility',
      cityId,
      address: 'Seed facility address',
      contactNumber: '9999999999',
      isActive: true,
      latitude: 18.5300,
      longitude: 73.8600,
    },
  });
}

async function ensureStaffUsers(count, roleId, facilityId, cityId) {
  const existing = await prisma.user.findMany({ where: { roleId }, take: count });
  const staffUsers = [...existing];

  for (let i = existing.length; i < count; i++) {
    const user = await prisma.user.create({
      data: {
        mobileNumber: buildMobileNumber(1000 + i),
        name: `Seed Staff ${String(i + 1).padStart(2, '0')}`,
        email: `seed.staff.${seedTag}.${i + 1}@example.com`,
        roleId,
        isActive: true,
        createdAt: randomPastDate(CONFIG.minDaysBack, CONFIG.maxDaysBack),
      },
    });

    await prisma.staff.create({
      data: {
        userId: user.id,
        employeeId: `E${seedTag}${String(i + 1).padStart(3, '0')}`,
        facilityId,
        roleId,
      },
    });

    staffUsers.push(user);
  }

  return staffUsers;
}

async function ensureDriverUsers(count, roleId) {
  const existing = await prisma.user.findMany({ where: { roleId }, take: count });
  const drivers = [...existing];

  for (let i = existing.length; i < count; i++) {
    const user = await prisma.user.create({
      data: {
        mobileNumber: buildMobileNumber(2000 + i),
        name: `Seed Driver ${String(i + 1).padStart(2, '0')}`,
        email: `seed.driver.${seedTag}.${i + 1}@example.com`,
        roleId,
        isActive: true,
        createdAt: randomPastDate(CONFIG.minDaysBack, CONFIG.maxDaysBack),
      },
    });
    drivers.push(user);
  }

  return drivers;
}

async function createCustomers(count, roleId, cityId, facility) {
  const customers = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomPastDate(CONFIG.minDaysBack, CONFIG.maxDaysBack);
    const customerId = `C${seedTag}${String(i + 1).padStart(3, '0')}`;

    const user = await prisma.user.create({
      data: {
        mobileNumber: buildMobileNumber(3000 + i),
        name: `Seed Customer ${String(i + 1).padStart(2, '0')}`,
        email: `seed.customer.${customerId.toLowerCase()}@example.com`,
        customerId,
        roleId,
        isActive: true,
        createdAt,
      },
    });

    const coords = nearbyCoordinates(Number(facility.latitude), Number(facility.longitude));

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        houseFlatNo: `Apt ${randInt(1, 120)}`,
        street: 'Seed Street',
        pincode: '411001',
        cityId,
        latitude: coords.lat,
        longitude: coords.lng,
        isDefault: true,
        createdAt,
      },
    });

    customers.push({ id: user.id, addressId: address.id });
  }

  return customers;
}

async function getOrCreateSlot(facilityId, slotDate, slots) {
  let selected = null;
  let selectedKey = null;
  let attempts = 0;

  while (!selected && attempts < 20) {
    const slotTime = slots[randInt(0, slots.length - 1)];
    const key = `${facilityId}|${slotDate}|${slotTime.startTime}`;

    const cache = slotCache.get(key);
    if (cache) {
      if (!slotUsage.has(key)) {
        slotUsage.set(key, cache.currentBookings ?? 0);
      }
      if (canBookSlot(key, cache.maxCapacity ?? 10)) {
        selected = cache;
        selectedKey = key;
        break;
      }
    }

    const slotDateValue = new Date(`${slotDate}T00:00:00.000Z`);
    const existing = await prisma.pickupSlot.findFirst({
      where: {
        facilityId,
        slotDate: slotDateValue,
        startTime: slotTime.startTime,
      },
    });

    if (existing) {
      slotCache.set(key, existing);
      if (!slotUsage.has(key)) {
        slotUsage.set(key, existing.currentBookings ?? 0);
      }
      if (canBookSlot(key, existing.maxCapacity ?? 10)) {
        selected = existing;
        selectedKey = key;
        break;
      }
    } else {
      const created = await prisma.pickupSlot.create({
        data: {
          facilityId,
          slotDate: slotDateValue,
          startTime: slotTime.startTime,
          endTime: slotTime.endTime,
          maxCapacity: 10,
          currentBookings: 0,
          isActive: true,
        },
      });
      slotCache.set(key, created);
      slotUsage.set(key, 0);
      selected = created;
      selectedKey = key;
      break;
    }

    attempts++;
  }

  if (!selected) {
    throw new Error('Unable to find or create an available pickup slot');
  }

  return { slot: selected, key: selectedKey };
}

function canBookSlot(key, maxCapacity) {
  const used = slotUsage.get(key) ?? 0;
  return used < maxCapacity;
}

async function incrementSlotBooking(slotId, slotKey) {
  await prisma.pickupSlot.update({
    where: { id: slotId },
    data: { currentBookings: { increment: 1 } },
  });
  slotUsage.set(slotKey, (slotUsage.get(slotKey) ?? 0) + 1);
}

function buildAssignments(orderId, timeline, actors) {
  const statuses = timeline.map((entry) => entry.status);
  const assignments = [];

  if (statuses.includes('PICKUP_ASSIGNED')) {
    const assignedAt = getStatusTime(timeline, 'PICKUP_ASSIGNED');
    const completionStatus = statuses.includes('PICKED_UP')
      ? 'COMPLETED'
      : statuses.includes('PICKUP_FAILED')
        ? 'FAILED'
        : statuses.includes('OUT_FOR_PICKUP') || statuses.includes('PICKUP_ARRIVED')
          ? 'IN_PROGRESS'
          : 'ASSIGNED';

    const completedAt = completionStatus === 'COMPLETED'
      ? getStatusTime(timeline, 'PICKED_UP')
      : completionStatus === 'FAILED'
        ? getStatusTime(timeline, 'PICKUP_FAILED')
        : null;

    assignments.push({
      orderId,
      driverId: actors.driverId,
      assignmentType: 'PICKUP',
      assignedByUserId: actors.staffId,
      assignedAt,
      status: completionStatus,
      completedAt,
      notes: null,
    });
  }

  if (statuses.includes('DELIVERY_ASSIGNED')) {
    const assignedAt = getStatusTime(timeline, 'DELIVERY_ASSIGNED');
    const completionStatus = statuses.includes('DELIVERED')
      ? 'COMPLETED'
      : statuses.includes('DELIVERY_FAILED')
        ? 'FAILED'
        : statuses.includes('OUT_FOR_DELIVERY') || statuses.includes('DELIVERY_ARRIVED')
          ? 'IN_PROGRESS'
          : 'ASSIGNED';

    const completedAt = completionStatus === 'COMPLETED'
      ? getStatusTime(timeline, 'DELIVERED')
      : completionStatus === 'FAILED'
        ? getStatusTime(timeline, 'DELIVERY_FAILED')
        : null;

    assignments.push({
      orderId,
      driverId: actors.driverId,
      assignmentType: 'DELIVERY',
      assignedByUserId: actors.staffId,
      assignedAt,
      status: completionStatus,
      completedAt,
      notes: null,
    });
  }

  return assignments;
}

function getStatusTime(timeline, status) {
  return timeline.find((entry) => entry.status === status)?.timestamp ?? new Date();
}

function resolveStatusActor(status, actors) {
  if (status === 'ORDER_CREATED' || status === 'CANCELLED') return actors.customerId;
  if (DRIVER_STATUSES.has(status)) return actors.driverId;
  if (FACILITY_STATUSES.has(status)) return actors.staffId;
  return actors.adminId;
}

function chooseFinalStatus(daysAgo) {
  if (daysAgo >= 21) {
    return pickWeighted([
      { value: 'DELIVERED', weight: 0.85 },
      { value: 'CANCELLED', weight: 0.1 },
      { value: 'DELIVERY_FAILED', weight: 0.05 },
    ]);
  }

  if (daysAgo >= 10) {
    return pickWeighted([
      { value: 'DELIVERED', weight: 0.6 },
      { value: 'READY_FOR_DISPATCH', weight: 0.15 },
      { value: 'OUT_FOR_DELIVERY', weight: 0.1 },
      { value: 'DELIVERY_FAILED', weight: 0.05 },
      { value: 'CANCELLED', weight: 0.1 },
    ]);
  }

  if (daysAgo >= 3) {
    return pickWeighted([
      { value: 'RECEIVED_AT_FACILITY', weight: 0.2 },
      { value: 'SORTING', weight: 0.2 },
      { value: 'WASHING', weight: 0.2 },
      { value: 'IRONING', weight: 0.15 },
      { value: 'PACKING', weight: 0.1 },
      { value: 'READY_FOR_DISPATCH', weight: 0.1 },
      { value: 'DELIVERY_ASSIGNED', weight: 0.05 },
    ]);
  }

  return pickWeighted([
    { value: 'ORDER_CREATED', weight: 0.25 },
    { value: 'ORDER_CONFIRMED', weight: 0.2 },
    { value: 'PICKUP_SCHEDULED', weight: 0.2 },
    { value: 'PICKUP_ASSIGNED', weight: 0.15 },
    { value: 'OUT_FOR_PICKUP', weight: 0.1 },
    { value: 'PICKUP_ARRIVED', weight: 0.05 },
    { value: 'PICKED_UP', weight: 0.03 },
    { value: 'CANCELLED', weight: 0.02 },
  ]);
}

function buildStatusTimeline(createdAt, finalStatus) {
  const base = FAILURE_TIMELINES[finalStatus]
    ? [...FAILURE_TIMELINES[finalStatus]]
    : MAIN_FLOW.slice(0, MAIN_FLOW.indexOf(finalStatus) + 1);

  let cursor = new Date(createdAt);
  const timeline = [];

  for (let i = 0; i < base.length; i++) {
    if (i > 0) {
      cursor = addMinutes(cursor, randInt(30, 360));
    }
    timeline.push({ status: base[i], timestamp: new Date(cursor) });
  }

  const now = new Date();
  if (timeline[timeline.length - 1].timestamp > now) {
    const shiftMs = timeline[timeline.length - 1].timestamp.getTime() - now.getTime() + randInt(15, 90) * 60000;
    for (const entry of timeline) {
      entry.timestamp = new Date(entry.timestamp.getTime() - shiftMs);
    }
  }

  return timeline;
}

function buildTimeSlots() {
  const slots = [];
  for (let hour = 10; hour < 21; hour++) {
    for (const minute of [0, 30]) {
      const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const endMinute = minute + 30;
      const endHourVal = endMinute >= 60 ? hour + 1 : hour;
      const endMin = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${String(endHourVal).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      if (endHourVal > 21) continue;
      slots.push({ startTime, endTime });
    }
  }
  return slots;
}

function pickSlotDate(createdAt) {
  const date = new Date(createdAt);
  if (Math.random() < 0.5) {
    date.setDate(date.getDate() + 1);
  }
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function nextOrderNumber(createdAt, isExpress) {
  const dayKey = createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const next = (orderCountsByDay.get(dayKey) ?? 0) + 1;
  orderCountsByDay.set(dayKey, next);

  const ist = new Date(createdAt.getTime() + 330 * 60 * 1000);
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const min = String(ist.getUTCMinutes()).padStart(2, '0');
  const prefix = isExpress ? 'EX' : 'N';

  return `${prefix}-${dd}-${mm}-${hh}:${min}-${String(next).padStart(2, '0')}`;
}

function shouldHaveInitialWeight(status) {
  const idx = MAIN_FLOW.indexOf(status);
  return idx >= MAIN_FLOW.indexOf('PICKED_UP') || status === 'DELIVERED' || status === 'DELIVERY_FAILED';
}

function shouldHaveFinalWeight(status) {
  const idx = MAIN_FLOW.indexOf(status);
  return idx >= MAIN_FLOW.indexOf('PACKING') || status === 'DELIVERED';
}

function randomPastDate(minDaysBack, maxDaysBack) {
  const min = Math.min(minDaysBack, maxDaysBack);
  const max = Math.max(minDaysBack, maxDaysBack);
  const daysBack = randInt(min, max);

  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(randInt(8, 20), randInt(0, 59), randInt(0, 59), 0);
  return date;
}

function nearbyCoordinates(baseLat, baseLng) {
  const latOffset = randFloat(-0.02, 0.02);
  const lngOffset = randFloat(-0.02, 0.02);
  return {
    lat: roundTo(baseLat + latOffset, 7),
    lng: roundTo(baseLng + lngOffset, 7),
  };
}

function pickWeighted(options) {
  const total = options.reduce((sum, opt) => sum + opt.weight, 0);
  const roll = Math.random() * total;
  let cursor = 0;

  for (const opt of options) {
    cursor += opt.weight;
    if (roll <= cursor) return opt.value;
  }

  return options[options.length - 1].value;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function buildMobileNumber(offset) {
  const suffix = String(seedBase + offset).padStart(9, '0').slice(-9);
  return `9${suffix}`;
}
