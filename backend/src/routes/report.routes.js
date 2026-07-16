const express = require("express");
const { downloadBorrowHistory, downloadFineReceipt } = require("../controllers/report.controller");
const { protect } = require("../middlewares/auth.middleware");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Reports
 *   description: PDF report generation and download
 */

/**
 * @openapi
 * /api/reports/borrow-history:
 *   get:
 *     tags: [Reports]
 *     summary: Download borrow history as PDF
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/borrow-history", protect, downloadBorrowHistory);

/**
 * @openapi
 * /api/reports/fine-receipt/{fineId}:
 *   get:
 *     tags: [Reports]
 *     summary: Download fine receipt as PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fineId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PDF receipt
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Not your fine
 *       404:
 *         description: Fine not found
 */
router.get("/fine-receipt/:fineId", protect, downloadFineReceipt);

module.exports = router;