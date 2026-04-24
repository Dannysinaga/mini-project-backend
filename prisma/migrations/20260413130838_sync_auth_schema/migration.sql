/*
  Warnings:

  - You are about to drop the column `available_seats` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `events` table. All the data in the column will be lost.
  - The `status` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `password_resets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `points_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_used` on the `points_history` table. All the data in the column will be lost.
  - The primary key for the `referral_usages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `coupon_code` on the `referral_usages` table. All the data in the column will be lost.
  - You are about to drop the column `expired_at` on the `transactions` table. All the data in the column will be lost.
  - The `status` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `discount_type` on the `vouchers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[coupon_id]` on the table `referral_usages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transaction_id,ticket_type_id]` on the table `transaction_items` will be added. If there are existing duplicate values, this will fail.
  - Made the column `category` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `points_history` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `source` on the `points_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `available_quota` to the `ticket_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `transaction_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_deadline_at` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('WAITING_PAYMENT', 'WAITING_CONFIRMATION', 'DONE', 'REJECTED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CouponSource" AS ENUM ('REFERRAL');

-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "PointSource" AS ENUM ('REFERRAL_REWARD', 'TRANSACTION_USE', 'TRANSACTION_REFUND', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_user_id_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_organizer_id_fkey";

-- DropForeignKey
ALTER TABLE "referral_usages" DROP CONSTRAINT "referral_usages_new_user_id_fkey";

-- DropForeignKey
ALTER TABLE "referral_usages" DROP CONSTRAINT "referral_usages_referrer_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_event_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_user_id_fkey";

-- DropForeignKey
ALTER TABLE "transaction_items" DROP CONSTRAINT "transaction_items_ticket_type_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_event_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "source" "CouponSource" NOT NULL DEFAULT 'REFERRAL',
ADD COLUMN     "used_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "events" DROP COLUMN "available_seats",
DROP COLUMN "price",
ADD COLUMN     "banner_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "password_resets" DROP CONSTRAINT "password_resets_pkey",
ADD COLUMN     "used_at" TIMESTAMP(3),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "password_resets_id_seq";

-- AlterTable
ALTER TABLE "points_history" DROP CONSTRAINT "points_history_pkey",
DROP COLUMN "is_used",
ADD COLUMN     "reference_id" TEXT,
ADD COLUMN     "reference_type" TEXT,
ADD COLUMN     "remaining_amount" INTEGER,
ADD COLUMN     "type" "PointType" NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "source",
ADD COLUMN     "source" "PointSource" NOT NULL,
ALTER COLUMN "expires_at" DROP NOT NULL,
ADD CONSTRAINT "points_history_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "points_history_id_seq";

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "referral_usages" DROP CONSTRAINT "referral_usages_pkey",
DROP COLUMN "coupon_code",
ADD COLUMN     "coupon_id" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "referral_usages_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "referral_usages_id_seq";

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ticket_types" ADD COLUMN     "available_quota" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "transaction_items" ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "expired_at",
ADD COLUMN     "confirmation_deadline_at" TIMESTAMP(3),
ADD COLUMN     "coupon_discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coupon_id" TEXT,
ADD COLUMN     "payment_deadline_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "payment_uploaded_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "voucher_discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voucher_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'WAITING_PAYMENT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "vouchers" DROP COLUMN "discount_type",
ADD COLUMN     "quota" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "used_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "coupons_user_id_is_used_idx" ON "coupons"("user_id", "is_used");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events"("location");

-- CreateIndex
CREATE INDEX "events_start_date_idx" ON "events"("start_date");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "points_history_user_id_idx" ON "points_history"("user_id");

-- CreateIndex
CREATE INDEX "points_history_expires_at_idx" ON "points_history"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "referral_usages_coupon_id_key" ON "referral_usages"("coupon_id");

-- CreateIndex
CREATE INDEX "referral_usages_referrer_id_idx" ON "referral_usages"("referrer_id");

-- CreateIndex
CREATE INDEX "reviews_event_id_idx" ON "reviews"("event_id");

-- CreateIndex
CREATE INDEX "ticket_types_event_id_idx" ON "ticket_types"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_items_transaction_id_ticket_type_id_key" ON "transaction_items"("transaction_id", "ticket_type_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_event_id_idx" ON "transactions"("event_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "vouchers_event_id_idx" ON "vouchers"("event_id");

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_new_user_id_fkey" FOREIGN KEY ("new_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_usages" ADD CONSTRAINT "referral_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
