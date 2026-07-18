-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Pet_customerId_isActive_idx" ON "Pet"("customerId", "isActive");
