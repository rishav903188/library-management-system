const prisma = require("../config/prisma");

const getUserGenres = async (userId) => {
  const borrows = await prisma.borrow.findMany({
    where: { userId },
    include: { book: { select: { genre: true } } },
  });
  const genres = borrows.map((b) => b.book?.genre).filter(Boolean);
  return [...new Set(genres)];
};

const getUserBorrowedBookIds = async (userId) => {
  const borrows = await prisma.borrow.findMany({
    where: { userId },
    select: { bookId: true },
  });
  return borrows.map((b) => b.bookId);
};

const getMostPopularBooks = async (limit = 5, excludeIds = []) => {
  const grouped = await prisma.borrow.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit + excludeIds.length,
  });

  const bookIds = grouped
    .map((g) => g.bookId)
    .filter((id) => !excludeIds.includes(id));

  const books = await prisma.book.findMany({
    where: { id: { in: bookIds.slice(0, limit) } },
    select: { id: true, title: true, author: true, genre: true },
  });

  return books.map((b) => ({
    ...b,
    borrowCount: grouped.find((g) => g.bookId === b.id)?._count.id || 0,
  }));
};

const getRecommendationsForUser = async (userId, limit = 5) => {
  const genres = await getUserGenres(userId);
  const alreadyBorrowedIds = await getUserBorrowedBookIds(userId);

  if (genres.length === 0) {
    return getMostPopularBooks(limit, alreadyBorrowedIds);
  }

  // Same genre ki books jo user ne nahi padhi, popularity se sort
  const grouped = await prisma.borrow.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit + alreadyBorrowedIds.length + 10,
  });

  const bookIds = grouped
    .map((g) => g.bookId)
    .filter((id) => !alreadyBorrowedIds.includes(id));

  // Un books me se sirf wahi jo user ke genres me hain
  const books = await prisma.book.findMany({
    where: {
      id: { in: bookIds },
      genre: { in: genres },
    },
    select: { id: true, title: true, author: true, genre: true },
    take: limit,
  });

  return books.map((b) => ({
    ...b,
    borrowCount: grouped.find((g) => g.bookId === b.id)?._count.id || 0,
  }));
};

const getSimilarBooks = async (bookId, limit = 5) => {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    const error = new Error("Book not found");
    error.statusCode = 404;
    throw error;
  }

  const grouped = await prisma.borrow.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit + 1,
  });

  const candidateIds = grouped
    .map((g) => g.bookId)
    .filter((id) => id !== bookId);

  const similar = await prisma.book.findMany({
    where: {
      id: { in: candidateIds },
      genre: book.genre,
    },
    select: { id: true, title: true, author: true, genre: true },
    take: limit,
  });

  // Fallback: agar koi borrow data nahi, seedha catalog se
  if (similar.length === 0) {
    return prisma.book.findMany({
      where: { genre: book.genre, id: { not: bookId } },
      select: { id: true, title: true, author: true, genre: true },
      take: limit,
    });
  }

  return similar.map((b) => ({
    ...b,
    borrowCount: grouped.find((g) => g.bookId === b.id)?._count.id || 0,
  }));
};

module.exports = {
  getRecommendationsForUser,
  getSimilarBooks,
  getMostPopularBooks,
};