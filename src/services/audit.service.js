const prisma = require("../config/prisma");
const auditLog = async ({
  userId = null,
  action,
  entity = null,
  entityId = null,
  metadata = null,
  req = null,
}) => {
  try {
    // IP address extract karo — proxy ke peeche ho to x-forwarded-for use karo
    const ipAddress = req
      ? req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || null
      : null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata,
        ipAddress,
      },
    });
  } catch (err) {
    // Silently fail — audit log failure never blocks the main response
    console.error(`⚠️  Audit log failed [${action}]:`, err.message);
  }
};

module.exports = { auditLog };