import bcrypt from "bcryptjs";
import { PrismaClient, Role, DimensionType, ProductStatus, QuotationStatus, OrderStatus } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@aasa.com" },
    update: {},
    create: {
      name: "Rajeev (Admin)",
      email: "admin@aasa.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@aasa.com" },
    update: {},
    create: {
      name: "Aasa Suppliers",
      email: "seller@aasa.com",
      password: hashedPassword,
      role: Role.SELLER,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@aasa.com" },
    update: {},
    create: {
      name: "MedChem Labs",
      email: "buyer@aasa.com",
      password: hashedPassword,
      role: Role.BUYER,
    },
  });

  // 2. Create Products
  const ethanol = await prisma.product.upsert({
    where: { sku: "ETH-001" },
    update: {},
    create: {
      name: "Ethanol (99% Pure)",
      sku: "ETH-001",
      category: "Solvents",
      description: "Industrial grade ethanol for laboratory use.",
      sellerId: seller.id,
      dimensionType: DimensionType.VOLUME,
      baseUnit: "mL",
      inventoryQuantity: new Decimal("100000"), // 100 L
      basePrice: new Decimal("0.05"), // ₹0.05 per mL
    },
  });

  const acetone = await prisma.product.upsert({
    where: { sku: "ACE-002" },
    update: {},
    create: {
      name: "Acetone (Extra Pure)",
      sku: "ACE-002",
      category: "Solvents",
      description: "High purity acetone solvent for chemical synthesis.",
      sellerId: seller.id,
      dimensionType: DimensionType.VOLUME,
      baseUnit: "mL",
      inventoryQuantity: new Decimal("195000"), // 200 L total - 5 L ordered
      reservedQuantity: new Decimal("10000"), // 10 L reserved for pending quote
      basePrice: new Decimal("0.03"), // ₹0.03 per mL
    },
  });

  const nacl = await prisma.product.upsert({
    where: { sku: "NACL-003" },
    update: {},
    create: {
      name: "Sodium Chloride (NaCl)",
      sku: "NACL-003",
      category: "Reagents",
      description: "Analytical reagent grade sodium chloride.",
      sellerId: admin.id,
      dimensionType: DimensionType.WEIGHT,
      baseUnit: "g",
      inventoryQuantity: new Decimal("50000"), // 50 kg
      basePrice: new Decimal("0.015"), // ₹0.015 per g
    },
  });

  // Clean existing quotations & orders to prevent unique/foreign key issues on re-run
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});

  // 3. Create a Pending Quotation (representing stock reservation)
  const pendingQuote = await prisma.quotation.create({
    data: {
      buyerId: buyer.id,
      status: QuotationStatus.PENDING,
      totalPrice: new Decimal("300"), // 10 L = 10,000 mL * ₹0.03 = ₹300
      items: {
        create: {
          productId: acetone.id,
          orderedQuantityDisplay: new Decimal("10"),
          orderedUnit: "L",
          orderedQuantityBase: new Decimal("10000"),
          unitPriceBase: new Decimal("0.03"),
          lineTotal: new Decimal("300"),
        },
      },
    },
  });

  // 4. Create an Approved Quotation + Converted Order
  const approvedQuote = await prisma.quotation.create({
    data: {
      buyerId: buyer.id,
      status: QuotationStatus.APPROVED,
      totalPrice: new Decimal("150"), // 5 L = 5,000 mL * ₹0.03 = ₹150
      items: {
        create: {
          productId: acetone.id,
          orderedQuantityDisplay: new Decimal("5"),
          orderedUnit: "L",
          orderedQuantityBase: new Decimal("5000"),
          unitPriceBase: new Decimal("0.03"),
          lineTotal: new Decimal("150"),
        },
      },
    },
  });

  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      quotationId: approvedQuote.id,
      status: OrderStatus.PENDING,
      totalPrice: new Decimal("150"),
      items: {
        create: {
          productId: acetone.id,
          orderedQuantityDisplay: new Decimal("5"),
          orderedUnit: "L",
          orderedQuantityBase: new Decimal("5000"),
          unitPriceBase: new Decimal("0.03"),
          lineTotal: new Decimal("150"),
        },
      },
    },
  });

  console.log("✅ Seed completed: Users, Products, a Quotation, and an Order populated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });