# Academic Publishing Platform

A multi-journal open-access publishing platform: one publisher website, any number of
journals underneath it, full article archives, a manuscript submission system, and an
admin panel designed for someone who has never used a CMS.

Built to the structure of real academic publishers — the metadata that Google Scholar,
DOAJ and Crossref actually read is generated from the database, not hand-maintained.

---

## Running it locally

You need Node 20+ and PostgreSQL running.

```bash
createdb aman_journals
npm install
cp .env.example .env     # then set DATABASE_URL to your local database
npx prisma db push
SEED_ADMIN_PASSWORD="choose-a-strong-one" npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

The seed prints the admin login when it finishes. Set `SEED_ADMIN_PASSWORD` to
choose one; leave it unset and a random password is generated and printed.

| | |
|---|---|
| **URL** | <http://localhost:3000/admin> |
| **Email** | `admin@publisher.test`, or `SEED_ADMIN_EMAIL` |
| **Password** | whatever the seed printed |

The password is deliberately not stored in this repository.

---

## How to publish your first article

Written for a non-technical publisher. No code, no terminal.

1. **Sign in** at `/admin` with the email and password above.
2. Click **Publish an article** on the dashboard.
3. **Choose the journal.** The list of issues below it changes to match.
4. **Choose the issue**, or leave it as *Not in an issue* to publish ahead of an issue.
5. **Paste the title and abstract.** The abstract matters more than it looks — it is what
   appears in Google Scholar and in search results. An article with no abstract is
   flagged on your dashboard.
6. **Add the authors** in the order they appear on the paper. Use the arrows to reorder.
   Tick *Corresponding author* for whoever handles correspondence. Add ORCIDs if you have
   them; indexing services increasingly expect them.
7. **Upload the PDF.**
8. **Fill in the publication record** — DOI, page numbers, and the received / accepted /
   published dates. The DOI must be registered with Crossref first; this field only
   records it.
9. At the bottom, tick **Publish this article** and press **Save article**.

Nothing is visible to the public until that tick. Leave it unticked to save a draft and
come back later.

To take something offline again, open it and untick the same box.

---

## Deploying to Railway

1. Push this repository to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**, and pick it.
3. Add the **PostgreSQL** plugin. Railway sets `DATABASE_URL` automatically.
4. Add the remaining variables from `.env.example` under **Variables**.
   Generate the auth secret with `openssl rand -base64 32`.
5. Deploy. Railway builds the Dockerfile, runs `prisma migrate deploy` on release, and
   health-checks `/api/health`.
6. Seed the first admin user once, from the Railway shell: `npm run db:seed`.
   **This wipes existing data** — only run it on a fresh database.

### Object storage is not optional in production

Railway's filesystem is wiped on every deploy. Without the `S3_*` variables set, uploaded
PDFs and submitted manuscripts are written to local disk and **will be lost**. The admin
dashboard shows a warning banner while storage is unconfigured.

Cloudflare R2 is the cheapest option that works: create a bucket, enable public read
access, create an API token, and fill in the five `S3_*` variables.

### Custom domain

Add the domain in Railway under **Settings → Domains**, then update `NEXTAUTH_URL` and
`NEXT_PUBLIC_SITE_URL` to match. `NEXT_PUBLIC_SITE_URL` is baked into canonical URLs,
sitemap entries and OAI-PMH records, so a stale value quietly breaks indexing.

---

## What makes this indexable

These are the parts that determine whether a journal can ever be accepted by DOAJ,
Scopus or Google Scholar. They are generated from the database on every request:

| Feature | Where |
|---|---|
| Highwire Press meta tags (`citation_*`) | every article page `<head>` |
| JSON-LD `ScholarlyArticle` | every article page |
| OAI-PMH 2.0 with Dublin Core | `/api/oai?verb=Identify` |
| Per-journal RSS | `/journals/<slug>/rss.xml` |
| Sitemap from the live database | `/sitemap.xml` |
| Canonical URLs, Open Graph, Twitter cards | every page |

Verify the OAI endpoint after deploying:

```bash
curl "https://your-domain/api/oai?verb=ListRecords&metadataPrefix=oai_dc"
```

---

## Project layout

```
prisma/schema.prisma          the whole data model
prisma/seed.ts                sample publisher, 2 journals, 12 articles

src/app/(public)/             the public website
src/app/admin/                the editorial admin panel
src/app/api/oai/              OAI-PMH harvesting endpoint

src/lib/labels.ts             human-readable labels for every enum
src/lib/citation.ts           APA / MLA / Chicago / Vancouver / BibTeX / RIS
src/lib/storage.ts            S3 uploads with magic-byte validation
src/lib/mail.ts               Resend, no-ops with a console log when unconfigured
```

## Useful commands

```bash
npm run dev          # development server
npm run build        # production build
npm run db:seed      # reset and reseed sample data (destructive)
npm run db:studio    # browse the database in a GUI
```
