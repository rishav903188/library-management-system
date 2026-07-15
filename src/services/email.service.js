const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const emailQueue = require("../jobs/queues/email.queue");
const { EMAIL_JOBS } = require("../jobs/workers/email.worker");

// ─────────────────────────────────────────────────────
// Core Nodemailer setup — ye same hai, worker isse use karta hai
// ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const renderTemplate = (templateName, data = {}) => {
  const filePath = path.join(__dirname, "../templates/emails", `${templateName}.html`);
  let html = fs.readFileSync(filePath, "utf-8");
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, data[key]);
  });
  return html;
};

/**
 * Direct email sender — worker isse call karta hai.
 * Controllers/services ab ise directly nahi call karte — queue ke through jaate hain.
 */
const sendEmail = async ({ to, subject, templateName, data }) => {
  try {
    const html = renderTemplate(templateName, data);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    throw err;
    // Worker ke andar throw karo — BullMQ retry mechanism trigger hoga.
    // Pehle controllers me swallow karte the kyunki direct call tha.
    // Ab worker handle karta hai retry — isliye throw karna sahi hai.
  }
};

// ─────────────────────────────────────────────────────
// Queue-based email functions — controllers yahi call karein
// Previously: directly sendEmail() call karte the (blocking)
// Now: queue me job add karo (non-blocking)
// ─────────────────────────────────────────────────────

const sendFineNoticeEmail = async (user, book, fine) => {
  await emailQueue.add(EMAIL_JOBS.FINE_NOTICE, {
    to: user.email,
    subject: "Late Return Fine — Library System",
    templateName: "fineNotice",
    data: {
      userName: user.name,
      bookTitle: book.title,
      daysLate: fine.daysLate,
      amount: fine.amount,
    },
  });
  console.log(`📬 Fine notice job queued for: ${user.email}`);
};

const sendReservationReadyEmail = async (user, book) => {
  await emailQueue.add(EMAIL_JOBS.RESERVATION_READY, {
    to: user.email,
    subject: "Your reserved book is ready!",
    templateName: "reservationReady",
    data: {
      userName: user.name,
      bookTitle: book.title,
    },
  });
  console.log(`📬 Reservation ready job queued for: ${user.email}`);
};

const sendReturnConfirmationEmail = async (user, book) => {
  await emailQueue.add(EMAIL_JOBS.RETURN_CONFIRMATION, {
    to: user.email,
    subject: "Book return confirmed",
    templateName: "returnConfirmation",
    data: {
      userName: user.name,
      bookTitle: book.title,
    },
  });
  console.log(`📬 Return confirmation job queued for: ${user.email}`);
};

module.exports = {
  sendEmail,           // worker use karta hai
  sendFineNoticeEmail,
  sendReservationReadyEmail,
  sendReturnConfirmationEmail,
};