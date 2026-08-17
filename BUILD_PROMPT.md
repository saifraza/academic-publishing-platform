# Build Spec — Academic Publishing Platform (multi-journal)

You are building a production web application from scratch. Build the whole thing in one
go, then tell me how to run it locally and deploy it to Railway.

---

## 1. What this is

An **academic publishing house** website plus the **journals** it publishes, on one
codebase and one deployment.

Real-world references to match in structure and seriousness:
- Publisher-level site: `enviropublishers.com`
- Journal-level site: `dentaljournal.org`

The owner is **non-technical**. Everything that changes over time — journals, issues,
articles, editorial board members, policy pages, logos, colours — must be editable from
an admin panel. Nothing content-related may require a code change or a redeploy.

The platform must support **multiple journals** under one publisher from day one. Journal
#1 is a dentistry journal, journal #2 is humanities, and more will follow. Journals are
*data*, not code. Never hardcode a journal.

---

## 2. Tech stack (use exactly this)

- **Next.js 15**, App Router, TypeScript, React Server Components
- **Tailwind CSS** + **shadcn/ui**
- **PostgreSQL** + **Prisma**
- **Auth.js (NextAuth v5)**, credentials provider, bcrypt hashing, role-based
- **S3-compatible object storage** for PDFs and images, via `@aws-sdk/client-s3`,
  configured purely by env vars so it works with Cloudflare R2, Backblaze B2 or AWS S3.
  Do **not** write uploads to the local filesystem — Railway containers are ephemeral.
- **Resend** for transactional email, behind a `lib/mail.ts` wrapper that no-ops with a
  console log when `RESEND_API_KEY` is unset (so local dev never needs a key)
- **Zod** for all input validation, on both client and server
- Deploy target: **Railway** (Postgres plugin + web service)

---

## 3. Data model (Prisma)

Design for the full editorial workflow now even though v1 only implements part of it.
Adding these fields later is a painful migration; adding them now is free.

```
Publisher        singleton-ish site config: name, tagline, about (rich text), logoUrl,
                 faviconUrl, primaryColor, address, email, phone, socials (JSON),
                 registeredName, gstin
Journal          slug (unique), name, shortName, issnOnline, issnPrint, aimsAndScope,
                 coverImageUrl, primaryColor, subjectAreas (string[]), frequency,
                 peerReviewType (SINGLE_BLIND|DOUBLE_BLIND|OPEN), apcAmount, apcCurrency,
                 licenseType (CC_BY|CC_BY_NC|CC_BY_SA|CC_BY_NC_ND), doiPrefix,
                 isPublished, sortOrder
Volume           journalId, number, year
Issue            volumeId, number, title, coverImageUrl, publishedAt, isPublished,
                 isSpecialIssue, specialIssueTitle
Article          issueId (nullable — supports "online first" ahead of an issue),
                 journalId, title, slug, abstract (long text), keywords (string[]),
                 articleType (RESEARCH|REVIEW|CASE_REPORT|EDITORIAL|LETTER|SHORT_COMM),
                 pdfUrl, pdfSizeBytes, pageStart, pageEnd, articleNumber, doi,
                 publishedAt, receivedAt, revisedAt, acceptedAt,
                 viewCount, downloadCount, isPublished, references (long text),
                 fundingStatement, conflictOfInterest, dataAvailability
Author           articleId, fullName, email, affiliation, orcid, isCorresponding, order
EditorialMember  journalId (nullable = publisher-level), fullName, designation
                 (EDITOR_IN_CHIEF|ASSOCIATE_EDITOR|SECTION_EDITOR|BOARD_MEMBER|
                  MANAGING_EDITOR|COPY_EDITOR|PRODUCTION_EDITOR|LANGUAGE_EDITOR),
                 affiliation, country, photoUrl, bio, orcid, profileUrl, sortOrder
Page             slug, title, body (rich text/HTML), journalId (nullable = publisher-wide),
                 navGroup, sortOrder, isPublished
                 -> this is how every policy page is created without a deploy
Submission       journalId, manuscriptTitle, abstract, keywords, articleType,
                 correspondingAuthorName/Email/Phone/Affiliation/Orcid,
                 coAuthors (JSON), manuscriptFileUrl, coverLetterFileUrl,
                 supplementaryFileUrl, declarationAccepted, trackingId (human-readable,
                 e.g. JCDR-2026-0042), status (SUBMITTED|UNDER_SCREENING|UNDER_REVIEW|
                 REVISION_REQUESTED|ACCEPTED|REJECTED|WITHDRAWN|PUBLISHED),
                 internalNotes, assignedEditorId, submittedAt
Reviewer         fullName, email, affiliation, country, orcid, expertise (string[]),
                 isActive
ReviewAssignment submissionId, reviewerId, invitedAt, respondedAt, dueAt,
                 status (INVITED|ACCEPTED|DECLINED|SUBMITTED|OVERDUE),
                 recommendation (ACCEPT|MINOR_REVISION|MAJOR_REVISION|REJECT),
                 commentsToAuthor, commentsToEditor, reviewFileUrl
User             email (unique), passwordHash, fullName, role
                 (SUPER_ADMIN|EDITOR|AUTHOR|REVIEWER), journalIds (string[]), isActive
Announcement     journalId (nullable), title, body, publishedAt, expiresAt
```

