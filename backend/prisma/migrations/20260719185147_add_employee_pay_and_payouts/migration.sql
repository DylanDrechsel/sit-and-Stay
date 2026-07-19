/*
  Warnings:

  - A unique constraint covering the columns `[seq]` on the table `LedgerEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[payoutId]` on the table `LedgerEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EarningType" AS ENUM ('JOB_PAY', 'TIP', 'BONUS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "defaultSitterPayPercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "BusinessMember" ADD COLUMN     "payRatePercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "payoutId" TEXT,
ADD COLUMN     "seq" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "EmployeeEarning" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "jobId" TEXT,
    "type" "EarningType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "ratePercent" DECIMAL(5,2),
    "basisAmount" DECIMAL(10,2),
    "payoutId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeEarning_memberId_payoutId_idx" ON "EmployeeEarning"("memberId", "payoutId");

-- CreateIndex
CREATE INDEX "EmployeeEarning_businessId_createdAt_idx" ON "EmployeeEarning"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeEarning_jobId_type_key" ON "EmployeeEarning"("jobId", "type");

-- CreateIndex
CREATE INDEX "Payout_businessId_createdAt_idx" ON "Payout"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Payout_memberId_status_idx" ON "Payout"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_seq_key" ON "LedgerEntry"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_payoutId_key" ON "LedgerEntry"("payoutId");

-- CreateIndex
CREATE INDEX "LedgerEntry_businessId_seq_idx" ON "LedgerEntry"("businessId", "seq" DESC);

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEarning" ADD CONSTRAINT "EmployeeEarning_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEarning" ADD CONSTRAINT "EmployeeEarning_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "BusinessMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEarning" ADD CONSTRAINT "EmployeeEarning_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEarning" ADD CONSTRAINT "EmployeeEarning_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "BusinessMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
