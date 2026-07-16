const cron = require("node-cron");
const prisma = require("../../config/prisma");
const { sendDueReminderEmail } = require("../../services/email.service");

const scheduleDueDateCheck = () => {
  // Production: "0 9 * * *" = roz 9 AM
  // Testing ke liye temporarily "*/2 * * * *" (har 2 minute) use kar sakte ho
  const schedule = process.env.DUE_CHECK_SCHEDULE || "0 9 * * *";

  cron.schedule(schedule, async () => {
    console.log("⏰ [Cron] Running due date check...");

    try {
      // "Kal" ki date calculate karo
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // kal ki shuruat

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1); // parso ki shuruat

      // Wo sab borrows jo:
      // 1. Abhi bhi borrowed status me hain
      // 2. dueDate kal hai (tomorrow <= dueDate < dayAfter)
      const dueTomorrow = await prisma.borrow.findMany({
        where: {
          status: "borrowed",
          dueDate: {
            gte: tomorrow,
            lt: dayAfter,
          },
        },
        include: {
          user: { select: { name: true, email: true } },
          book: { select: { title: true } },
        },
      });

      if (dueTomorrow.length === 0) {
        console.log("✅ [Cron] No books due tomorrow.");
        return;
      }

      console.log(
        `📚 [Cron] ${dueTomorrow.length} book(s) due tomorrow — queuing reminders...`,
      );

      // Har user ke liye reminder email queue me daalo
      for (const borrow of dueTomorrow) {
        await sendDueReminderEmail(borrow.user, borrow.book, borrow.dueDate);
      }

      console.log(
        `✅ [Cron] Due date check complete — ${dueTomorrow.length} reminder(s) queued.`,
      );
    } catch (err) {
      // Cron job fail hone par sirf log karo — server crash mat karo
      console.error("❌ [Cron] Due date check failed:", err.message);
    }
  });

  console.log(`📅 Due date check cron scheduled: "${schedule}"`);
};

module.exports = { scheduleDueDateCheck };
