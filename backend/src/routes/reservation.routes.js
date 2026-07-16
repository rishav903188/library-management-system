const express = require("express");
const { reserveBook, getMyReservations, cancelReservation } = require("../controllers/reservation.controller");
const { protect } = require("../middlewares/auth.middleware");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Reservations
 *   description: Book reservation queue (FIFO, DB-based)
 */

/**
 * @openapi
 * /api/reservations/my:
 *   get:
 *     tags: [Reservations]
 *     summary: Get logged-in user's reservations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's reservations with book details
 */
router.get("/my", protect, getMyReservations);

/**
 * @openapi
 * /api/reservations/{bookId}:
 *   post:
 *     tags: [Reservations]
 *     summary: Reserve a book (only when no copies available)
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
 *         description: Reservation created with queue position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservation:   { $ref: '#/components/schemas/Reservation' }
 *                 queuePosition: { type: integer, example: 2 }
 *       400:
 *         description: Copies available (borrow directly) or already reserved
 */
router.post("/:bookId", protect, reserveBook);

/**
 * @openapi
 * /api/reservations/{id}:
 *   delete:
 *     tags: [Reservations]
 *     summary: Cancel a reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled
 *       403:
 *         description: Not your reservation
 */
router.delete("/:id", protect, cancelReservation);

module.exports = router;