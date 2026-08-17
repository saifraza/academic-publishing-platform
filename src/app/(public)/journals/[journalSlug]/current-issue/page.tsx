import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * "Current issue" is not a separate page — it is whichever issue was published
 * most recently. Redirecting keeps a single canonical URL per issue, which
 * matters for DOIs and for indexing.
 */
export default async function CurrentIssuePage({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}) {
  const { journalSlug } = await params
  const journal = await db.journal.findUnique({ where: { slug: journalSlug } })
  if (!journal) notFound()

  const issue = await db.issue.findFirst({
    where: { volume: { journalId: journal.id }, isPublished: true },
    orderBy: { publishedAt: 'desc' },
    include: { volume: true },
  })

  if (!issue) {
    return (
      <div className="shell py-12">
        <h1 className="font-serif text-[2rem] font-semibold text-ink-900">Current issue</h1>
        <p className="mt-4 max-w-prose text-[15px] text-ink-600">
          No issue has been published yet. The inaugural issue will appear here once it is
          released.
        </p>
      </div>
    )
  }

  redirect(`/journals/${journalSlug}/archives/${issue.volume.number}/${issue.number}`)
}
