const nodemailer = require("nodemailer");
const fs= require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth:{
        user:process.env.EMAIL_USER,
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
    // Email fail hona critical nahi hai — log karke aage badho
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
};

const sendFineNoticeEmail = async (user, book, fine) => {
  await sendEmail({
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
};

const sendReservationReadyEmail = async (user, book) => {
  await sendEmail({
    to: user.email,
    subject: "Your reserved book is ready!",
    templateName: "reservationReady",
    data: {
      userName: user.name,
      bookTitle: book.title,
    },
  });
};

const sendReturnConfirmationEmail = async (user, book) => {
  await sendEmail({
    to: user.email,
    subject: "Book return confirmed",
    templateName: "returnConfirmation",
    data: {
      userName: user.name,
      bookTitle: book.title,
    },
  });
};

module.exports = {
  sendEmail,
  sendFineNoticeEmail,
  sendReservationReadyEmail,
  sendReturnConfirmationEmail,
};