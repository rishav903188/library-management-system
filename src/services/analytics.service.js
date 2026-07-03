const Book = require("../models/book.model");
const User = require("../models/user.model");
const Borrow = require("../models/borrow.model");
const Fine = require("../models/fine.model");
const Reservation = require("../models/reservation.model");

const getOverview = async () => {
  const [totalBooks, totalUsers, activeBorrows, waitingReservations] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments(),
    Borrow.countDocuments({ status: "borrowed" }),
    Reservation.countDocuments({ status: "waiting" }),
  ]);

   // Fine totals — $group se sum nikal rahe hain status ke hisaab se
  const fineTotals = await Fine.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

    // fineTotals abhi array hai jaise: [{ _id: "paid", totalAmount: 145, count: 3 }, ...]
  // ise ek seedhe object me convert kar rahe hain taaki frontend ke liye easy ho
  const finesByStatus = { paid: 0, unpaid: 0, waived: 0 };
  fineTotals.forEach((entry) => {
    finesByStatus[entry._id] = entry.totalAmount;
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

/**
 * Sabse zyada borrow hone wali books — top N (default 5).
 * Aggregation: Borrow collection ko book ke hisaab se group karke count nikalo,
 * fir Book collection se title/author join (lookup) karo.
 */
const getMostBorrowedBooks = async (limit = 5) => {
  const result = await Borrow.aggregate([
    {
      $group: {
        _id: "$book",
        borrowCount: { $sum: 1 },
      },
    },
    { $sort: { borrowCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "books",
        foreignField: "_id",
        as: "bookDetails",
      },
    },
    { $unwind: "$bookDetails" },
    {
      $project: {
        _id: 0,
        bookId: "$bookDetails._id",
        title: "$bookDetails.title",
        author: "$bookDetails.author",
        borrowCount: 1,
      },
    },
  ]);

  return result;
};


/**
 * Abhi jo books overdue hain (due date nikal gayi, abhi tak return nahi hui).
 */
const getOverdueBorrows = async () => {
  const overdue = await Borrow.find({
    status: "borrowed",
    dueDate: { $lt: new Date() },
  })
    .populate("user", "name email")
    .populate("book", "title author")
    .sort({ dueDate: 1 }); // sabse zyada late pehle

  return overdue.map((b) => ({
    borrowId: b._id,
    user: b.user,
    book: b.book,
    dueDate: b.dueDate,
    daysOverdue: Math.ceil((new Date() - b.dueDate) / (1000 * 60 * 60 * 24)),
  }));
};

module.exports = { getOverview, getMostBorrowedBooks, getOverdueBorrows };