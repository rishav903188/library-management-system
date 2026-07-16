const express = require("express");
const { getMyFines, payFine, getAllFines, waiveFine } = require("../controllers/fine.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Fines
 *   description: Late return fine management
 */

/**
 * @openapi
 * /api/fines/my:
 *   get:
 *     tags: [Fines]
 *     summary: Get logged-in user's fines
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's fines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fine'
 */
router.get("/my", protect, getMyFines);

/**
 * @openapi
 * /api/fines/{id}/pay:
 *   put:
 *     tags: [Fines]
 *     summary: Mark own fine as paid
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fine marked as paid
 *       400:
 *         description: Fine already paid
 *       403:
 *         description: Not your fine
 */
router.put("/:id/pay", protect, payFine);

/**
 * @openapi
 * /api/fines/{id}/waive:
 *   put:
 *     tags: [Fines]
 *     summary: Waive a fine (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fine waived
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Fine not found
 */
router.put("/:id/waive", protect, authorize("admin", "librarian"), waiveFine);

/**
 * @openapi
 * /api/fines:
 *   get:
 *     tags: [Fines]
 *     summary: Get ALL fines (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All fines with user and book details
 *       403:
 *         description: Insufficient permissions
 */
router.get("/", protect, authorize("admin", "librarian"), getAllFines);

module.exports = router;