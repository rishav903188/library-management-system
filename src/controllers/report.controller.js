const prisma = require("../config/prisma");
const { generateBorrowHistoryPDF, generateFineReceiptPDF } = require("../utils/pdfGenerator");

// @route  GET /api/reports/borrow-history
const downloadBorrowHistory = async (req, res) => {
  try {
    const borrows = await prisma.borrow.findMany({
      where: { userId: req.user.id },
      include: { book: { select: { title: true, author: true } } },
      orderBy: { createdAt: "desc" },
    });

    const filePath = await generateBorrowHistoryPDF(req.user, borrows);
    res.download(filePath, "borrow-history.pdf");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reports/fine-receipt/:fineId
const downloadFineReceipt = async (req, res) => {
  try {
    const fine = await prisma.fine.findUnique({
      where: { id: req.params.fineId },
      include: { book: { select: { title: true, author: true } } },
    });

    if (!fine) return res.status(404).json({ message: "Fine not found" });

    if (fine.userId !== req.user.id) {
      return res.status(403).json({ message: "Not your fine" });
    }

    const filePath = await generateFineReceiptPDF(req.user, fine.book, fine);
    res.download(filePath, "fine-receipt.pdf");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { downloadBorrowHistory, downloadFineReceipt };
