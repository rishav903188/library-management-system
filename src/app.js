const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { loginLimiter, apiLimiter, publicLimiter } = require("./middlewares/rateLimiter.middleware");

const authRoutes           = require("./routes/auth.routes");
const bookRoutes           = require("./routes/book.routes");
const borrowRoutes         = require("./routes/borrow.routes");
const fineRoutes           = require("./routes/fine.routes");
const reservationRoutes    = require("./routes/reservation.routes");
const reportRoutes         = require("./routes/report.routes");
const adminRoutes          = require("./routes/admin.routes");
const recommendationRoutes = require("./routes/recommendation.routes");

const app = express();

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Library API Docs",
  swaggerOptions: { persistAuthorization: true },
}));
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/", (req, res) => {
  res.json({
    message: "Library Management System API — v3.0.3",
    docs: "http://localhost:8000/api/docs",
  });
});

// ─────────────────────────────────────────────────────────
// Routes with Rate Limiters
// ─────────────────────────────────────────────────────────

// Auth — login pe strict limiter, register pe public limiter
app.use("/api/auth/login",    loginLimiter);
app.use("/api/auth/register", publicLimiter);
app.use("/api/auth",          authRoutes);

// Books — GET public (publicLimiter), POST/PUT/DELETE protected (apiLimiter route level pe)
app.use("/api/books",         publicLimiter, bookRoutes);

// Borrow, Fines, Reports, Reservations — authenticated
app.use("/api/borrow",         apiLimiter, borrowRoutes);
app.use("/api/fines",          apiLimiter, fineRoutes);
app.use("/api/reservations",   apiLimiter, reservationRoutes);
app.use("/api/reports",        apiLimiter, reportRoutes);

// Admin — admin/librarian only — generous limit (admin kaam karta hai)
app.use("/api/admin",          apiLimiter, adminRoutes);

// Recommendations — public browse ke liye
app.use("/api/recommendations", publicLimiter, recommendationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

module.exports = app;