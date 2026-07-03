const Borrow = require("../models/borrow.model");
const Fine = require("../models/fine.model");
const {
  generateBorrowHistoryPDF,
  generateFineReceiptPDF,
} = require("../utils/pdfGenerator");

// @route  GET /api/reports/borrow-history
const downloadBorrowHistory = async (req, res) => {
  try {
    const borrows = await Borrow.find({ user: req.user._id })
      .populate("book", "title author")
      .sort({ createdAt: -1 });

    const filePath = await generateBorrowHistoryPDF(req.user, borrows);

    res.download(filePath, "borrow-history.pdf", (err) => {
      if (err) console.error("Download error:", err.message);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reports/fine-receipt/:fineId
const downloadFineReceipt = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.fineId).populate("book", "title author");

    if (!fine) return res.status(404).json({ message: "Fine not found" });

    if (fine.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your fine" });
    }

    const filePath = await generateFineReceiptPDF(req.user, fine.book, fine);

    res.download(filePath, "fine-receipt.pdf", (err) => {
      if (err) console.error("Download error:", err.message);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { downloadBorrowHistory, downloadFineReceipt };