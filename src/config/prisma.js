const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  // password: false (by default false hai agar mention nahi kiya select me)
};



module.exports = prisma;