require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");
const { connectRedis } = require("./config/redis");

// Worker import — import karte hi worker start ho jaata hai
const { emailWorker } = require("./jobs/workers/email.worker");

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  // Worker health check
  console.log(`🔧 Email worker status: ${emailWorker.isRunning() ? "running" : "idle"}`);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Queue dashboard: http://localhost:${PORT}/admin/queues`);
  });
};

// Graceful shutdown — server band hone par worker bhi properly band ho
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received — shutting down gracefully...");
  await emailWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received — shutting down gracefully...");
  await emailWorker.close();
  process.exit(0);
});

startServer();