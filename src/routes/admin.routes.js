const express = require("express");
const { overview, mostBorrowed, overdue } = require("../controllers/admin.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/analytics/overview", protect, overview);
router.get("/analytics/most-borrowed", protect, mostBorrowed);
router.get("/analytics/overdue", protect, overdue);

module.exports = router;