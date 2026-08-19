/*
  Warnings:

  - You are about to drop the column `supplementaryFileUrl` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "copyrightFormUrl" TEXT;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "supplementaryFileUrl",
ADD COLUMN     "copyrightFormFileUrl" TEXT;
