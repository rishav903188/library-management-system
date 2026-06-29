const express = require("express");
const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  uploadBookCover,
} = require("../controllers/book.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.route("/")
  .get(getBooks)
  .post(protect, upload.single("cover"), createBook);

router
  .route("/:id")
  .get(getBookById)
  .put(protect, upload.single("cover"), updateBook)
  .delete(protect, deleteBook);

// Separate route for cover upload
router.post("/:id/cover", protect, upload.single("cover"), uploadBookCover);

module.exports = router;