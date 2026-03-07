/**
 * migrate-staff-ids.mjs
 * Reassigns all existing Staff records to the new ID format:
 *   FACILITY_STAFF → F001, F002, ...
 *   DRIVER         → D001, D002, ...
 *
 * Run once: node scripts/migrate-staff-ids.mjs
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating staff employee IDs to F001/D001 format...\n');

  // Fetch all staff with their user's role
  const allStaff = await prisma.staff.findMany({
    include: { user: { include: { role: true } } },
    orderBy: { id: 'asc' },
  });

  const facilityStaff = allStaff.filter((s) => s.user.role.name === 'FACILITY_STAFF');
  const drivers = allStaff.filter((s) => s.user.role.name === 'DRIVER');

  let updated = 0;

  // Re-number FACILITY_STAFF as F001, F002...
  for (let i = 0; i < facilityStaff.length; i++) {
    const newId = `F${String(i + 1).padStart(3, '0')}`;
    const s = facilityStaff[i];
    if (s.employeeId === newId) {
      console.log(`  ✓ ${s.user.name} already has ${newId}`);
      continue;
    }
    await prisma.staff.update({
      where: { id: s.id },
      data: { employeeId: newId },
    });
    console.log(`  ✅ ${s.user.name}: ${s.employeeId ?? '(none)'} → ${newId}`);
    updated++;
  }

  // Re-number DRIVER as D001, D002...
  for (let i = 0; i < drivers.length; i++) {
    const newId = `D${String(i + 1).padStart(3, '0')}`;
    const s = drivers[i];
    if (s.employeeId === newId) {
      console.log(`  ✓ ${s.user.name} already has ${newId}`);
      continue;
    }
    await prisma.staff.update({
      where: { id: s.id },
      data: { employeeId: newId },
    });
    console.log(`  ✅ ${s.user.name}: ${s.employeeId ?? '(none)'} → ${newId}`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} record(s).`);
  console.log(`  Facility Staff: ${facilityStaff.length} (F001–F${String(facilityStaff.length).padStart(3, '0')})`);
  console.log(`  Drivers:        ${drivers.length} (D001–D${String(drivers.length).padStart(3, '0')})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
