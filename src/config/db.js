const prisma = require("./prisma");

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected via Prisma");
  } catch (err) {
    console.error("❌ Prisma connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };