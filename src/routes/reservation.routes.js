const express = require("express");

const {
    reserveBook,
    getMyReservations,
    cancelReservation,
}= require("../controllers/reservation.controller");

const {protect} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/:bookId", protect, reserveBook);
router.get("/my", protect, getMyReservations);
router.delete("/:id", protect, cancelReservation);

module.exports = router;