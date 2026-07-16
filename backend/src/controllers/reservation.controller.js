const prisma = require("../config/prisma");
const { createReservation, getQueuePosition } = require("../services/reservation.service");
const { auditLog } = require("../services/audit.service");

const reserveBook = async (req, res) => {
  try {
    const reservation = await createReservation(req.user.id, req.params.bookId);
    const position = await getQueuePosition(req.params.bookId, reservation.id);

    await auditLog({
      userId: req.user.id,
      action: "RESERVATION_CREATED",
      entity: "reservation",
      entityId: reservation.id,
      metadata: { bookId: req.params.bookId, queuePosition: position },
      req,
    });

    res.status(201).json({ reservation, queuePosition: position });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: { book: { select: { title: true, author: true, isbn: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
    });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ message: "Not your reservation" });
    }

    if (["fulfilled", "cancelled"].includes(reservation.status)) {
      return res.status(400).json({ message: `Reservation already ${reservation.status}` });
    }

    if (reservation.status === "notified") {
      await prisma.book.update({
        where: { id: reservation.bookId },
        data: { availableCopies: { increment: 1 } },
      });
    }

    const updated = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status: "cancelled" },
    });

    await auditLog({
      userId: req.user.id,
      action: "RESERVATION_CANCELLED",
      entity: "reservation",
      entityId: reservation.id,
      metadata: { bookId: reservation.bookId, previousStatus: reservation.status },
      req,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { reserveBook, getMyReservations, cancelReservation };