import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const rows = await p.pricingConfiguration.findMany();
console.log(JSON.stringify(rows, null, 2));
await p.$disconnect();
