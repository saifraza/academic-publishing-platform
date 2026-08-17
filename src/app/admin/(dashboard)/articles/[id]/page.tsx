import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ArticleForm } from '@/components/admin/article-form'
import { ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ''
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [article, journals, issues] = await Promise.all([
    db.article.findUnique({
      where: { id },
      include: {
        authors: { orderBy: { order: 'asc' } },
        journal: { select: { slug: true } },
      },
    }),
    db.journal.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, doiPrefix: true },
    }),
    db.issue.findMany({
      orderBy: [{ volume: { number: 'desc' } }, { number: 'desc' }],
      include: { volume: true },
    }),
  ])

  if (!article) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.6rem] font-semibold leading-snug text-ink-900">
              Edit article
            </h1>
            <p className="mt-1 line-clamp-2 text-[14px] text-ink-600">{article.title}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {article.isPublished && (
              <a
                href={`/journals/${article.journal.slug}/articles/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm border border-paper-line bg-white px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-paper-shade"
              >
                Preview live page
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
        </div>
        <p className="mt-3 rounded-sm bg-paper-shade px-3.5 py-2 text-[12.5px] text-ink-600">
          {article.isPublished
            ? 'This article is live. Changes appear on the site as soon as you save.'
            : 'This article is a draft. It is not visible to anyone until you publish it.'}
        </p>
      </header>

      <ArticleForm
        initial={{
          id: article.id,
          journalId: article.journalId,
          issueId: article.issueId,
          slug: article.slug,
          title: article.title,
          abstract: article.abstract,
          keywords: article.keywords,
          articleType: article.articleType,
          doi: article.doi,
          pageStart: article.pageStart,
          pageEnd: article.pageEnd,
          articleNumber: article.articleNumber,
          receivedAt: toDateInput(article.receivedAt),
          revisedAt: toDateInput(article.revisedAt),
          acceptedAt: toDateInput(article.acceptedAt),
          publishedAt: toDateInput(article.publishedAt),
          fundingStatement: article.fundingStatement,
          conflictOfInterest: article.conflictOfInterest,
          dataAvailability: article.dataAvailability,
          acknowledgements: article.acknowledgements,
          references: article.references,
          isFeatured: article.isFeatured,
          isPublished: article.isPublished,
          pdfUrl: article.pdfUrl,
          authors: article.authors.map((a) => ({
            fullName: a.fullName,
            email: a.email ?? '',
            affiliation: a.affiliation,
            country: a.country,
            orcid: a.orcid ?? '',
            isCorresponding: a.isCorresponding,
          })),
        }}
        journals={journals}
        issues={issues.map((i) => ({
          id: i.id,
          journalId: i.volume.journalId,
          label: `Volume ${i.volume.number}, Issue ${i.number} (${i.volume.year})`,
        }))}
      />

      <p className="mt-8 text-center text-[12.5px] text-ink-500">
        <Link href="/admin/articles" className="underline underline-offset-2">
          Back to all articles
        </Link>
      </p>
    </div>
  )
}
