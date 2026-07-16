const prisma = require("../config/prisma");
const { sendReservationReadyEmail } = require("./email.service");

const createReservation = async (userId, bookId) => {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    const error = new Error("Book not found");
    error.statusCode = 404;
    throw error;
  }

  if (book.availableCopies > 0) {
    const error = new Error("Copies are available — borrow directly instead of reserving");
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.reservation.findFirst({
    where: {
      userId,
      bookId,
      status: { in: ["waiting", "notified"] },
    },
  });
  if (existing) {
    const error = new Error("You already have an active reservation for this book");
    error.statusCode = 400;
    throw error;
  }

  return prisma.reservation.create({ data: { userId, bookId } });
};

const getQueuePosition = async (bookId, reservationId) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation || reservation.status !== "waiting") return null;

  const position = await prisma.reservation.count({
    where: {
      bookId,
      status: "waiting",
      createdAt: { lte: reservation.createdAt },
    },
  });

  return position;
};

const fulfillNextReservation = async (bookId) => {
  // FIFO — sabse purana waiting reservation pehle
  const next = await prisma.reservation.findFirst({
    where: { bookId, status: "waiting" },
    orderBy: { createdAt: "asc" },
  });

  if (!next) return null;

  await prisma.reservation.update({
    where: { id: next.id },
    data: { status: "notified", notifiedAt: new Date() },
  });

  // Copy hold karo us user ke liye
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (book && book.availableCopies > 0) {
    await prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    });
  }

  // Email notify karo
  const user = await prisma.user.findUnique({ where: { id: next.userId } });
  if (user && book) {
    await sendReservationReadyEmail(user, book);
  }

  return next;
};

module.exports = { createReservation, getQueuePosition, fulfillNextReservation };