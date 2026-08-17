import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { ARTICLE_TYPE_LABELS, LICENSE_LABELS } from '@/lib/labels'
import { CiteButton } from '@/components/site/cite-button'
import { vancouver, type CitationInput } from '@/lib/citation'
import { FileDown, ExternalLink, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

async function getArticle(journalSlug: string, articleSlug: string) {
  const journal = await db.journal.findUnique({ where: { slug: journalSlug } })
  if (!journal) return null

  const article = await db.article.findUnique({
    where: { journalId_slug: { journalId: journal.id, slug: articleSlug } },
    include: {
      authors: { orderBy: { order: 'asc' } },
      journal: true,
      issue: { include: { volume: true } },
    },
  })
  if (!article || !article.isPublished) return null
  return article
}

/**
 * Google Scholar and every major indexing service read Highwire Press meta
 * tags. Getting these wrong means the article is invisible to them, so they
 * are generated from the record rather than hand-maintained.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string; articleSlug: string }>
}): Promise<Metadata> {
  const { journalSlug, articleSlug } = await params
  const a = await getArticle(journalSlug, articleSlug)
  if (!a) return {}

  const url = `${SITE}/journals/${journalSlug}/articles/${articleSlug}`
  const pubDate = a.publishedAt?.toISOString().slice(0, 10) ?? ''

  const other: Record<string, string | string[]> = {
    citation_title: a.title,
    citation_journal_title: a.journal.name,
    citation_publisher: 'Meridian Academic Press',
    citation_author: a.authors.map((x) => x.fullName),
    citation_author_institution: a.authors.map((x) => x.affiliation).filter(Boolean),
    citation_publication_date: pubDate,
    citation_online_date: pubDate,
    citation_abstract_html_url: url,
    citation_language: 'en',
  }
  if (a.journal.issnOnline) other.citation_issn = a.journal.issnOnline
  if (a.journal.abbreviation) other.citation_journal_abbrev = a.journal.abbreviation
  if (a.issue?.volume.number) other.citation_volume = String(a.issue.volume.number)
  if (a.issue?.number) other.citation_issue = String(a.issue.number)
  if (a.pageStart) other.citation_firstpage = String(a.pageStart)
  if (a.pageEnd) other.citation_lastpage = String(a.pageEnd)
  if (a.doi) other.citation_doi = a.doi
  if (a.pdfUrl) other.citation_pdf_url = a.pdfUrl
  if (a.keywords.length) other.citation_keywords = a.keywords.join('; ')

  return {
    title: a.title,
    description: a.abstract.slice(0, 300),
    alternates: { canonical: url },
    openGraph: {
      title: a.title,
      description: a.abstract.slice(0, 300),
      url,
      type: 'article',
      siteName: a.journal.name,
      publishedTime: a.publishedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: a.title,
      description: a.abstract.slice(0, 200),
    },
    other,
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ journalSlug: string; articleSlug: string }>
}) {
  const { journalSlug, articleSlug } = await params
  const a = await getArticle(journalSlug, articleSlug)
  if (!a) notFound()

  const related = await db.article.findMany({
    where: { journalId: a.journalId, isPublished: true, id: { not: a.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { slug: true, title: true, publishedAt: true, authors: { orderBy: { order: 'asc' }, take: 3 } },
  })

  const url = `${SITE}/journals/${journalSlug}/articles/${articleSlug}`
  const licence = LICENSE_LABELS[a.journal.licenseType]

  const citation: CitationInput = {
    title: a.title,
    authors: a.authors.map((x) => ({ fullName: x.fullName })),
    journalName: a.journal.name,
    journalAbbreviation: a.journal.abbreviation,
    year: a.publishedAt?.getFullYear() ?? null,
    volume: a.issue?.volume.number ?? null,
    issue: a.issue?.number ?? null,
    pageStart: a.pageStart,
    pageEnd: a.pageEnd,
    articleNumber: a.articleNumber,
    doi: a.doi,
    url,
  }

  // Unique affiliations, numbered — the way a real journal renders them
  const affiliations = Array.from(
    new Set(a.authors.map((x) => x.affiliation).filter(Boolean)),
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: a.title,
    abstract: a.abstract,
    keywords: a.keywords.join(', '),
    datePublished: a.publishedAt?.toISOString(),
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: a.authors.map((x) => ({
      '@type': 'Person',
      name: x.fullName,
      affiliation: x.affiliation ? { '@type': 'Organization', name: x.affiliation } : undefined,
      identifier: x.orcid ? `https://orcid.org/${x.orcid}` : undefined,
    })),
    publisher: { '@type': 'Organization', name: 'Meridian Academic Press' },
    isPartOf: {
      '@type': 'PublicationIssue',
      issueNumber: a.issue?.number,
      datePublished: a.issue?.publishedAt?.toISOString(),
      isPartOf: {
        '@type': 'PublicationVolume',
        volumeNumber: a.issue?.volume.number,
        isPartOf: { '@type': 'Periodical', name: a.journal.name, issn: a.journal.issnOnline },
      },
    },
    ...(a.doi ? { identifier: `https://doi.org/${a.doi}`, sameAs: `https://doi.org/${a.doi}` } : {}),
    license: licence?.url,
    url,
  }

  return (
    <div className="shell py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="no-print mb-6 text-[12.5px] text-ink-500">
        <Link href={`/journals/${journalSlug}`} className="hover:text-ink-800">
          {a.journal.shortName || a.journal.name}
        </Link>
        {a.issue && (
          <>
            <span className="mx-1.5" aria-hidden>/</span>
            <Link
              href={`/journals/${journalSlug}/archives/${a.issue.volume.number}/${a.issue.number}`}
              className="hover:text-ink-800"
            >
              Volume {a.issue.volume.number}, Issue {a.issue.number}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        {/* ------------------------------------------------------ Article */}
        <article className="lg:col-span-8">
          <span className="mb-4 inline-block rounded-sm accent-bg px-2.5 py-1 text-[11.5px] font-medium">
            {ARTICLE_TYPE_LABELS[a.articleType]}
          </span>

          <h1 className="font-serif text-[2rem] font-semibold leading-[1.2] tracking-tight text-ink-900 md:text-[2.35rem]">
            {a.title}
          </h1>

          {/* Authors with superscript affiliation markers */}
          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-800">
            {a.authors.map((au, i) => {
              const affIndex = affiliations.indexOf(au.affiliation)
              return (
                <span key={au.id}>
                  {i > 0 && ', '}
                  <span className="font-medium">{au.fullName}</span>
                  {affIndex >= 0 && <sup className="ml-0.5 text-[11px]">{affIndex + 1}</sup>}
                  {au.isCorresponding && (
                    <sup className="ml-0.5 accent-text" title="Corresponding author">
                      ✉
                    </sup>
                  )}
                  {au.orcid && (
                    <a
                      href={`https://orcid.org/${au.orcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`ORCID ${au.orcid}`}
                      className="ml-1 text-[#a6ce39] hover:opacity-75"
                      aria-label={`ORCID record for ${au.fullName}`}
                    >
                      ⁂
                    </a>
                  )}
                </span>
              )
            })}
          </p>

          {affiliations.length > 0 && (
            <ol className="mt-3 space-y-0.5 text-[12.5px] leading-relaxed text-ink-600">
              {affiliations.map((aff, i) => (
                <li key={aff}>
                  <sup className="mr-1">{i + 1}</sup>
                  {aff}
                </li>
              ))}
            </ol>
          )}

          {a.authors.find((x) => x.isCorresponding) && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-ink-600">
              <Mail className="h-3.5 w-3.5 text-ink-400" aria-hidden />
              Corresponding author:{' '}
              <span className="font-medium text-ink-800">
                {a.authors.find((x) => x.isCorresponding)?.fullName}
              </span>
            </p>
          )}

          {/* Publication record */}
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-paper-line py-5 text-[12.5px] sm:grid-cols-4">
            {[
              ['Received', formatDate(a.receivedAt)],
              ['Revised', formatDate(a.revisedAt)],
              ['Accepted', formatDate(a.acceptedAt)],
              ['Published', formatDate(a.publishedAt)],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-ink-500">{label}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">{value}</dd>
                </div>
              ))}
          </dl>

          {/* Identifiers */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
            {a.doi && (
              <a
                href={`https://doi.org/${a.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium accent-text hover:underline"
              >
                https://doi.org/{a.doi}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
            {licence && (
              <a
                href={licence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-paper-line bg-paper-shade px-2 py-1 text-ink-700 hover:border-ink-400"
                title={licence.full}
              >
                {licence.short}
              </a>
            )}
            {a.issue && (
              <span className="text-ink-600">
                Vol. {a.issue.volume.number}, Issue {a.issue.number}
                {a.pageStart && `, pp. ${a.pageStart}–${a.pageEnd ?? a.pageStart}`}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="no-print mt-7 flex flex-wrap gap-3">
            {a.pdfUrl ? (
              <a
                href={a.pdfUrl}
                className="inline-flex items-center gap-2 rounded-sm accent-bg px-5 py-2.5 text-[13.5px] font-medium transition-opacity hover:opacity-90"
              >
                <FileDown className="h-4 w-4" aria-hidden />
                Download PDF
              </a>
            ) : (
              <span
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-sm border border-paper-line bg-paper-shade px-5 py-2.5 text-[13.5px] font-medium text-ink-400"
                title="The typeset PDF has not been uploaded for this article yet"
              >
                <FileDown className="h-4 w-4" aria-hidden />
                PDF not yet uploaded
              </span>
            )}
            <CiteButton citation={citation} bibKey={a.slug.slice(0, 24)} />
          </div>

          {/* Abstract */}
          <section className="mt-10">
            <h2 className="mb-3 font-serif text-[1.3rem] font-semibold text-ink-900">Abstract</h2>
            <div className="prose-doc max-w-prose">
              {a.abstract.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {a.keywords.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Keywords
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {a.keywords.map((k) => (
                  <Link
                    key={k}
                    href={`/search?q=${encodeURIComponent(k)}`}
                    className="rounded-sm border border-paper-line bg-paper-shade px-2.5 py-1 text-[12.5px] text-ink-700 transition-colors hover:border-ink-400 hover:text-ink-900"
                  >
                    {k}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Declarations */}
          <section className="mt-10 space-y-5 border-t border-paper-line pt-8">
            {[
              ['Funding', a.fundingStatement],
              ['Conflict of interest', a.conflictOfInterest],
              ['Data availability', a.dataAvailability],
              ['Acknowledgements', a.acknowledgements],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    {label}
                  </h3>
                  <p className="mt-1.5 max-w-prose text-[13.5px] leading-relaxed text-ink-700">
                    {value}
                  </p>
                </div>
              ))}
          </section>

          {/* How to cite */}
          <section className="mt-8 rounded-sm border border-paper-line bg-paper-shade p-5">
            <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              How to cite this article
            </h2>
            <p className="text-[13.5px] leading-relaxed text-ink-800">{vancouver(citation)}</p>
          </section>
        </article>

        {/* ------------------------------------------------------ Sidebar */}
        <aside className="no-print space-y-8 lg:col-span-4">
          <div className="rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
              Article metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-serif text-[1.75rem] font-semibold leading-none text-ink-900">
                  {a.viewCount.toLocaleString()}
                </p>
                <p className="mt-1 text-[12px] text-ink-600">Abstract views</p>
              </div>
              <div>
                <p className="font-serif text-[1.75rem] font-semibold leading-none text-ink-900">
                  {a.downloadCount.toLocaleString()}
                </p>
                <p className="mt-1 text-[12px] text-ink-600">Downloads</p>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-3 font-serif text-[1.05rem] font-semibold text-ink-900">
              Published in
            </h2>
            <Link
              href={`/journals/${journalSlug}`}
              className="text-[14px] font-medium accent-text hover:underline"
            >
              {a.journal.name}
            </Link>
            {a.journal.issnOnline && (
              <p className="mt-1 text-[12.5px] text-ink-500">ISSN {a.journal.issnOnline}</p>
            )}
            {licence && (
              <p className="mt-4 text-[12.5px] leading-relaxed text-ink-600">
                This is an open access article distributed under the terms of the{' '}
                <a
                  href={licence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-ink-900"
                >
                  {licence.full}
                </a>{' '}
                licence.
              </p>
            )}
          </div>

          {related.length > 0 && (
            <div className="rounded-sm border border-paper-line bg-white p-6">
              <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
                More from this journal
              </h2>
              <ul className="space-y-4">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/journals/${journalSlug}/articles/${r.slug}`}
                      className="text-[13.5px] font-medium leading-snug text-ink-800 hover:underline hover:underline-offset-2"
                    >
                      {r.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-ink-500">
                      {r.authors.map((x) => x.fullName).join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
