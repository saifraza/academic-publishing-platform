-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'TRIANNUAL', 'BIANNUAL', 'ANNUAL', 'CONTINUOUS');

-- CreateEnum
CREATE TYPE "PeerReviewType" AS ENUM ('SINGLE_BLIND', 'DOUBLE_BLIND', 'OPEN');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('CC_BY', 'CC_BY_NC', 'CC_BY_SA', 'CC_BY_NC_ND', 'CC_BY_NC_SA');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('RESEARCH', 'REVIEW', 'CASE_REPORT', 'EDITORIAL', 'LETTER', 'SHORT_COMMUNICATION', 'COMMENTARY', 'SYSTEMATIC_REVIEW');

-- CreateEnum
CREATE TYPE "Designation" AS ENUM ('EDITOR_IN_CHIEF', 'ASSOCIATE_EDITOR', 'SECTION_EDITOR', 'BOARD_MEMBER', 'MANAGING_EDITOR', 'COPY_EDITOR', 'PRODUCTION_EDITOR', 'LANGUAGE_EDITOR', 'TECHNICAL_EDITOR', 'ADVISORY_BOARD');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_SCREENING', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'SUBMITTED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'REVIEWER');

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Academic Publishing House',
    "shortName" TEXT NOT NULL DEFAULT 'APH',
    "tagline" TEXT NOT NULL DEFAULT 'Open access research, peer reviewed.',
    "about" TEXT NOT NULL DEFAULT '',
    "mission" TEXT NOT NULL DEFAULT '',
    "vision" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0a2540',
    "addressLine1" TEXT NOT NULL DEFAULT '',
    "addressLine2" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'India',
    "postalCode" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "socials" JSONB NOT NULL DEFAULT '{}',
    "registeredName" TEXT NOT NULL DEFAULT '',
    "gstin" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL DEFAULT '',
    "abbreviation" TEXT NOT NULL DEFAULT '',
    "issnOnline" TEXT,
    "issnPrint" TEXT,
    "aimsAndScope" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "coverImageUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#0a2540',
    "subjectAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "frequency" "Frequency" NOT NULL DEFAULT 'QUARTERLY',
    "peerReviewType" "PeerReviewType" NOT NULL DEFAULT 'DOUBLE_BLIND',
    "apcAmount" INTEGER NOT NULL DEFAULT 0,
    "apcCurrency" TEXT NOT NULL DEFAULT 'INR',
    "licenseType" "LicenseType" NOT NULL DEFAULT 'CC_BY',
    "doiPrefix" TEXT,
    "foundedYear" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Volume" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "coverImageUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isSpecialIssue" BOOLEAN NOT NULL DEFAULT false,
    "specialIssueTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "issueId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "abstract" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "articleType" "ArticleType" NOT NULL DEFAULT 'RESEARCH',
    "pdfUrl" TEXT,
    "pdfSizeBytes" INTEGER,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "articleNumber" TEXT,
    "doi" TEXT,
    "publishedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "revisedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "references" TEXT NOT NULL DEFAULT '',
    "fundingStatement" TEXT NOT NULL DEFAULT '',
    "conflictOfInterest" TEXT NOT NULL DEFAULT '',
    "dataAvailability" TEXT NOT NULL DEFAULT '',
    "acknowledgements" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "affiliation" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "orcid" TEXT,
    "isCorresponding" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialMember" (
    "id" TEXT NOT NULL,
    "journalId" TEXT,
    "fullName" TEXT NOT NULL,
    "designation" "Designation" NOT NULL DEFAULT 'BOARD_MEMBER',
    "affiliation" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "orcid" TEXT,
    "profileUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "journalId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "navGroup" TEXT NOT NULL DEFAULT 'Policies',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "showInNav" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "manuscriptTitle" TEXT NOT NULL,
    "abstract" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "articleType" "ArticleType" NOT NULL DEFAULT 'RESEARCH',
    "correspondingAuthorName" TEXT NOT NULL,
    "correspondingAuthorEmail" TEXT NOT NULL,
    "correspondingAuthorPhone" TEXT NOT NULL DEFAULT '',
    "correspondingAffiliation" TEXT NOT NULL DEFAULT '',
    "correspondingOrcid" TEXT,
    "coAuthors" JSONB NOT NULL DEFAULT '[]',
    "manuscriptFileUrl" TEXT,
    "coverLetterFileUrl" TEXT,
    "supplementaryFileUrl" TEXT,
    "declarationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "assignedEditorId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reviewer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "orcid" TEXT,
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAssignment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "status" "ReviewStatus" NOT NULL DEFAULT 'INVITED',
    "recommendation" "Recommendation",
    "commentsToAuthor" TEXT NOT NULL DEFAULT '',
    "commentsToEditor" TEXT NOT NULL DEFAULT '',
    "reviewFileUrl" TEXT,

    CONSTRAINT "ReviewAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "journalIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "journalId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Journal_slug_key" ON "Journal"("slug");

-- CreateIndex
CREATE INDEX "Journal_isPublished_sortOrder_idx" ON "Journal"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "Volume_journalId_year_idx" ON "Volume"("journalId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Volume_journalId_number_key" ON "Volume"("journalId", "number");

-- CreateIndex
CREATE INDEX "Issue_isPublished_publishedAt_idx" ON "Issue"("isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_volumeId_number_key" ON "Issue"("volumeId", "number");

-- CreateIndex
CREATE INDEX "Article_isPublished_publishedAt_idx" ON "Article"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_journalId_isPublished_idx" ON "Article"("journalId", "isPublished");

-- CreateIndex
CREATE INDEX "Article_doi_idx" ON "Article"("doi");

-- CreateIndex
CREATE UNIQUE INDEX "Article_journalId_slug_key" ON "Article"("journalId", "slug");

-- CreateIndex
CREATE INDEX "Author_articleId_order_idx" ON "Author"("articleId", "order");

-- CreateIndex
CREATE INDEX "EditorialMember_journalId_sortOrder_idx" ON "EditorialMember"("journalId", "sortOrder");

-- CreateIndex
CREATE INDEX "Page_isPublished_navGroup_sortOrder_idx" ON "Page"("isPublished", "navGroup", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Page_journalId_slug_key" ON "Page"("journalId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_trackingId_key" ON "Submission"("trackingId");

-- CreateIndex
CREATE INDEX "Submission_journalId_status_idx" ON "Submission"("journalId", "status");

-- CreateIndex
CREATE INDEX "Submission_status_submittedAt_idx" ON "Submission"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reviewer_email_key" ON "Reviewer"("email");

-- CreateIndex
CREATE INDEX "ReviewAssignment_submissionId_status_idx" ON "ReviewAssignment"("submissionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Announcement_isPublished_publishedAt_idx" ON "Announcement"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "ContactMessage_isRead_createdAt_idx" ON "ContactMessage"("isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialMember" ADD CONSTRAINT "EditorialMember_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignedEditorId_fkey" FOREIGN KEY ("assignedEditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Reviewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

