require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");
const { connectRedis } = require("./config/redis");
const { emailWorker } = require("./jobs/workers/email.worker");
const { scheduleDueDateCheck } = require("./jobs/scheduler/dueDateCheck.cron");
const { scheduleOverdueFineCheck } = require("./jobs/scheduler/overdueFine.cron");

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  // Workers
  console.log(`🔧 Email worker: ${emailWorker.isRunning() ? "running" : "idle"}`);

  // Cron jobs start karo
  scheduleDueDateCheck();
  scheduleOverdueFineCheck();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Queue dashboard: http://localhost:${PORT}/admin/queues`);
  });
};

process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down...");
  await emailWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down...");
  await emailWorker.close();
  process.exit(0);
});

startServer();