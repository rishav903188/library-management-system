const express = require("express");
const {
  downloadBorrowHistory,
  downloadFineReceipt,
} = require("../controllers/report.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/borrow-history", protect, downloadBorrowHistory);
router.get("/fine-receipt/:fineId", protect, downloadFineReceipt);

module.exports = router;