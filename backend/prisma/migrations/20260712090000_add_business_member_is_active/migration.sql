-- Preserve BusinessMember rows when someone is removed from a business.
-- Existing memberships remain active after this migration.
ALTER TABLE "BusinessMember"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Supports listing the active members of a business.
CREATE INDEX "BusinessMember_businessId_isActive_idx"
ON "BusinessMember"("businessId", "isActive");
