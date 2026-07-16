const express = require("express");
const { getMyRecommendations, getSimilar } = require("../controllers/recommendation.controller");
const { protect } = require("../middlewares/auth.middleware");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Recommendations
 *   description: Personalized book recommendations
 */

/**
 * @openapi
 * /api/recommendations/my:
 *   get:
 *     tags: [Recommendations]
 *     summary: Personalized recommendations based on borrow history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Recommended books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 */
router.get("/my", protect, getMyRecommendations);

/**
 * @openapi
 * /api/recommendations/similar/{bookId}:
 *   get:
 *     tags: [Recommendations]
 *     summary: Similar books (same genre, sorted by popularity) — public
 *     security: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Similar books list
 *       404:
 *         description: Book not found
 */
router.get("/similar/:bookId", getSimilar);

module.exports = router;