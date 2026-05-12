import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));

  const roles = await prisma.role.findMany();
  console.log('--- Roles ---');
  console.log(JSON.stringify(roles, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
