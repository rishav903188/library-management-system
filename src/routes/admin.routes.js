const express = require("express");
const { overview, mostBorrowed, overdue } = require("../controllers/admin.controller");
const { getAllUsers, updateUserRole } = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/rbac.middleware");
const { overview, mostBorrowed, overdue, getAuditLogs } = require("../controllers/admin.controller");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Admin-only operations — analytics and user management
 */

// ── Analytics (librarian + admin) ──────────────────────────────

/**
 * @openapi
 * /api/admin/analytics/overview:
 *   get:
 *     tags: [Admin]
 *     summary: System overview stats (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBooks:          { type: integer }
 *                 totalUsers:          { type: integer }
 *                 activeBorrows:       { type: integer }
 *                 waitingReservations: { type: integer }
 *                 finesCollected:      { type: number }
 *                 finesPending:        { type: number }
 *                 finesWaived:         { type: number }
 *       403:
 *         description: Insufficient permissions
 */
router.get("/analytics/overview", protect, authorize("admin", "librarian"), overview);

/**
 * @openapi
 * /api/admin/analytics/most-borrowed:
 *   get:
 *     tags: [Admin]
 *     summary: Top N most borrowed books (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Ranked list of most borrowed books
 *       403:
 *         description: Insufficient permissions
 */
router.get("/analytics/most-borrowed", protect, authorize("admin", "librarian"), mostBorrowed);

/**
 * @openapi
 * /api/admin/analytics/overdue:
 *   get:
 *     tags: [Admin]
 *     summary: Currently overdue borrows (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue borrows with daysOverdue
 *       403:
 *         description: Insufficient permissions
 */
router.get("/analytics/overdue", protect, authorize("admin", "librarian"), overdue);

// ── User Management (admin only) ───────────────────────────────

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (librarian/admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users list
 *       403:
 *         description: Insufficient permissions
 */
router.get("/users", protect, authorize("admin", "librarian"), getAllUsers);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Change a user's role (admin only)
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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, librarian, admin]
 *     responses:
 *       200:
 *         description: User role updated
 *       400:
 *         description: Invalid role
 *       403:
 *         description: Admin only
 *       404:
 *         description: User not found
 */
router.put("/users/:id/role", protect, authorize("admin"), updateUserRole);
/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: View audit logs (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string, example: BOOK_BORROWED }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, example: "2026-01-01" }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, example: "2026-12-31" }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Filtered audit logs
 *       403:
 *         description: Admin only
 */
router.get("/audit-logs", protect, authorize("admin"), getAuditLogs);

module.exports = router;