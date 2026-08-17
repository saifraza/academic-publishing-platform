import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { ARTICLE_TYPE_LABELS, SUBMISSION_STATUS_LABELS } from '@/lib/labels'
import { StatusForm } from './status-form'
import { NotesForm } from './notes-form'
import { FileDown, ArrowLeft, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

type CoAuthor = { fullName?: string; email?: string; affiliation?: string; orcid?: string }

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const submission = await db.submission.findUnique({
    where: { id },
    include: { journal: { select: { name: true, slug: true, primaryColor: true } } },
  })
  if (!submission) notFound()

  const coAuthors = Array.isArray(submission.coAuthors)
    ? (submission.coAuthors as CoAuthor[])
    : []

  const files = [
    ['Manuscript', submission.manuscriptFileUrl],
    ['Cover letter', submission.coverLetterFileUrl],
    ['Supplementary material', submission.supplementaryFileUrl],
  ].filter(([, url]) => url) as [string, string][]

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/submissions"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        All submissions
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-sm border border-paper-line bg-white">
            <div className="h-1" style={{ backgroundColor: submission.journal.primaryColor }} />
            <div className="p-6">
              <p className="font-mono text-[12.5px] text-ink-500">{submission.trackingId}</p>
              <h1 className="mt-2 font-serif text-[1.5rem] font-semibold leading-snug text-ink-900">
                {submission.manuscriptTitle}
              </h1>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-600">
                <span>{submission.journal.name}</span>
                <span aria-hidden className="text-ink-300">·</span>
                <span>{ARTICLE_TYPE_LABELS[submission.articleType]}</span>
                <span aria-hidden className="text-ink-300">·</span>
                <span>Received {formatDate(submission.submittedAt)}</span>
              </p>

              <section className="mt-7">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Abstract
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-800">
                  {submission.abstract}
                </p>
              </section>

              {submission.keywords.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    Keywords
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {submission.keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-sm bg-paper-shade px-2 py-1 text-[12px] text-ink-700"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-7 border-t border-paper-line pt-6">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  Corresponding author
                </h2>
                <p className="mt-2 text-[14px] font-medium text-ink-900">
                  {submission.correspondingAuthorName}
                </p>
                <p className="text-[13px] text-ink-600">{submission.correspondingAffiliation}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                  <a
                    href={`mailto:${submission.correspondingAuthorEmail}`}
                    className="inline-flex items-center gap-1.5 text-ink-800 underline underline-offset-2"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {submission.correspondingAuthorEmail}
                  </a>
                  {submission.correspondingAuthorPhone && (
                    <span className="text-ink-600">{submission.correspondingAuthorPhone}</span>
                  )}
                  {submission.correspondingOrcid && (
                    <a
                      href={`https://orcid.org/${submission.correspondingOrcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-600 underline underline-offset-2"
                    >
                      ORCID {submission.correspondingOrcid}
                    </a>
                  )}
                </p>

                {coAuthors.length > 0 && (
                  <>
                    <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      Co-authors
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {coAuthors.map((a, i) => (
                        <li key={i} className="text-[13px]">
                          <span className="font-medium text-ink-900">{a.fullName}</span>
                          {a.affiliation && (
                            <span className="text-ink-600"> — {a.affiliation}</span>
                          )}
                          {a.email && <span className="block text-[12px] text-ink-500">{a.email}</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </div>
          </div>

          <div className="mt-6">
            <NotesForm id={submission.id} initial={submission.internalNotes} />
          </div>
        </div>

        {/* ------------------------------------------------------- Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-sm border border-paper-line bg-white p-5">
            <h2 className="mb-1 font-serif text-[1.05rem] font-semibold text-ink-900">
              Current status
            </h2>
            <p className="mb-4 text-[12.5px] text-ink-500">
              Currently: {SUBMISSION_STATUS_LABELS[submission.status]}
            </p>
            <StatusForm id={submission.id} current={submission.status} />
          </div>

          <div className="rounded-sm border border-paper-line bg-white p-5">
            <h2 className="mb-3 font-serif text-[1.05rem] font-semibold text-ink-900">Files</h2>
            {files.length === 0 ? (
              <p className="text-[13px] text-ink-500">No files were attached.</p>
            ) : (
              <ul className="space-y-2">
                {files.map(([label, url]) => (
                  <li key={label}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-sm border border-paper-line px-3 py-2 text-[13px] font-medium text-ink-800 hover:bg-paper-shade"
                    >
                      <FileDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {submission.status === 'ACCEPTED' && (
            <div className="rounded-sm border border-green-300 bg-green-50 p-5">
              <h2 className="font-serif text-[1.05rem] font-semibold text-green-900">
                Ready to publish
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-green-900">
                This manuscript has been accepted. Create the published article record, then set
                this submission to Published.
              </p>
              <Link
                href="/admin/articles/new"
                className="mt-3 inline-block rounded-sm bg-green-800 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-green-900"
              >
                Publish this article
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
