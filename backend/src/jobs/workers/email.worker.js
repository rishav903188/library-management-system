const { Worker } = require("bullmq");
const { createBullMQConnection } = require("../../config/bullmq");
const { sendEmail } = require("../../services/email.service");

const EMAIL_JOBS = {
  RETURN_CONFIRMATION: "return-confirmation",
  FINE_NOTICE:         "fine-notice",
  RESERVATION_READY:   "reservation-ready",
  DUE_REMINDER:        "due-reminder",   // ← NAYA
};

const emailWorker = new Worker(
  "email",
  async (job) => {
    console.log(`📧 Processing email job: ${job.name} [ID: ${job.id}]`);
    const { to, subject, templateName, data } = job.data;
    await sendEmail({ to, subject, templateName, data });
    console.log(`✅ Email job complete: ${job.name} → ${to}`);
    return { sentTo: to, jobName: job.name };
  },
  {
    connection: createBullMQConnection(),
    concurrency: 5,
  }
);

emailWorker.on("completed", (job, result) => {
  console.log(`✅ Email job [${job.id}] completed:`, result);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job [${job?.id}] failed (attempt ${job?.attemptsMade}):`, err.message);
});

emailWorker.on("error", (err) => {
  console.error("❌ Email Worker error:", err.message);
});

module.exports = { emailWorker, EMAIL_JOBS };