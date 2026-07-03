const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const reportsDir = path.join(__dirname, "../reports/pdf");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const addHeader = (doc, title) => {
  doc
    .fontSize(20)
    .fillColor("#2c3e50")
    .text("Library Management System", { align: "center" })
    .moveDown(0.3)
    .fontSize(14)
    .fillColor("#7f8c8d")
    .text(title, { align: "center" })
    .moveDown(1)
    .strokeColor("#bdc3c7")
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(1);
};
const generateBorrowHistoryPDF = (user, borrows) => {
  return new Promise((resolve, reject) => {
    const fileName = `borrow-history-${user._id}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    addHeader(doc, "Borrow History Report");

    doc
      .fontSize(11)
      .fillColor("#000")
      .text(`Name: ${user.name}`)
      .text(`Email: ${user.email}`)
      .text(`Generated on: ${new Date().toLocaleString()}`)
      .moveDown(1);

    if (borrows.length === 0) {
      doc.text("No borrow history found.");
    } else {
      borrows.forEach((b, index) => {
        doc
          .fontSize(11)
          .fillColor("#2c3e50")
          .text(`${index + 1}. ${b.book?.title || "Unknown Book"}`, { continued: false })
          .fontSize(9)
          .fillColor("#555")
          .text(`   Author: ${b.book?.author || "N/A"}`)
          .text(`   Borrowed: ${new Date(b.borrowDate).toLocaleDateString()}`)
          .text(`   Due: ${new Date(b.dueDate).toLocaleDateString()}`)
          .text(
            `   Returned: ${b.returnDate ? new Date(b.returnDate).toLocaleDateString() : "Not yet returned"}`
          )
          .text(`   Status: ${b.status}`)
          .moveDown(0.5);
      });
    }

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};


const generateFineReceiptPDF = (user, book, fine) => {
  return new Promise((resolve, reject) => {
    const fileName = `fine-receipt-${fine._id}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    addHeader(doc, "Fine Receipt");

    doc
      .fontSize(11)
      .fillColor("#000")
      .text(`Receipt No: ${fine._id}`)
      .text(`Name: ${user.name}`)
      .text(`Email: ${user.email}`)
      .moveDown(1);

    doc
      .fontSize(12)
      .fillColor("#2c3e50")
      .text(`Book: ${book.title}`)
      .fontSize(11)
      .fillColor("#555")
      .text(`Author: ${book.author}`)
      .moveDown(1);

    doc
      .fontSize(11)
      .fillColor("#000")
      .text(`Days Late: ${fine.daysLate}`)
      .text(`Amount: Rs. ${fine.amount}`)
      .text(`Status: ${fine.status.toUpperCase()}`)
      .text(
        `Paid On: ${fine.paidAt ? new Date(fine.paidAt).toLocaleDateString() : "Not paid yet"}`
      )
      .moveDown(1);

    doc
      .fontSize(9)
      .fillColor("#999")
      .text("This is a system-generated receipt.", { align: "center" });

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = { generateBorrowHistoryPDF, generateFineReceiptPDF };