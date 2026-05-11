import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.user.findFirst({
    where: { email: 'jim@gmail.com' }
  });

  if (!customer) {
    console.log('Customer jim@gmail.com not found');
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  
  await prisma.user.update({
    where: { id: customer.id },
    data: { passwordHash }
  });

  console.log('Updated password for:', customer.email);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
