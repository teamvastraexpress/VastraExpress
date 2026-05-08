import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const addresses = await prisma.address.findMany({ take: 5 });
  const facilities = await prisma.facility.findMany({ take: 5 });
  
  console.log('=== ADDRESSES ===');
  console.log(addresses);
  
  console.log('\n=== FACILITIES ===');
  console.log(facilities);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
