const express = require("express");
const {getMyFines, payFine, getAllFines} = require("../controllers/fine.controller");
const {protect} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/my",protect, getMyFines);
router.post("/:id/pay", protect,payFine );
router.get("/",protect,getAllFines);

module.exports = router;