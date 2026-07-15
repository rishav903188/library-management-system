// src/jobs/workers/email.worker.js
const { Worker } = require("bullmq");
const { createBullMQConnection } = require("../../config/bullmq");
const { sendEmail } = require("../../services/email.service");

/**
 * Worker job names — email.service.js me bhi same names use karenge.
 * Ek jagah define = typo-safe.
 */
const EMAIL_JOBS = {
  RETURN_CONFIRMATION: "return-confirmation",
  FINE_NOTICE:         "fine-notice",
  RESERVATION_READY:   "reservation-ready",
};

/**
 * Email worker — queue se jobs uthata hai aur process karta hai.
 *
 * Worker function (2nd argument) ek async function hai jise BullMQ
 * har job ke liye call karta hai. `job.data` me wo data hoga
 * jo queue.add() karte waqt diya tha.
 */
const emailWorker = new Worker(
  "email", // queue name — emailQueue ke saath match hona chahiye
  async (job) => {
    console.log(`📧 Processing email job: ${job.name} [ID: ${job.id}]`);

    const { to, subject, templateName, data } = job.data;

    // sendEmail directly call karo — worker ke andar sync/async dono theek hai
    // kyunki worker pehle se background me chal raha hai, koi request block nahi ho rahi
    await sendEmail({ to, subject, templateName, data });

    console.log(`✅ Email job complete: ${job.name} → ${to}`);

    return { sentTo: to, jobName: job.name };
    // Return value job ke result me store hoti hai — Bull Board me dikh sakti hai
  },
  {
    connection: createBullMQConnection(),
    concurrency: 5,
    // Ek saath max 5 email jobs parallel process karo.
    // 1 hota to bottleneck — ek email 2s le, baaki wait karein.
    // Zyada hota to SMTP rate limits hit hoti.
  }
);

// Worker lifecycle events
emailWorker.on("completed", (job, result) => {
  console.log(`✅ Email job [${job.id}] completed:`, result);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job [${job?.id}] failed (attempt ${job?.attemptsMade}):`, err.message);
  // attempts == 3 hone par job permanently "failed" ho jaayegi
  // removeOnFail: 50 ke according Redis me rakhi jaayegi debugging ke liye
});

emailWorker.on("error", (err) => {
  console.error("❌ Email Worker error:", err.message);
});

module.exports = { emailWorker, EMAIL_JOBS };