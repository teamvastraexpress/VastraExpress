/**
 * Seed default pricing configurations for all service types.
 * Run: node scripts/seed-pricing.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const configs = [
  {
    serviceType: 'WASH_FOLD',
    pricePerKg: 80,
    minimumOrderValue: 200,
    expressDeliveryCharge: 50,
    pickupDeliveryChargeNonSubscriber: 40,
  },
  {
    serviceType: 'DRY_CLEAN',
    pricePerKg: 150,
    minimumOrderValue: 300,
    expressDeliveryCharge: 100,
    pickupDeliveryChargeNonSubscriber: 40,
  },
  {
    serviceType: 'IRON_ONLY',
    pricePerKg: 50,
    minimumOrderValue: 100,
    expressDeliveryCharge: 30,
    pickupDeliveryChargeNonSubscriber: 40,
  },
];

let created = 0;
let skipped = 0;

for (const cfg of configs) {
  const existing = await prisma.pricingConfiguration.findFirst({
    where: { serviceType: cfg.serviceType, cityId: null },
  });
  if (existing) {
    console.log(`⏭  Skipping ${cfg.serviceType} — already exists (id=${existing.id})`);
    skipped++;
    continue;
  }
  const row = await prisma.pricingConfiguration.create({
    data: {
      serviceType: cfg.serviceType,
      cityId: null,
      pricePerKg: cfg.pricePerKg,
      minimumOrderValue: cfg.minimumOrderValue,
      expressDeliveryCharge: cfg.expressDeliveryCharge,
      pickupDeliveryChargeNonSubscriber: cfg.pickupDeliveryChargeNonSubscriber,
      effectiveFrom: new Date(),
      isActive: true,
    },
  });
  console.log(`✅ Created pricing for ${cfg.serviceType} — id=${row.id}, ₹${cfg.pricePerKg}/kg`);
  created++;
}

console.log(`\nDone. Created=${created}, Skipped=${skipped}`);
await prisma.$disconnect();
