import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}): Promise<Metadata> {
  const { journalSlug } = await params
  const j = await db.journal.findUnique({ where: { slug: journalSlug } })
  return { title: j ? `Archives — ${j.name}` : 'Archives' }
}

export default async function ArchivesPage({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}) {
  const { journalSlug } = await params
  const journal = await db.journal.findUnique({
    where: { slug: journalSlug },
    include: {
      volumes: {
        orderBy: { number: 'desc' },
        include: {
          issues: {
            where: { isPublished: true },
            orderBy: { number: 'desc' },
            include: { _count: { select: { articles: true } } },
          },
        },
      },
    },
  })
  if (!journal) notFound()

  const volumes = journal.volumes.filter((v) => v.issues.length > 0)

  return (
    <div className="shell py-12">
      <header className="mb-10 max-w-prose">
        <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
          Archives
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-ink-700">
          The complete published record of {journal.name}. Every article remains permanently
          available at its original address.
        </p>
      </header>

      {volumes.length === 0 ? (
        <p className="rounded-sm border border-paper-line bg-paper-shade p-6 text-[14px] text-ink-600">
          No issues have been published yet.
        </p>
      ) : (
        <div className="space-y-10">
          {volumes.map((v) => (
            <section key={v.id}>
              <h2 className="mb-4 border-b-2 border-ink-900 pb-2 font-serif text-[1.35rem] font-semibold text-ink-900">
                Volume {v.number} <span className="font-normal text-ink-500">({v.year})</span>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {v.issues.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      href={`/journals/${journal.slug}/archives/${v.number}/${issue.number}`}
                      className="group block h-full rounded-sm border border-paper-line bg-white p-5 transition-shadow hover:shadow-[0_2px_14px_rgba(10,37,64,0.07)]"
                    >
                      <p className="font-serif text-[1.05rem] font-semibold text-ink-900 group-hover:underline group-hover:underline-offset-4">
                        Issue {issue.number}
                      </p>
                      {issue.isSpecialIssue && issue.specialIssueTitle && (
                        <p className="mt-1.5 text-[12.5px] font-medium accent-text">
                          Special issue: {issue.specialIssueTitle}
                        </p>
                      )}
                      <p className="mt-2 text-[12.5px] text-ink-500">
                        {formatDate(issue.publishedAt)}
                      </p>
                      <p className="mt-3 text-[13px] text-ink-700">
                        {issue._count.articles} article{issue._count.articles === 1 ? '' : 's'}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
