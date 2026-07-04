-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('student', 'librarian', 'admin');

-- CreateEnum
CREATE TYPE "public"."BorrowStatus" AS ENUM ('borrowed', 'returned');

-- CreateEnum
CREATE TYPE "public"."FineStatus" AS ENUM ('unpaid', 'paid', 'waived');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('waiting', 'notified', 'fulfilled', 'cancelled');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."books" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "author" VARCHAR(150) NOT NULL,
    "isbn" VARCHAR(20) NOT NULL,
    "genre" VARCHAR(100) NOT NULL DEFAULT 'General',
    "total_copies" INTEGER NOT NULL DEFAULT 1,
    "available_copies" INTEGER NOT NULL DEFAULT 1,
    "cover_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."borrows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "borrow_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3),
    "status" "public"."BorrowStatus" NOT NULL DEFAULT 'borrowed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "borrow_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "days_late" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "public"."FineStatus" NOT NULL DEFAULT 'unpaid',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'waiting',
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "public"."books"("isbn");

-- CreateIndex
CREATE INDEX "borrows_user_id_idx" ON "public"."borrows"("user_id");

-- CreateIndex
CREATE INDEX "borrows_book_id_idx" ON "public"."borrows"("book_id");

-- CreateIndex
CREATE INDEX "borrows_status_idx" ON "public"."borrows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fines_borrow_id_key" ON "public"."fines"("borrow_id");

-- CreateIndex
CREATE INDEX "fines_user_id_idx" ON "public"."fines"("user_id");

-- CreateIndex
CREATE INDEX "fines_status_idx" ON "public"."fines"("status");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "public"."reservations"("user_id");

-- CreateIndex
CREATE INDEX "reservations_book_id_status_idx" ON "public"."reservations"("book_id", "status");

-- AddForeignKey
ALTER TABLE "public"."borrows" ADD CONSTRAINT "borrows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."borrows" ADD CONSTRAINT "borrows_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fines" ADD CONSTRAINT "fines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fines" ADD CONSTRAINT "fines_borrow_id_fkey" FOREIGN KEY ("borrow_id") REFERENCES "public"."borrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fines" ADD CONSTRAINT "fines_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
