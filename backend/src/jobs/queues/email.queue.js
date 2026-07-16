const { Queue } = require("bullmq");
const { createBullMQConnection } = require("../../config/bullmq");

const emailQueue = new Queue("email", {
  connection: createBullMQConnection(),

  defaultJobOptions: {
    attempts: 3,
    // 3 baar try karo agar email fail ho
    // Real SMTP services kabhi kabhi temporarily fail hoti hain

    backoff: {
      type: "exponential",
      delay: 2000,
      // 1st retry: 2s baad
      // 2nd retry: 4s baad
      // 3rd retry: 8s baad
      // Exponential backoff — baar baar same time pe hit karne se server aur overloaded na ho
    },

    removeOnComplete: { count: 100 },
    // Successfully complete hue last 100 jobs Redis me rakho (debugging ke liye)
    // Baaki delete ho jaate hain — memory waste nahi hoti

    removeOnFail: { count: 50 },
    // Failed jobs last 50 rakho — investigate kar sako
  },
});

// Queue events — logging ke liye
emailQueue.on("error", (err) => {
  console.error("❌ Email Queue error:", err.message);
});

module.exports = emailQueue;