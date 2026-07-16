const express = require("express");
const {
  createBook, getBooks, getBookById, updateBook, deleteBook, uploadBookCover,
} = require("../controllers/book.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Books
 *   description: Book catalog management
 */

/**
 * @openapi
 * /api/books:
 *   get:
 *     tags: [Books]
 *     summary: Get all books (public)
 *     security: []
 *     responses:
 *       200:
 *         description: List of all books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *   post:
 *     tags: [Books]
 *     summary: Create a book (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, author, isbn]
 *             properties:
 *               title:        { type: string, example: Atomic Habits }
 *               author:       { type: string, example: James Clear }
 *               isbn:         { type: string, example: "9780735211292" }
 *               genre:        { type: string, example: Self Help }
 *               totalCopies:  { type: integer, example: 5 }
 *               cover:        { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Book created
 *       403:
 *         description: Insufficient permissions
 */
router.route("/")
  .get(getBooks)
  .post(protect, authorize("admin", "librarian"), upload.single("cover"), createBook);

/**
 * @openapi
 * /api/books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get a book by ID (public)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *   put:
 *     tags: [Books]
 *     summary: Update a book (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:       { type: string }
 *               author:      { type: string }
 *               isbn:        { type: string }
 *               genre:       { type: string }
 *               totalCopies: { type: integer }
 *               cover:       { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated book
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     tags: [Books]
 *     summary: Delete a book (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Book removed
 *       403:
 *         description: Insufficient permissions
 */
router.route("/:id")
  .get(getBookById)
  .put(protect, authorize("admin", "librarian"), upload.single("cover"), updateBook)
  .delete(protect, authorize("admin", "librarian"), deleteBook);

/**
 * @openapi
 * /api/books/{id}/cover:
 *   post:
 *     tags: [Books]
 *     summary: Upload book cover (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [cover]
 *             properties:
 *               cover: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Cover uploaded
 *       403:
 *         description: Insufficient permissions
 */
router.post("/:id/cover", protect, authorize("admin", "librarian"), upload.single("cover"), uploadBookCover);

module.exports = router;