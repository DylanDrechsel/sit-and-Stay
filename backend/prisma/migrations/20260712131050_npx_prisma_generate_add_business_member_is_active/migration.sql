-- AlterTable
ALTER TABLE "_JobPets" ADD CONSTRAINT "_JobPets_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_JobPets_AB_unique";
