const express = require("express");
const { getMyRecommendations, getSimilar } = require("../controllers/recommendation.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/my", protect, getMyRecommendations);
router.get("/similar/:bookId", getSimilar);

module.exports = router;