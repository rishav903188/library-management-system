require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const seed = async () => {
  console.log("🌱 Seeding admin user...");

  const email = "admin@library.com";
  const password = "Admin@1234";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Library Admin",
      email,
      password: hashed,
      role: "admin",
    },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log("✅ Admin user created:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${admin.role}`);
  console.log("\n⚠️  Change this password after first login in production!");
};

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());