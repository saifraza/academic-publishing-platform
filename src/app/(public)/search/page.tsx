import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import { ARTICLE_TYPE_LABELS } from '@/lib/labels'
import { Search as SearchIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search articles across all journals by title, abstract, keyword or author.',
}

type Row = {
  id: string
  slug: string
  title: string
  abstract: string
  articleType: string
  publishedAt: Date | null
  doi: string | null
  journalSlug: string
  journalName: string
  journalColor: string
  authorNames: string | null
  rank: number
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; journal?: string; type?: string; year?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()

  const journals = await db.journal.findMany({
    where: { isPublished: true },
    select: { slug: true, name: true, shortName: true },
    orderBy: { sortOrder: 'asc' },
  })

  let results: Row[] = []
  let searched = false

  if (q) {
    searched = true
    // websearch_to_tsquery handles quoted phrases and OR/- the way a user expects.
    const conditions: Prisma.Sql[] = [
      Prisma.sql`a."isPublished" = true`,
      Prisma.sql`(
        to_tsvector('english',
          coalesce(a.title,'') || ' ' ||
          coalesce(a.abstract,'') || ' ' ||
          coalesce(array_to_string(a.keywords, ' '),'') || ' ' ||
          coalesce((select string_agg(au."fullName", ' ') from "Author" au where au."articleId" = a.id), '')
        ) @@ websearch_to_tsquery('english', ${q})
      )`,
    ]
    if (sp.journal) conditions.push(Prisma.sql`j.slug = ${sp.journal}`)
    if (sp.type) conditions.push(Prisma.sql`a."articleType"::text = ${sp.type}`)
    if (sp.year) conditions.push(Prisma.sql`extract(year from a."publishedAt") = ${Number(sp.year)}`)

    results = await db.$queryRaw<Row[]>`
      SELECT
        a.id, a.slug, a.title, a.abstract, a."articleType"::text as "articleType",
        a."publishedAt", a.doi,
        j.slug as "journalSlug", j.name as "journalName", j."primaryColor" as "journalColor",
        (select string_agg(au."fullName", ', ' order by au."order")
           from "Author" au where au."articleId" = a.id) as "authorNames",
        ts_rank(
          to_tsvector('english',
            coalesce(a.title,'') || ' ' || coalesce(a.abstract,'') || ' ' ||
            coalesce(array_to_string(a.keywords,' '),'')),
          websearch_to_tsquery('english', ${q})
        ) as rank
      FROM "Article" a
      JOIN "Journal" j ON j.id = a."journalId"
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY rank DESC, a."publishedAt" DESC
      LIMIT 50
    `
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
        Search articles
      </h1>
      <p className="mt-3 max-w-prose text-[15px] text-ink-700">
        Searches article titles, abstracts, keywords and author names across every journal. Use
        quotation marks for an exact phrase.
      </p>

      <form className="mt-7">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="e.g. periodontitis, &quot;public sphere&quot;, Ramaswamy"
            aria-label="Search query"
            className="w-full rounded-sm border border-paper-line bg-white py-3.5 pl-12 pr-4 text-[15px] placeholder:text-ink-400 focus:border-ink-500"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <select
            name="journal"
            defaultValue={sp.journal ?? ''}
            aria-label="Filter by journal"
            className="rounded-sm border border-paper-line bg-white px-3 py-2 text-[13.5px] text-ink-800"
          >
            <option value="">All journals</option>
            {journals.map((j) => (
              <option key={j.slug} value={j.slug}>
                {j.shortName || j.name}
              </option>
            ))}
          </select>

          <select
            name="type"
            defaultValue={sp.type ?? ''}
            aria-label="Filter by article type"
            className="rounded-sm border border-paper-line bg-white px-3 py-2 text-[13.5px] text-ink-800"
          >
            <option value="">All article types</option>
            {Object.entries(ARTICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-sm bg-ink-900 px-5 py-2 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            Search
          </button>
        </div>
      </form>

      {searched && (
        <div className="mt-10">
          <p className="mb-5 border-b border-paper-line pb-3 text-[13.5px] text-ink-600">
            {results.length === 0
              ? 'No articles matched your search.'
              : `${results.length} result${results.length === 1 ? '' : 's'} for “${q}”`}
          </p>

          {results.length === 0 && (
            <div className="rounded-sm border border-paper-line bg-paper-shade p-6 text-[14px] leading-relaxed text-ink-700">
              <p className="font-medium text-ink-900">Try:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>a broader term, or a single keyword rather than a phrase</li>
                <li>removing the journal or article-type filter</li>
                <li>an author&rsquo;s surname on its own</li>
              </ul>
            </div>
          )}

          <div className="divide-y divide-paper-line">
            {results.map((r) => (
              <article key={r.id} className="py-6">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
                  <span
                    className="rounded-sm px-2 py-0.5 font-medium text-white"
                    style={{ backgroundColor: r.journalColor }}
                  >
                    {ARTICLE_TYPE_LABELS[r.articleType] ?? r.articleType}
                  </span>
                  <Link href={`/journals/${r.journalSlug}`} className="text-ink-500 hover:text-ink-800">
                    {r.journalName}
                  </Link>
                  {r.publishedAt && (
                    <span className="text-ink-500">{formatDate(r.publishedAt)}</span>
                  )}
                </div>
                <h2 className="font-serif text-[1.15rem] font-semibold leading-snug">
                  <Link
                    href={`/journals/${r.journalSlug}/articles/${r.slug}`}
                    className="text-ink-900 hover:underline hover:underline-offset-4"
                  >
                    {r.title}
                  </Link>
                </h2>
                {r.authorNames && (
                  <p className="mt-1.5 text-[13px] text-ink-600">{r.authorNames}</p>
                )}
                <p className="mt-2.5 line-clamp-2 text-[14px] leading-relaxed text-ink-700">
                  {r.abstract}
                </p>
                {r.doi && <p className="mt-2 text-[12px] text-ink-500">DOI {r.doi}</p>}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
