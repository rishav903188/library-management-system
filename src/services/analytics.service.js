const prisma = require("../config/prisma");

const getOverview = async () => {
  // Promise.all — sab counts parallel me chalenge, sequential nahi
  const [totalBooks, totalUsers, activeBorrows, waitingReservations, fineGroups] =
    await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.borrow.count({ where: { status: "borrowed" } }),
      prisma.reservation.count({ where: { status: "waiting" } }),
      prisma.fine.groupBy({
        by: ["status"],
        _sum: { amount: true },
      }),
    ]);

  const finesByStatus = { paid: 0, unpaid: 0, waived: 0 };
  fineGroups.forEach((g) => {
    finesByStatus[g.status] = Number(g._sum.amount) || 0;
    // Number() kyun? Prisma Decimal type return karta hai — plain number chahiye
  });

  return {
    totalBooks,
    totalUsers,
    activeBorrows,
    waitingReservations,
    finesCollected: finesByStatus.paid,
    finesPending: finesByStatus.unpaid,
    finesWaived: finesByStatus.waived,
  };
};

const getMostBorrowedBooks = async (limit = 5) => {
  // Prisma ka groupBy — MongoDB ke $group jaisa
  const grouped = await prisma.borrow.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  // groupBy se sirf bookId aur count milta hai — book details alag fetch karni padegi
  const bookIds = grouped.map((g) => g.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, author: true, genre: true },
  });

  // Dono ko combine karo
  return grouped.map((g) => ({
    ...books.find((b) => b.id === g.bookId),
    borrowCount: g._count.id,
  }));
};

const getOverdueBorrows = async () => {
  const overdue = await prisma.borrow.findMany({
    where: {
      status: "borrowed",
      dueDate: { lt: new Date() },
    },
    include: {
      user: { select: { name: true, email: true } },
      book: { select: { title: true, author: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return overdue.map((b) => ({
    borrowId: b.id,
    user: b.user,
    book: b.book,
    dueDate: b.dueDate,
    daysOverdue: Math.ceil((new Date() - b.dueDate) / (1000 * 60 * 60 * 24)),
  }));
};

module.exports = { getOverview, getMostBorrowedBooks, getOverdueBorrows };