import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { ArticleListItem } from '@/components/site/article-list-item'

export const dynamic = 'force-dynamic'

async function getIssue(journalSlug: string, volumeNo: string, issueNo: string) {
  const journal = await db.journal.findUnique({ where: { slug: journalSlug } })
  if (!journal) return null
  const volume = await db.volume.findUnique({
    where: { journalId_number: { journalId: journal.id, number: Number(volumeNo) } },
  })
  if (!volume) return null
  const issue = await db.issue.findUnique({
    where: { volumeId_number: { volumeId: volume.id, number: Number(issueNo) } },
    include: {
      volume: true,
      articles: {
        where: { isPublished: true },
        orderBy: { pageStart: 'asc' },
        include: { authors: { orderBy: { order: 'asc' } } },
      },
    },
  })
  if (!issue || !issue.isPublished) return null
  return { journal, issue }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string; volume: string; issue: string }>
}): Promise<Metadata> {
  const { journalSlug, volume, issue } = await params
  const data = await getIssue(journalSlug, volume, issue)
  if (!data) return {}
  return {
    title: `Volume ${volume}, Issue ${issue} — ${data.journal.name}`,
  }
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ journalSlug: string; volume: string; issue: string }>
}) {
  const { journalSlug, volume, issue } = await params
  const data = await getIssue(journalSlug, volume, issue)
  if (!data) notFound()
  const { journal, issue: iss } = data

  return (
    <div className="shell py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-[12.5px] text-ink-500">
        <Link href={`/journals/${journal.slug}/archives`} className="hover:text-ink-800">
          Archives
        </Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <span>Volume {iss.volume.number}</span>
      </nav>

      <header className="mb-8 border-b-2 border-ink-900 pb-4">
        <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
          Volume {iss.volume.number}, Issue {iss.number}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-ink-600">
          <span>{journal.name}</span>
          <span aria-hidden className="text-ink-300">·</span>
          <span>{formatDate(iss.publishedAt)}</span>
          <span aria-hidden className="text-ink-300">·</span>
          <span>
            {iss.articles.length} article{iss.articles.length === 1 ? '' : 's'}
          </span>
        </p>
        {iss.isSpecialIssue && iss.specialIssueTitle && (
          <p className="mt-3 inline-block rounded-sm accent-bg px-3 py-1.5 text-[13px] font-medium">
            Special issue: {iss.specialIssueTitle}
          </p>
        )}
      </header>

      <div className="divide-y divide-paper-line">
        {iss.articles.map((a) => (
          <ArticleListItem key={a.id} journalSlug={journal.slug} article={a} />
        ))}
      </div>

      {iss.articles.length === 0 && (
        <p className="text-[14px] text-ink-600">This issue does not contain any articles yet.</p>
      )}
    </div>
  )
}
