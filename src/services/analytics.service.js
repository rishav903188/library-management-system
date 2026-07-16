const prisma = require("../config/prisma");
const { cacheGet, cacheSet, CACHE_KEYS, TTL } = require("../utils/cache");

const getOverview = async () => {
  const cacheKey = CACHE_KEYS.analyticsOverview();

  // Cache check
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  // DB se fetch
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
  });

  const result = {
    totalBooks,
    totalUsers,
    activeBorrows,
    waitingReservations,
    finesCollected: finesByStatus.paid,
    finesPending:   finesByStatus.unpaid,
    finesWaived:    finesByStatus.waived,
  };

  // Cache me store karo
  await cacheSet(cacheKey, result, TTL.ANALYTICS_OVERVIEW);

  return result;
};

const getMostBorrowedBooks = async (limit = 5) => {
  const cacheKey = CACHE_KEYS.analyticsMostBorrowed(limit);

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const grouped = await prisma.borrow.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const bookIds = grouped.map((g) => g.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, author: true, genre: true },
  });

  const result = grouped.map((g) => ({
    ...books.find((b) => b.id === g.bookId),
    borrowCount: g._count.id,
  }));

  await cacheSet(cacheKey, result, TTL.ANALYTICS_POPULAR);

  return result;
};

const getOverdueBorrows = async () => {
  const cacheKey = CACHE_KEYS.analyticsOverdue();

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

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

  const result = overdue.map((b) => ({
    borrowId:    b.id,
    user:        b.user,
    book:        b.book,
    dueDate:     b.dueDate,
    daysOverdue: Math.ceil((new Date() - b.dueDate) / (1000 * 60 * 60 * 24)),
  }));

  // Overdue list time-sensitive — short TTL (2 min)
  await cacheSet(cacheKey, result, TTL.ANALYTICS_OVERDUE);

  return result;
};

module.exports = { getOverview, getMostBorrowedBooks, getOverdueBorrows };