const express = require("express");
const { borrowBook, returnBook, getMyBorrows } = require("../controllers/borrow.controller");
const { protect } = require("../middlewares/auth.middleware");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Borrow
 *   description: Book borrowing and returning
 */

/**
 * @openapi
 * /api/borrow/my:
 *   get:
 *     tags: [Borrow]
 *     summary: Get all borrows of the logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of borrows with book details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Borrow'
 */
router.get("/my", protect, getMyBorrows);

/**
 * @openapi
 * /api/borrow/{bookId}:
 *   post:
 *     tags: [Borrow]
 *     summary: Borrow a book
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Borrow created (due date = today + 14 days)
 *       400:
 *         description: No copies available or already borrowed
 */
router.post("/:bookId", protect, borrowBook);

/**
 * @openapi
 * /api/borrow/return/{borrowId}:
 *   put:
 *     tags: [Borrow]
 *     summary: Return a borrowed book
 *     description: Calculates fine if late, notifies next reservation user, sends emails.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: borrowId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Book returned. Includes fine if applicable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 borrow:  { $ref: '#/components/schemas/Borrow' }
 *                 fine:    { $ref: '#/components/schemas/Fine' }
 *                 message: { type: string }
 *       403:
 *         description: Not your borrow record
 */
router.put("/return/:borrowId", protect, returnBook);

module.exports = router;