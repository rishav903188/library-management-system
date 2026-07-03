const Book = require("../models/book.model");
const Borrow = require("../models/borrow.model");

/**
 * User ne ab tak kin genres ki books padhi hain, wo nikalta hai.
 */
const getUserGenres = async (userId) => {
  const borrows = await Borrow.find({ user: userId }).populate("book", "genre");

  const genres = borrows
    .map((b) => b.book?.genre)
    .filter(Boolean); // null/undefined hata do

  return [...new Set(genres)]; // duplicate genres hata do
};

/**
 * User ne already kaunsi books borrow ki hain (recommendation me dobara mat dikhao).
 */
const getUserBorrowedBookIds = async (userId) => {
  const borrows = await Borrow.find({ user: userId }).select("book");
  return borrows.map((b) => b.book.toString());
};

/**
 * Personalized recommendations:
 * 1. User ke padhe hue genres nikalo
 * 2. Un genres ki baaki books dhoondo (jo usne abhi tak nahi padhi)
 * 3. Popularity (borrowCount) ke hisaab se rank karo
 * 4. Agar user ki koi history hi nahi hai (naya user), to overall most-borrowed books dikhao (fallback)
 */
const getRecommendationsForUser = async (userId, limit = 5) => {
  const genres = await getUserGenres(userId);
  const alreadyBorrowedIds = await getUserBorrowedBookIds(userId);

  // Naya user — koi history nahi — fallback: sabse popular books dikhao
  if (genres.length === 0) {
    return getMostPopularBooks(limit, alreadyBorrowedIds);
  }

  const recommendations = await Borrow.aggregate([
    // sirf un books ke borrow records jo target genres me hain
    {
      $lookup: {
        from: "books",
        localField: "book",
        foreignField: "_id",
        as: "bookDetails",
      },
    },
    { $unwind: "$bookDetails" },
    { $match: { "bookDetails.genre": { $in: genres } } },
    {
      $group: {
        _id: "$bookDetails._id",
        title: { $first: "$bookDetails.title" },
        author: { $first: "$bookDetails.author" },
        genre: { $first: "$bookDetails.genre" },
        borrowCount: { $sum: 1 },
      },
    },
    { $sort: { borrowCount: -1 } },
    { $limit: limit + alreadyBorrowedIds.length }, // thoda extra le lo, filter ke baad kam ho sakte hain
  ]);

  // user ki already-padhi books ko result se hata do
  const filtered = recommendations.filter(
    (r) => !alreadyBorrowedIds.includes(r._id.toString())
  );

  return filtered.slice(0, limit);
};

/**
 * Fallback jab user ki koi borrow history nahi hai — overall popular books.
 */
const getMostPopularBooks = async (limit = 5, excludeIds = []) => {
  const result = await Borrow.aggregate([
    {
      $group: {
        _id: "$book",
        borrowCount: { $sum: 1 },
      },
    },
    { $sort: { borrowCount: -1 } },
    { $limit: limit + excludeIds.length },
    {
      $lookup: {
        from: "books",
        localField: "_id",
        foreignField: "_id",
        as: "bookDetails",
      },
    },
    { $unwind: "$bookDetails" },
    {
      $project: {
        _id: 1,
        title: "$bookDetails.title",
        author: "$bookDetails.author",
        genre: "$bookDetails.genre",
        borrowCount: 1,
      },
    },
  ]);

  const filtered = result.filter((r) => !excludeIds.includes(r._id.toString()));
  return filtered.slice(0, limit);
};

/**
 * "Similar books" — kisi ek specific book ke same genre ki baaki books, popularity se sorted.
 * Book detail page pe "Customers also borrowed" jaisa section ke liye useful.
 */
const getSimilarBooks = async (bookId, limit = 5) => {
  const book = await Book.findById(bookId);
  if (!book) {
    const error = new Error("Book not found");
    error.statusCode = 404;
    throw error;
  }

  const similar = await Borrow.aggregate([
    {
      $lookup: {
        from: "books",
        localField: "book",
        foreignField: "_id",
        as: "bookDetails",
      },
    },
    { $unwind: "$bookDetails" },
    {
      $match: {
        "bookDetails.genre": book.genre,
        "bookDetails._id": { $ne: book._id }, // khud ko exclude karo
      },
    },
    {
      $group: {
        _id: "$bookDetails._id",
        title: { $first: "$bookDetails.title" },
        author: { $first: "$bookDetails.author" },
        borrowCount: { $sum: 1 },
      },
    },
    { $sort: { borrowCount: -1 } },
    { $limit: limit },
  ]);

  // Agar same genre me koi aur borrow hi nahi hui hai, to seedha catalog se uthao (no popularity data)
  if (similar.length === 0) {
    const fallback = await Book.find({
      genre: book.genre,
      _id: { $ne: book._id },
    })
      .limit(limit)
      .select("title author genre");

    return fallback;
  }

  return similar;
};

module.exports = { getRecommendationsForUser, getSimilarBooks, getMostPopularBooks };