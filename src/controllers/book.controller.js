const fs = require("fs");
const path = require("path");
const Book = require("../models/book.model");

// @route  POST /api/books
// Create book. If cover image is sent, store its path.
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, genre, totalCopies } = req.body;

    if (!title || !author || !isbn) {
      return res
        .status(400)
        .json({ message: "Title, author and ISBN are required" });
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      genre,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      coverImage: req.file ? `/uploads/books/${req.file.filename}` : null,
    });

    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/books
const getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/books/:id
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const { title, author, isbn, genre, totalCopies } = req.body;

    if (totalCopies !== undefined) {
      const diff = totalCopies - book.totalCopies;
      book.totalCopies = totalCopies;
      book.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    book.title = title ?? book.title;
    book.author = author ?? book.author;
    book.isbn = isbn ?? book.isbn;
    book.genre = genre ?? book.genre;

    // If a new cover is uploaded, delete old one and update path
    if (req.file) {
      if (book.coverImage) {
        const oldPath = path.join(__dirname, "..", book.coverImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      book.coverImage = `/uploads/books/${req.file.filename}`;
    }

    const updatedBook = await book.save();
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.coverImage) {
      const filePath = path.join(__dirname, "..", book.coverImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await book.deleteOne();
    res.json({ message: "Book removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/books/:id/cover
const uploadBookCover = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (book.coverImage) {
      const oldPath = path.join(__dirname, "..", book.coverImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    book.coverImage = `/uploads/books/${req.file.filename}`;
    await book.save();

    res.json({
      message: "Cover image uploaded successfully",
      book,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  uploadBookCover,
};