Seed the database with: one publisher, two journals (dentistry + humanities), a realistic
volume/issue/article tree with ~8 plausible sample articles, ~10 editorial board members,
and one super-admin user. Print the seeded admin credentials at the end of the seed script.

---

## 4. Public site — routes and pages

### Publisher level
| Route | Contents |
|---|---|
| `/` | Hero, publisher intro, "Browse Journals / Submit / Policies" cards, live metrics strip (journals, articles, authors, countries — computed from DB, not hardcoded), featured/recent articles across all journals, announcements |
| `/journals` | Card grid of all published journals: cover, name, ISSN, scope excerpt, frequency, article count |
| `/about` | Publisher profile, mission, vision |
| `/policies` | Index of all publisher-level `Page` records, grouped by `navGroup` |
| `/policies/[slug]` | A rendered `Page` |
| `/contact` | Address, map embed, contact form → saves to DB *and* emails |
| `/search` | Full-text search across articles: title, abstract, keywords, author names. Filters for journal, year, article type. Postgres `tsvector` + GIN index — do not do a naive `ILIKE %q%` scan |
| `/announcements` | List + detail |

### Journal level — all under `/journals/[journalSlug]`
`/` (journal home) · `/aims-and-scope` · `/editorial-board` · `/author-guidelines` ·
`/peer-review-process` · `/publication-ethics` · `/publication-charges` ·
`/current-issue` · `/archives` · `/archives/[volume]/[issue]` · `/articles/[articleSlug]` ·
`/submit` · `/indexing` · `/contact` · `/[pageSlug]` (catch-all for admin-created pages)

Each journal renders in **its own accent colour** taken from `Journal.primaryColor`, with
its own cover image and masthead, while keeping the publisher's shell — the way a real
publishing house looks.

### The article page is the most important page on the site
It must include, in this order:
1. Article type badge, title, full author list with superscript affiliation markers
2. Affiliations block, corresponding author with email, ORCID links (linked out to orcid.org)
3. DOI as a clickable `https://doi.org/...` link, licence badge with CC icon, ISSN
4. `Received / Revised / Accepted / Published` date row
5. Abstract, keywords as clickable chips → search
6. Big **Download PDF** button (tracks `downloadCount`), plus **Cite** button opening a
   modal with APA / MLA / Chicago / Vancouver / BibTeX / RIS, each individually copyable
7. Inline PDF viewer (`<iframe>` or pdf.js) below the fold
8. References list
9. "How to cite this article" block
10. Related articles from the same journal
11. Share buttons

**Machine readability is not optional** — indexing services read these:
- Full **Highwire Press / Google Scholar meta tags** in `<head>`: `citation_title`,
  `citation_author` (one per author, in order), `citation_author_institution`,
  `citation_journal_title`, `citation_issn`, `citation_volume`, `citation_issue`,
  `citation_firstpage`, `citation_lastpage`, `citation_doi`, `citation_publication_date`,
  `citation_pdf_url`, `citation_abstract_html_url`
- **JSON-LD** `ScholarlyArticle` schema
- Open Graph + Twitter card tags
- `/sitemap.xml` generated from the DB, `/robots.txt`
- Per-journal **RSS feed** at `/journals/[slug]/rss.xml`
- An **OAI-PMH endpoint** at `/api/oai` implementing `Identify`, `ListMetadataFormats`,
  `ListSets`, `ListIdentifiers`, `ListRecords`, `GetRecord` with `oai_dc` Dublin Core
  metadata. This is a hard requirement for DOAJ/indexing applications later.

### Submission form (`/journals/[slug]/submit`)
Multi-step, saves progress to `localStorage`, with a review step before final submit:
1. Article type + title + abstract + keywords
2. Authors — repeatable rows (name, email, affiliation, ORCID, corresponding checkbox),
   drag to reorder
3. File uploads — manuscript (required, PDF/DOC/DOCX, max 25 MB), cover letter, supplementary
4. Declarations — originality, no simultaneous submission, ethics approval, conflict of
   interest, consent to APC. All must be ticked.
5. Review & submit

On submit: generate a tracking ID, store the `Submission`, email the corresponding author
a confirmation with the tracking ID, and email the editors a notification. Show a clear
success screen with the tracking ID. Add `/track` where an author can enter tracking ID +
email to see the current status.

---

## 5. Admin panel (`/admin`) — this is what makes or breaks the project

The user is **not technical**. The admin panel must be usable by someone who has only ever
used Gmail and Word. Design principles, in priority order:

- **Plain language everywhere.** "Publish this issue", not "Set isPublished=true".
- **No jargon in the UI.** Never show slug, ID, boolean, or nullable to the user. Slugs are
  auto-generated from titles, with an "edit link" affordance for the rare case.
