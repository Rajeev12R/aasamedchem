import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(
    "password123",
    10
  );

  await prisma.user.upsert({
    where: {
      email: "admin@aasa.com",
    },
    update: {},
    create: {
      name: "Admin",
      email: "admin@aasa.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "seller@aasa.com",
    },
    update: {},
    create: {
      name: "Seller",
      email: "seller@aasa.com",
      password: hashedPassword,
      role: Role.SELLER,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "buyer@aasa.com",
    },
    update: {},
    create: {
      name: "Buyer",
      email: "buyer@aasa.com",
      password: hashedPassword,
      role: Role.BUYER,
    },
  });

  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });