import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { SUBMISSION_STATUS_LABELS } from '@/lib/labels'
import { Search, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Track a submission' }

const PIPELINE = [
  'SUBMITTED',
  'UNDER_SCREENING',
  'UNDER_REVIEW',
  'REVISION_REQUESTED',
  'ACCEPTED',
  'PUBLISHED',
] as const

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; email?: string }>
}) {
  const sp = await searchParams
  const id = (sp.id ?? '').trim()
  const email = (sp.email ?? '').trim().toLowerCase()

  // Both the tracking ID and the matching email are required — the ID alone
  // must not expose another author's submission.
  const submission =
    id && email
      ? await db.submission.findFirst({
          where: {
            trackingId: { equals: id, mode: 'insensitive' },
            correspondingAuthorEmail: { equals: email, mode: 'insensitive' },
          },
          include: { journal: { select: { name: true, primaryColor: true } } },
        })
      : null

  const searched = Boolean(id && email)
  const currentIndex = submission
    ? PIPELINE.indexOf(submission.status as (typeof PIPELINE)[number])
    : -1

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
        Track a submission
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
        Enter the tracking ID from your confirmation email together with the corresponding
        author&rsquo;s email address.
      </p>

      <form className="mt-8 space-y-4 rounded-sm border border-paper-line bg-white p-6">
        <div>
          <label htmlFor="id" className="block text-[13.5px] font-medium text-ink-900">
            Tracking ID
          </label>
          <input
            id="id"
            name="id"
            defaultValue={id}
            placeholder="JCDR-2026-0041"
            className="mt-1.5 w-full rounded-sm border border-paper-line px-3 py-2.5 font-mono text-[14px]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-[13.5px] font-medium text-ink-900">
            Corresponding author&rsquo;s email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            className="mt-1.5 w-full rounded-sm border border-paper-line px-3 py-2.5 text-[14px]"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-sm bg-ink-900 px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
        >
          <Search className="h-4 w-4" aria-hidden />
          Check status
        </button>
      </form>

      {searched && !submission && (
        <div className="mt-6 flex items-start gap-2.5 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3.5 text-[13.5px] leading-relaxed text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            No submission matched that tracking ID and email address. Check both against your
            confirmation email — the email must be the corresponding author&rsquo;s.
          </span>
        </div>
      )}

      {submission && (
        <div className="mt-8 rounded-sm border border-paper-line bg-white">
          <div className="h-1" style={{ backgroundColor: submission.journal.primaryColor }} />
          <div className="p-6">
            <p className="font-mono text-[12.5px] text-ink-500">{submission.trackingId}</p>
            <h2 className="mt-2 font-serif text-[1.25rem] font-semibold leading-snug text-ink-900">
              {submission.manuscriptTitle}
            </h2>
            <p className="mt-2 text-[13px] text-ink-600">
              {submission.journal.name} · Submitted {formatDate(submission.submittedAt)}
            </p>

            <div className="mt-7">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Current status
              </p>
              <ol className="space-y-0">
                {PIPELINE.map((stage, i) => {
                  const done = currentIndex >= 0 && i < currentIndex
                  const active = stage === submission.status
                  return (
                    <li key={stage} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span
                          className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                            active
                              ? 'border-ink-900 bg-ink-900'
                              : done
                                ? 'border-ink-400 bg-ink-400'
                                : 'border-paper-line bg-white'
                          }`}
                          aria-hidden
                        />
                        {i < PIPELINE.length - 1 && (
                          <span
                            className={`w-0.5 flex-1 ${done ? 'bg-ink-400' : 'bg-paper-line'}`}
                            aria-hidden
                          />
                        )}
                      </div>
                      <p
                        className={`pb-5 text-[13.5px] ${
                          active
                            ? 'font-semibold text-ink-900'
                            : done
                              ? 'text-ink-600'
                              : 'text-ink-400'
                        }`}
                      >
                        {SUBMISSION_STATUS_LABELS[stage]}
                        {active && <span className="ml-2 text-[12px] font-normal">— current</span>}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </div>

            {(submission.status === 'REJECTED' || submission.status === 'WITHDRAWN') && (
              <p className="mt-2 rounded-sm bg-paper-shade px-4 py-3 text-[13.5px] text-ink-700">
                This submission is marked as{' '}
                <strong>{SUBMISSION_STATUS_LABELS[submission.status]}</strong>. If you believe
                this is an error, please contact the editorial office.
              </p>
            )}

            <p className="mt-4 border-t border-paper-line pt-4 text-[12.5px] leading-relaxed text-ink-500">
              Statuses are updated by the editorial office as your manuscript moves through
              review. You will also be emailed when the status changes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
