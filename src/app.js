const express = require("express");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const bookRoutes = require("./routes/book.routes");
const borrowRoutes = require("./routes/borrow.routes");
const fineRoutes = require("./routes/fine.routes");
const reservationRoutes = require("./routes/reservation.routes");
const reportRoutes = require("./routes/report.routes");
const adminRoutes = require("./routes/admin.routes");
const recommendationRoutes = require("./routes/recommendation.routes");

const app = express();

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Library Management System API — v2.0.3" });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

module.exports = app;