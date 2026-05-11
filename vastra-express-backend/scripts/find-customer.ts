import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.user.findFirst({
    where: {
      role: {
        name: 'CUSTOMER'
      }
    },
    include: {
      role: true
    }
  });

  if (customer) {
    console.log('Found Customer:');
    console.log('Email:', customer.email);
    console.log('Mobile:', customer.mobileNumber);
    console.log('Name:', customer.name);
  } else {
    console.log('No customers found.');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
