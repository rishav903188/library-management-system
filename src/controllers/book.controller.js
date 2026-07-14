// src/controllers/book.controller.js
const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const { auditLog } = require("../services/audit.service");
const { cacheGet, cacheSet, cacheDel, cacheClear, CACHE_KEYS, TTL } = require("../utils/cache");

// @route  GET /api/books
const getBooks = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.booksList();

    // Step 1: Cache check karo
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached); // Cache HIT — DB hit nahi hua
    }

    // Step 2: Cache MISS — DB se fetch karo
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Step 3: Result cache me store karo future requests ke liye
    await cacheSet(cacheKey, books, TTL.BOOKS_LIST);

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.bookDetail(req.params.id);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
    });

    if (!book) return res.status(404).json({ message: "Book not found" });

    await cacheSet(cacheKey, book, TTL.BOOK_DETAIL);

    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/books
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, genre, totalCopies } = req.body;

    if (!title || !author || !isbn) {
      return res.status(400).json({ message: "Title, author and ISBN are required" });
    }

    const copies = Number(totalCopies) || 1;
    const book = await prisma.book.create({
      data: {
        title, author, isbn,
        genre: genre || "General",
        totalCopies: copies,
        availableCopies: copies,
        coverImage: req.file ? `/uploads/books/${req.file.filename}` : null,
      },
    });

    // Naya book add hua — books list cache stale ho gayi, delete karo
    await cacheClear("books:*");

    await auditLog({
      userId: req.user.id,
      action: "BOOK_CREATED",
      entity: "book",
      entityId: book.id,
      metadata: { title: book.title, isbn: book.isbn },
      req,
    });

    res.status(201).json(book);
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "ISBN already exists" });
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/books/:id
const updateBook = async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: "Book not found" });

    const { title, author, isbn, genre, totalCopies } = req.body;
    let newAvailable = book.availableCopies;
    let newTotal = book.totalCopies;

    if (totalCopies !== undefined) {
      const diff = Number(totalCopies) - book.totalCopies;
      newTotal = Number(totalCopies);
      newAvailable = Math.max(0, book.availableCopies + diff);
    }

    let newCoverImage = book.coverImage;
    if (req.file) {
      if (book.coverImage) {
        const oldPath = path.join(__dirname, "..", book.coverImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      newCoverImage = `/uploads/books/${req.file.filename}`;
    }

    const updated = await prisma.book.update({
      where: { id: req.params.id },
      data: {
        title: title ?? book.title,
        author: author ?? book.author,
        isbn: isbn ?? book.isbn,
        genre: genre ?? book.genre,
        totalCopies: newTotal,
        availableCopies: newAvailable,
        coverImage: newCoverImage,
      },
    });

    // Book update hui — related cache invalidate karo
    await cacheDel(CACHE_KEYS.bookDetail(req.params.id)); // specific book cache
    await cacheClear("books:*");                           // list cache bhi

    await auditLog({
      userId: req.user.id,
      action: "BOOK_UPDATED",
      entity: "book",
      entityId: book.id,
      metadata: { title: updated.title, changes: req.body },
      req,
    });

    res.json(updated);
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ message: "ISBN already exists" });
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.coverImage) {
      const filePath = path.join(__dirname, "..", book.coverImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.book.delete({ where: { id: req.params.id } });

    // Book delete hui — cache saaf karo
    await cacheDel(CACHE_KEYS.bookDetail(req.params.id));
    await cacheClear("books:*");

    await auditLog({
      userId: req.user.id,
      action: "BOOK_DELETED",
      entity: "book",
      entityId: book.id,
      metadata: { title: book.title, isbn: book.isbn },
      req,
    });

    res.json({ message: "Book removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/books/:id/cover
const uploadBookCover = async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    if (book.coverImage) {
      const oldPath = path.join(__dirname, "..", book.coverImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updated = await prisma.book.update({
      where: { id: req.params.id },
      data: { coverImage: `/uploads/books/${req.file.filename}` },
    });

    // Cover change hua — book detail cache stale ho gayi
    await cacheDel(CACHE_KEYS.bookDetail(req.params.id));
    await cacheClear("books:*");

    res.json({ message: "Cover image uploaded successfully", book: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBook, getBooks, getBookById, updateBook, deleteBook, uploadBookCover,
};