- **Guided flows over raw forms.** "Publish a new article" is a wizard: pick journal →
  pick or create volume/issue → enter details → add authors → upload PDF → preview → publish.
- **Preview before publish** on everything, opening the real public page in a new tab.
- **Draft by default.** Nothing goes live until an explicit Publish click, and the button
  says exactly what will happen: "Publish — this makes the article visible to everyone".
- **Destructive actions are soft.** Unpublish instead of delete; deletes require typing the
  title to confirm and are recoverable from a Trash view for 30 days.
- **Inline help.** A short one-line hint under every non-obvious field, and an "Is this
  required for indexing?" marker on DOI/ORCID/ISSN fields.
- **Bulk import.** A CSV/Excel importer for back-catalogue articles, with a dry-run preview
  showing exactly what will be created and what rows have errors before anything is written.

Screens:
- **Dashboard** — counts, recent submissions needing attention, incomplete articles missing
  DOI/PDF/abstract, recent downloads
- **Journals** — create/edit journal, upload cover + logo, colour picker, ISSN, scope, APC,
  licence, publish toggle
- **Issues** — tree view journal → volume → issue, drag articles between issues, "Publish
  whole issue" action
- **Articles** — table with filters, the publish wizard, drag-to-reorder authors, PDF upload
  with progress bar, DOI field with format validation
- **Submissions** — inbox view, status pipeline (kanban-ish), open a submission to read
  everything and download files, change status, add internal notes, one-click "convert this
  accepted submission into a published article" that pre-fills the article wizard
- **Reviewers** — directory, invite reviewers to a submission by email, track responses
- **Editorial board** — per journal, with photo upload and drag-to-reorder
- **Pages** — rich text editor (TipTap) for policy pages, choose which journal and which nav
  group, publish toggle
- **Announcements**
- **Site settings** — publisher name, logo, colours, contact details, socials
- **Users** — invite editors, set role and which journals they can touch

Role rules: `SUPER_ADMIN` sees everything; `EDITOR` only sees journals in their `journalIds`;
`AUTHOR`/`REVIEWER` cannot reach `/admin` at all.

---

## 6. Design direction

Serious academic publishing, not a SaaS landing page. Reference points: Oxford Academic,
Karger, BMJ — restrained, dense with real information, trustworthy.

- **Type**: a serif for article and journal titles (Source Serif 4 / Lora), a clean sans for
  UI and body (Inter). Generous measure on article text — 68–72 characters per line.
- **Colour**: near-neutral publisher shell (white / warm grey / deep navy `#0a2540`), with
  each journal contributing one accent colour used sparingly — masthead rule, links, badges.
- **Density**: information-rich. Real journals show volume/issue/page/DOI/dates up front.
  Do not hide metadata behind accordions.
- **No stock-photo hero.** Use the journal cover artwork and typography instead.
- Accessible: WCAG AA contrast, visible focus rings, full keyboard navigation, semantic
  headings, alt text on every image, skip-to-content link.
- Fully responsive down to 360 px. Tables scroll inside their own container; the page body
  never scrolls horizontally.
- **Print stylesheet** for article pages.
- Dark mode for the public site is optional; if you build it, do it with CSS variables and
  make sure the PDF viewer and journal accent colours still work.

---

## 7. Deployment

- `Dockerfile` (multi-stage, Node 20 alpine, `output: 'standalone'` in `next.config.js`)
- `railway.json` / `railway.toml` with build and start commands
- `prisma migrate deploy` runs on release, not on build
- `/api/health` returning 200 with a DB connectivity check
- `.env.example` listing every variable with a one-line comment:
  `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `S3_ENDPOINT`, `S3_BUCKET`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, `RESEND_API_KEY`,
  `EMAIL_FROM`, `EDITOR_NOTIFICATION_EMAIL`
- `README.md` with: local setup in 5 commands, seeded admin login, Railway deploy steps,
  how to point a custom domain, and a plain-English "how to publish your first article"
  section written for a non-technical person

---

## 8. Quality bar

- TypeScript strict mode, no `any`, no `@ts-ignore`
- Every mutation is a server action with Zod validation and an auth check — never trust the
  client, never expose an unauthenticated write endpoint
- File uploads validated by MIME type *and* magic bytes, with a size cap
- Rate-limit the submission and contact forms
- No N+1 queries — use Prisma `include`/`select` deliberately
- Loading and empty states on every list view; a real 404 and error boundary
- `npm run build` must pass clean with zero type errors and zero lint errors

## 9. Out of scope for v1 — do not build

Automated Crossref DOI deposit, XML typesetting (JATS), plagiarism checking, online payment
for APCs, and the fully automated blinded review round-trip. Leave the schema ready for all
of them (the fields above already are) and stub nothing.

---

## 10. How to work

Build it in one pass. Do not stop to ask me questions — where a detail is unspecified, pick
the option a real academic publisher would pick and note the choice in `DECISIONS.md`.
When you are done, run the build, fix everything it reports, and give me:
1. the commands to run it locally,
2. the seeded admin login,
3. the Railway deploy steps,
4. a list of anything you deliberately left out.
