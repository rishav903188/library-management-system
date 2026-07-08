const prisma = require("../config/prisma");
const { auditLog } = require("../services/audit.service");

const getMyFines = async (req, res) => {
  try {
    const fines = await prisma.fine.findMany({
      where: { userId: req.user.id },
      include: { book: { select: { title: true, author: true, isbn: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(fines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const payFine = async (req, res) => {
  try {
    const fine = await prisma.fine.findUnique({ where: { id: req.params.id } });
    if (!fine) return res.status(404).json({ message: "Fine not found" });

    if (fine.userId !== req.user.id) {
      return res.status(403).json({ message: "Not your fine" });
    }
    if (fine.status === "paid") return res.status(400).json({ message: "Fine already paid" });
    if (fine.status === "waived") return res.status(400).json({ message: "Fine already waived" });

    const updated = await prisma.fine.update({
      where: { id: req.params.id },
      data: { status: "paid", paidAt: new Date() },
    });

    await auditLog({
      userId: req.user.id,
      action: "FINE_PAID",
      entity: "fine",
      entityId: fine.id,
      metadata: { amount: fine.amount, bookId: fine.bookId },
      req,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const waiveFine = async (req, res) => {
  try {
    const fine = await prisma.fine.findUnique({ where: { id: req.params.id } });
    if (!fine) return res.status(404).json({ message: "Fine not found" });
    if (fine.status !== "unpaid") {
      return res.status(400).json({ message: `Fine is already ${fine.status}` });
    }

    const updated = await prisma.fine.update({
      where: { id: req.params.id },
      data: { status: "waived" },
    });

    await auditLog({
      userId: req.user.id,
      action: "FINE_WAIVED",
      entity: "fine",
      entityId: fine.id,
      metadata: {
        amount: fine.amount,
        waivedBy: req.user.email,
        forUserId: fine.userId,
      },
      req,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

module.exports = { getMyFines, payFine, waiveFine, getAllFines };