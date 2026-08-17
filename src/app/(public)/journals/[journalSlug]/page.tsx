import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { FREQUENCY_LABELS, PEER_REVIEW_LABELS, LICENSE_LABELS, DESIGNATION_LABELS } from '@/lib/labels'
import { ArticleListItem } from '@/components/site/article-list-item'
import { ArrowRight, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}): Promise<Metadata> {
  const { journalSlug } = await params
  const j = await db.journal.findUnique({ where: { slug: journalSlug } })
  if (!j) return {}
  return {
    title: j.name,
    description: j.description,
  }
}

export default async function JournalHomePage({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}) {
  const { journalSlug } = await params

  const journal = await db.journal.findUnique({
    where: { slug: journalSlug },
    include: {
      _count: { select: { articles: true } },
      editorialBoard: {
        where: { designation: 'EDITOR_IN_CHIEF', isActive: true },
        take: 1,
      },
    },
  })
  if (!journal) notFound()

  const [currentIssue, popular, announcements] = await Promise.all([
    db.issue.findFirst({
      where: { volume: { journalId: journal.id }, isPublished: true },
      orderBy: { publishedAt: 'desc' },
      include: {
        volume: true,
        articles: {
          where: { isPublished: true },
          orderBy: { pageStart: 'asc' },
          include: { authors: { orderBy: { order: 'asc' } } },
        },
      },
    }),
    db.article.findMany({
      where: { journalId: journal.id, isPublished: true },
      orderBy: { downloadCount: 'desc' },
      take: 5,
      select: { slug: true, title: true, downloadCount: true },
    }),
    db.announcement.findMany({
      where: {
        journalId: journal.id,
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 2,
    }),
  ])

  const eic = journal.editorialBoard[0]

  return (
    <div className="shell py-10">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        {/* -------------------------------------------------------- Main */}
        <div className="lg:col-span-8">
          <section className="mb-10">
            <p className="max-w-prose text-[16px] leading-relaxed text-ink-800">
              {journal.description}
            </p>
            <Link
              href={`/journals/${journal.slug}/aims-and-scope`}
              className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium accent-text hover:underline"
            >
              Read the full aims and scope <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          {currentIssue && (
            <section>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink-900 pb-2">
                <h2 className="font-serif text-[1.5rem] font-semibold text-ink-900">
                  Current issue
                </h2>
                <p className="text-[13px] text-ink-600">
                  Volume {currentIssue.volume.number}, Issue {currentIssue.number} ·{' '}
                  {formatDate(currentIssue.publishedAt)}
                </p>
              </div>

              {currentIssue.isSpecialIssue && currentIssue.specialIssueTitle && (
                <p className="mt-3 rounded-sm bg-paper-shade px-4 py-3 text-[13.5px] text-ink-700">
                  <strong className="font-semibold">Special issue:</strong>{' '}
                  {currentIssue.specialIssueTitle}
                </p>
              )}

              <div className="divide-y divide-paper-line">
                {currentIssue.articles.map((a) => (
                  <ArticleListItem key={a.id} journalSlug={journal.slug} article={a} />
                ))}
              </div>

              <Link
                href={`/journals/${journal.slug}/archives`}
                className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-700 hover:text-ink-900"
              >
                Browse all issues <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          )}
        </div>

        {/* ----------------------------------------------------- Sidebar */}
        <aside className="space-y-8 lg:col-span-4">
          <div className="rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
              Journal information
            </h2>
            <dl className="space-y-3 text-[13px]">
              {[
                ['ISSN (online)', journal.issnOnline ?? 'In progress'],
                ['Frequency', FREQUENCY_LABELS[journal.frequency]],
                ['Review model', PEER_REVIEW_LABELS[journal.peerReviewType]],
                ['Licence', LICENSE_LABELS[journal.licenseType]?.short],
                [
                  'Article charges',
                  journal.apcAmount === 0
                    ? 'None'
                    : `${journal.apcCurrency} ${journal.apcAmount.toLocaleString()}`,
                ],
                ['Articles published', String(journal._count.articles)],
                journal.foundedYear ? ['Founded', String(journal.foundedYear)] : null,
              ]
                .filter((r): r is [string, string] => r !== null)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 border-b border-paper-line pb-2.5 last:border-0">
                    <dt className="shrink-0 text-ink-500">{label}</dt>
                    <dd className="text-right font-medium text-ink-900">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {eic && (
            <div className="rounded-sm border border-paper-line bg-white p-6">
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                {DESIGNATION_LABELS[eic.designation]}
              </h2>
              <p className="font-serif text-[1.05rem] font-semibold text-ink-900">
                {eic.fullName}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{eic.affiliation}</p>
              <Link
                href={`/journals/${journal.slug}/editorial-board`}
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium accent-text hover:underline"
              >
                Full editorial board <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {popular.length > 0 && (
            <div className="rounded-sm border border-paper-line bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-[1.05rem] font-semibold text-ink-900">
                <TrendingUp className="h-4 w-4 text-ink-400" aria-hidden />
                Most downloaded
              </h2>
              <ol className="space-y-3.5">
                {popular.map((a, i) => (
                  <li key={a.slug} className="flex gap-3">
                    <span className="mt-0.5 w-4 shrink-0 text-[12px] font-medium text-ink-400">
                      {i + 1}
                    </span>
                    <Link
                      href={`/journals/${journal.slug}/articles/${a.slug}`}
                      className="text-[13.5px] leading-snug text-ink-800 hover:underline hover:underline-offset-2"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {announcements.length > 0 && (
            <div className="rounded-sm border border-paper-line bg-paper-shade p-6">
              <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
                Announcements
              </h2>
              <div className="space-y-4">
                {announcements.map((n) => (
                  <article key={n.id}>
                    <p className="text-[11.5px] uppercase tracking-wide text-ink-500">
                      {formatDate(n.publishedAt)}
                    </p>
                    <h3 className="mt-1 text-[13.5px] font-semibold leading-snug text-ink-900">
                      {n.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-700">
                      {n.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
