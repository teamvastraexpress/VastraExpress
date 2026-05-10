import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'customer@test.com';
  const password = 'password123';
  const mobileNumber = '9876543210';
  const name = 'Test Customer';

  console.log(`Checking if user ${email} or mobile ${mobileNumber} exists...`);
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { mobileNumber }] },
  });

  if (existing) {
    console.log('Test customer already exists:', existing.email, existing.mobileNumber);
    return;
  }

  const role = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!role) {
    throw new Error('CUSTOMER role not found');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Get next customer ID
  const lastCustomer = await prisma.user.findFirst({
    where: { customerId: { not: null } },
    orderBy: { customerId: 'desc' },
    select: { customerId: true },
  });
  const nextCustomerNum = lastCustomer?.customerId
    ? parseInt(lastCustomer.customerId.replace('C', ''), 10) + 1
    : 1;
  const customerId = `C${String(nextCustomerNum).padStart(3, '0')}`;

  console.log(`Creating user with customerId: ${customerId}...`);
  const user = await prisma.user.create({
    data: {
      email,
      mobileNumber,
      name,
      passwordHash,
      roleId: role.id,
      isActive: true,
      customerId,
    },
  });

  console.log('✅ Test customer created:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   Mobile:', mobileNumber);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding customer:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
