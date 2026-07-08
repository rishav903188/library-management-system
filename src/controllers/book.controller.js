const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const { auditLog } = require("../services/audit.service");

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

const getBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({ orderBy: { createdAt: "desc" } });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

const deleteBook = async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.coverImage) {
      const filePath = path.join(__dirname, "..", book.coverImage);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.book.delete({ where: { id: req.params.id } });

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

    res.json({ message: "Cover image uploaded successfully", book: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createBook, getBooks, getBookById, updateBook, deleteBook, uploadBookCover };