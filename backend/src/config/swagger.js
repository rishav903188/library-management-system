const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Library Management System API",
      version: "2.0.4",
      description:
        "Full-featured Library Management API — Auth, Books, Borrow, Fines, Reservations, PDF Reports, Analytics, Recommendations.",
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Local development server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter token from /api/auth/login response",
        },
      },

      schemas: {

        RegisterBody: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name:     { type: "string", example: "Rishav Kumar" },
            email:    { type: "string", format: "email", example: "rishav@example.com" },
            password: { type: "string", minLength: 6, example: "secret123" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email:    { type: "string", format: "email", example: "rishav@example.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            id:    { type: "string", format: "uuid" },
            name:  { type: "string" },
            email: { type: "string" },
            role:  { type: "string", enum: ["student", "librarian", "admin"] },
            token: { type: "string", description: "JWT token — use this in Authorization header" },
          },
        },

        Book: {
          type: "object",
          properties: {
            id:              { type: "string", format: "uuid" },
            title:           { type: "string", example: "Atomic Habits" },
            author:          { type: "string", example: "James Clear" },
            isbn:            { type: "string", example: "9780735211292" },
            genre:           { type: "string", example: "Self Help" },
            totalCopies:     { type: "integer", example: 5 },
            availableCopies: { type: "integer", example: 3 },
            coverImage:      { type: "string", nullable: true, example: "/uploads/books/cover-123.jpg" },
            createdAt:       { type: "string", format: "date-time" },
            updatedAt:       { type: "string", format: "date-time" },
          },
        },

        Borrow: {
          type: "object",
          properties: {
            id:         { type: "string", format: "uuid" },
            userId:     { type: "string", format: "uuid" },
            bookId:     { type: "string", format: "uuid" },
            borrowDate: { type: "string", format: "date-time" },
            dueDate:    { type: "string", format: "date-time" },
            returnDate: { type: "string", format: "date-time", nullable: true },
            status:     { type: "string", enum: ["borrowed", "returned"] },
          },
        },

        Fine: {
          type: "object",
          properties: {
            id:       { type: "string", format: "uuid" },
            daysLate: { type: "integer", example: 5 },
            amount:   { type: "number", example: 25 },
            status:   { type: "string", enum: ["unpaid", "paid", "waived"] },
            paidAt:   { type: "string", format: "date-time", nullable: true },
          },
        },

        Reservation: {
          type: "object",
          properties: {
            id:          { type: "string", format: "uuid" },
            userId:      { type: "string", format: "uuid" },
            bookId:      { type: "string", format: "uuid" },
            status:      { type: "string", enum: ["waiting", "notified", "fulfilled", "cancelled"] },
            notifiedAt:  { type: "string", format: "date-time", nullable: true },
            createdAt:   { type: "string", format: "date-time" },
          },
        },

        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Something went wrong" },
          },
        },
      },
    },

    security: [{ bearerAuth: [] }],
  },

  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;