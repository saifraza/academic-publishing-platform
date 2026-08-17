import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { SUBMISSION_STATUS_LABELS, ARTICLE_TYPE_LABELS } from '@/lib/labels'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-800',
  UNDER_SCREENING: 'bg-indigo-50 text-indigo-800',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800',
  REVISION_REQUESTED: 'bg-orange-50 text-orange-800',
  ACCEPTED: 'bg-green-50 text-green-800',
  REJECTED: 'bg-red-50 text-red-800',
  WITHDRAWN: 'bg-ink-100 text-ink-700',
  PUBLISHED: 'bg-green-100 text-green-900',
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; journal?: string }>
}) {
  const sp = await searchParams

  const [journals, submissions, counts] = await Promise.all([
    db.journal.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, name: true, shortName: true } }),
    db.submission.findMany({
      where: {
        ...(sp.status ? { status: sp.status as never } : {}),
        ...(sp.journal ? { journal: { slug: sp.journal } } : {}),
      },
      orderBy: { submittedAt: 'desc' },
      include: { journal: { select: { name: true, shortName: true, primaryColor: true } } },
    }),
    db.submission.groupBy({ by: ['status'], _count: true }),
  ])

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Submissions</h1>
        <p className="mt-1.5 text-[14px] text-ink-600">
          Manuscripts sent through the submission form, newest first.
        </p>
      </header>

      {/* Status filter chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/admin/submissions"
          className={`rounded-sm px-3 py-1.5 text-[13px] font-medium ${
            !sp.status ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-paper-shade'
          }`}
        >
          All ({submissions.length === 0 && sp.status ? '…' : counts.reduce((n, c) => n + c._count, 0)})
        </Link>
        {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => {
          const n = countFor(value)
          if (n === 0) return null
          return (
            <Link
              key={value}
              href={`/admin/submissions?status=${value}`}
              className={`rounded-sm px-3 py-1.5 text-[13px] font-medium ${
                sp.status === value
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-ink-700 hover:bg-paper-shade'
              }`}
            >
              {label} ({n})
            </Link>
          )
        })}
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden />
          <p className="font-serif text-[1.15rem] font-semibold text-ink-900">
            Nothing here right now
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            New manuscripts submitted through the website appear here automatically, and you are
            emailed when one arrives.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-paper-line bg-white">
          <table className="w-full text-left">
            <thead className="border-b border-paper-line bg-paper-shade">
              <tr className="text-[11px] uppercase tracking-wider text-ink-500">
                <th className="px-4 py-2.5 font-semibold">Manuscript</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Author</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {submissions.map((s) => (
                <tr key={s.id} className="align-top hover:bg-paper-shade/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/submissions/${s.id}`}
                      className="text-[13.5px] font-medium leading-snug text-ink-900 hover:underline"
                    >
                      {s.manuscriptTitle}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px]">
                      <span className="font-mono text-ink-500">{s.trackingId}</span>
                      <span
                        className="rounded-sm px-1.5 py-0.5 font-medium text-white"
                        style={{ backgroundColor: s.journal.primaryColor }}
                      >
                        {s.journal.shortName || s.journal.name}
                      </span>
                      <span className="text-ink-500">{ARTICLE_TYPE_LABELS[s.articleType]}</span>
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-[13px] text-ink-800">{s.correspondingAuthorName}</p>
                    <p className="mt-0.5 text-[12px] text-ink-500">{s.correspondingAuthorEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-[11.5px] font-medium ${
                        STATUS_STYLES[s.status] ?? 'bg-paper-shade text-ink-700'
                      }`}
                    >
                      {SUBMISSION_STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] text-ink-600 sm:table-cell">
                    {formatDate(s.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
