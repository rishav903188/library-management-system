const {
  getOverview,
  getMostBorrowedBooks,
  getOverdueBorrows,
} = require("../services/analytics.service");
const prisma = require("../config/prisma");
// @route  GET /api/admin/analytics/overview
const overview = async (req, res) => {
  try {
    const data = await getOverview();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/admin/analytics/most-borrowed?limit=5
const mostBorrowed = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const data = await getMostBorrowedBooks(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/admin/analytics/overdue
const overdue = async (req, res) => {
  try {
    const data = await getOverdueBorrows();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAuditLogs = async (req, res) => {
  try {
    const { action, userId, from, to, limit = 50 } = req.query;

    const where = {};
    if (action)  where.action   = action;
    if (userId)  where.userId   = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { overview, mostBorrowed, overdue, getAuditLogs };