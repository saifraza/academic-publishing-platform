-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Publisher" ADD COLUMN     "branchAddressLine1" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branchAddressLine2" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branchCity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branchCountry" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branchLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branchPostalCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "branchState" TEXT NOT NULL DEFAULT '';
