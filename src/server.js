// src/server.js
require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();     // PostgreSQL
  await connectRedis();  // Redis

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();