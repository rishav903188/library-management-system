const prisma = require("../config/prisma");
const { createFineIfLate } = require("../services/fine.service");
const { fulfillNextReservation } = require("../services/reservation.service");
const { sendReturnConfirmationEmail, sendFineNoticeEmail } = require("../services/email.service");
const { auditLog } = require("../services/audit.service");

const DEFAULT_BORROW_DAYS = 14;

const borrowBook = async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.bookId } });
    if (!book) return res.status(404).json({ message: "Book not found" });

    const myReservation = await prisma.reservation.findFirst({
      where: { userId: req.user.id, bookId: book.id, status: "notified" },
    });

    if (!myReservation && book.availableCopies < 1) {
      return res.status(400).json({
        message: "No copies available. You can reserve this book instead.",
      });
    }

    const alreadyBorrowed = await prisma.borrow.findFirst({
      where: { userId: req.user.id, bookId: book.id, status: "borrowed" },
    });
    if (alreadyBorrowed) {
      return res.status(400).json({ message: "You already have this book borrowed" });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DEFAULT_BORROW_DAYS);

    const borrow = await prisma.borrow.create({
      data: { userId: req.user.id, bookId: book.id, dueDate },
    });

    if (myReservation) {
      await prisma.reservation.update({
        where: { id: myReservation.id },
        data: { status: "fulfilled" },
      });
    } else {
      await prisma.book.update({
        where: { id: book.id },
        data: { availableCopies: { decrement: 1 } },
      });
    }

    await auditLog({
      userId: req.user.id,
      action: "BOOK_BORROWED",
      entity: "borrow",
      entityId: borrow.id,
      metadata: { bookTitle: book.title, bookId: book.id, dueDate },
      req,
    });

    res.status(201).json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const returnBook = async (req, res) => {
  try {
    const borrow = await prisma.borrow.findUnique({ where: { id: req.params.borrowId } });
    if (!borrow) return res.status(404).json({ message: "Borrow record not found" });

    if (borrow.userId !== req.user.id) {
      return res.status(403).json({ message: "Not your borrow record" });
    }

    if (borrow.status === "returned") {
      return res.status(400).json({ message: "Book already returned" });
    }

    const returnDate = new Date();
    const updatedBorrow = await prisma.borrow.update({
      where: { id: borrow.id },
      data: { status: "returned", returnDate },
    });

    await prisma.book.update({
      where: { id: borrow.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    const fine = await createFineIfLate({ ...borrow, returnDate });
    const notified = await fulfillNextReservation(borrow.bookId);

    const user = await prisma.user.findUnique({ where: { id: borrow.userId } });
    const book = await prisma.book.findUnique({ where: { id: borrow.bookId } });

    if (user && book) {
      await sendReturnConfirmationEmail(user, book);
      if (fine) await sendFineNoticeEmail(user, book, fine);
    }

    await auditLog({
      userId: req.user.id,
      action: "BOOK_RETURNED",
      entity: "borrow",
      entityId: borrow.id,
      metadata: {
        bookTitle: book?.title,
        bookId: borrow.bookId,
        fineAmount: fine?.amount ?? null,
        daysLate: fine?.daysLate ?? 0,
      },
      req,
    });

    res.json({
      borrow: updatedBorrow,
      fine: fine || null,
      nextInQueueNotified: notified ? notified.userId : null,
      message: fine
        ? `Book returned late by ${fine.daysLate} day(s). Fine of ₹${fine.amount} added.`
        : "Book returned on time. No fine.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyBorrows = async (req, res) => {
  try {
    const borrows = await prisma.borrow.findMany({
      where: { userId: req.user.id },
      include: { book: { select: { title: true, author: true, isbn: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { borrowBook, returnBook, getMyBorrows };