const Borrow = require("../models/borrow.model");
const Book = require("../models/book.model");
const Reservation = require("../models/reservation.model");
const { createFineIfLate } = require("../services/fine.service");
const { fulfillNextReservation } = require("../services/reservation.service");
const { sendFineNoticeEmail } = require("../services/email.service");

const DEFAULT_BORROW_DAYS = 14;

// @route  POST /api/borrow/:bookId
const borrowBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const myReservation = await Reservation.findOne({
      user: req.user._id,
      book: book._id,
      status: "notified",
    });

    if (!myReservation && book.availableCopies < 1) {
      return res.status(400).json({
        message:
          "No copies available right now. You can reserve this book instead.",
      });
    }
    const alreadyBorrowed = await Borrow.findOne({
      user: req.user._id,
      book: book._id,
      status: "borrowed",
    });
    if (alreadyBorrowed) {
      return res
        .status(400)
        .json({ message: "You already have this book borrowed" });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DEFAULT_BORROW_DAYS);

    const borrow = await Borrow.create({
      user: req.user._id,
      book: book._id,
      dueDate,
    });

    if (myReservation) {
      myReservation.status = "fulfilled";
      await myReservation.save();
    } else {
      book.availableCopies -= 1;
      await book.save();
    }
    res.status(201).json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/borrow/return/:borrowId
const returnBook = async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.borrowId);
    if (!borrow)
      return res.status(404).json({ message: "Borrow record not found" });

    if (borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your borrow record" });
    }

    if (borrow.status === "returned") {
      return res.status(400).json({ message: "Book already returned" });
    }

    borrow.status = "returned";
    borrow.returnDate = new Date();
    await borrow.save();

    const book = await Book.findById(borrow.book);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    const fine = await createFineIfLate(borrow);

    const notified = await fulfillNextReservation(borrow.book);
    const user = await UserActivation.findById(borrow.user);

    if(user && book){
      await sendReturnConfirmationEmail(user, book);

      if(fine){
        await sendFineNoticeEmail(user, book , fine);
      }
    }
    res.json({
      borrow,
      fine: fine || null,
      message: fine
        ? `Book returned late by ${fine.daysLate} day(s). Fine of ₹${fine.amount} added.`
        : "Book returned on time. No fine.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/borrow/my
const getMyBorrows = async (req, res) => {
  try {
    const borrows = await Borrow.find({ user: req.user._id })
      .populate("book", "title author isbn")
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { borrowBook, returnBook, getMyBorrows };
