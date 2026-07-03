const {
  getOverview,
  getMostBorrowedBooks,
  getOverdueBorrows,
} = require("../services/analytics.service");

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

module.exports = { overview, mostBorrowed, overdue };