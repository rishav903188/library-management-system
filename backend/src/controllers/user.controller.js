const prisma = require("../config/prisma");
const { auditLog } = require("../services/audit.service");

const VALID_ROLES = ["student", "librarian", "admin"];

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be: ${VALID_ROLES.join(", ")}` });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ message: "User not found" });

    const oldRole = target.role;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    await auditLog({
      userId: req.user.id,
      action: "USER_ROLE_CHANGED",
      entity: "user",
      entityId: target.id,
      metadata: {
        targetEmail: target.email,
        oldRole,
        newRole: role,
        changedBy: req.user.email,
      },
      req,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, updateUserRole };