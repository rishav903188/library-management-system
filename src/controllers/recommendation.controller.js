const {
  getRecommendationsForUser,
  getSimilarBooks,
} = require("../services/recommendation.service");

// @route  GET /api/recommendations/my?limit=5
const getMyRecommendations = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const recommendations = await getRecommendationsForUser(req.user._id, limit);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/recommendations/similar/:bookId?limit=5
const getSimilar = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const similar = await getSimilarBooks(req.params.bookId, limit);
    res.json(similar);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

module.exports = { getMyRecommendations, getSimilar };