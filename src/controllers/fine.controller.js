const prisma = require("../config/prisma");

// @route  GET /api/fines/my
const getMyFines = async (req, res) => {
  try {
    const fines = await prisma.fine.findMany({
      where: { userId: req.user.id },
      include: {
        book: { select: { title: true, author: true, isbn: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(fines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/fines/:id/pay
const payFine = async (req, res) => {
  try {
    const fine = await prisma.fine.findUnique({ where: { id: req.params.id } });
    if (!fine) return res.status(404).json({ message: "Fine not found" });

    if (fine.userId !== req.user.id) {
      return res.status(403).json({ message: "Not your fine" });
    }

    if (fine.status === "paid") {
      return res.status(400).json({ message: "Fine already paid" });
    }

    const updated = await prisma.fine.update({
      where: { id: req.params.id },
      data: { status: "paid", paidAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/fines
const getAllFines = async (req, res) => {
  try {
    const fines = await prisma.fine.findMany({
      include: {
        user: { select: { name: true, email: true } },
        book: { select: { title: true, author: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(fines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyFines, payFine, getAllFines };