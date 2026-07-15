const cron = require("node-cron");
const prisma = require("../../config/prisma");
const { createFineIfLate } = require("../../services/fine.service");
const { sendFineNoticeEmail } = require("../../services/email.service");

const scheduleOverdueFineCheck = () => {
  const schedule = process.env.OVERDUE_FINE_SCHEDULE || "0 0 * * *";

  cron.schedule(schedule, async () => {
    console.log("⏰ [Cron] Running overdue fine check...");

    try {
      const now = new Date();

      // Wo sab borrows jo:
      // 1. Abhi bhi borrowed hain (return nahi hua)
      // 2. dueDate nikal chuki hai (overdue)
      // 3. Abhi tak koi fine nahi bani (fine: null)
      // Prisma me related model null check: { fine: null }
      const overdueBorrows = await prisma.borrow.findMany({
        where: {
          status: "borrowed",
          dueDate: { lt: now },
          fine: null,
          // fine: null = is borrow ka koi fine record nahi hai abhi tak
        },
        include: {
          user: { select: { name: true, email: true } },
          book: { select: { title: true, author: true } },
        },
      });

      if (overdueBorrows.length === 0) {
        console.log("✅ [Cron] No new overdue borrows found.");
        return;
      }

      console.log(
        `⚠️  [Cron] ${overdueBorrows.length} overdue borrow(s) found — creating fines...`,
      );

      let finesCreated = 0;

      for (const borrow of overdueBorrows) {
        try {
          // createFineIfLate — same function jo returnBook controller use karta hai
          // Lekin yahan returnDate = aaj (book abhi bhi unke paas hai)
          const fine = await createFineIfLate({
            ...borrow,
            returnDate: now, // today = "abhi tak kitne din late ho chuke ho"
          });

          if (fine) {
            finesCreated++;
            console.log(
              `💸 Fine created: ${borrow.user.email} — ${borrow.book.title} — ₹${fine.amount} (${fine.daysLate} days)`,
            );

            // Fine notice email queue me daalo
            await sendFineNoticeEmail(borrow.user, borrow.book, fine);
          }
        } catch (innerErr) {
          // Ek borrow me fail ho to baaki process karte raho
          console.error(
            `❌ [Cron] Fine creation failed for borrow ${borrow.id}:`,
            innerErr.message,
          );
        }
      }

      console.log(
        `✅ [Cron] Overdue fine check complete — ${finesCreated} fine(s) created.`,
      );
    } catch (err) {
      console.error("❌ [Cron] Overdue fine check failed:", err.message);
    }
  });

  console.log(`📅 Overdue fine cron scheduled: "${schedule}"`);
};

module.exports = { scheduleOverdueFineCheck };
