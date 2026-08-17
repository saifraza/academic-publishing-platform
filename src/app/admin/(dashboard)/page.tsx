import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { SUBMISSION_STATUS_LABELS } from '@/lib/labels'
import { storageConfigured } from '@/lib/storage'
import { FileText, Inbox, BookOpen, Download, AlertTriangle, ArrowRight, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [journals, published, drafts, submissions, downloads, recentSubmissions, needsAttention] =
    await Promise.all([
      db.journal.count(),
      db.article.count({ where: { isPublished: true } }),
      db.article.count({ where: { isPublished: false } }),
      db.submission.count({ where: { status: { in: ['SUBMITTED', 'UNDER_SCREENING'] } } }),
      db.article.aggregate({ _sum: { downloadCount: true } }),
      db.submission.findMany({
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: { journal: { select: { name: true, primaryColor: true } } },
      }),
      db.article.findMany({
        where: {
          isPublished: true,
          OR: [{ doi: null }, { pdfUrl: null }, { abstract: '' }],
        },
        take: 8,
        include: { journal: { select: { slug: true, name: true } } },
      }),
    ])

  const stats = [
    { label: 'Published articles', value: published, icon: FileText, href: '/admin/articles' },
    { label: 'Drafts not yet live', value: drafts, icon: FileText, href: '/admin/articles?status=draft' },
    { label: 'Submissions awaiting you', value: submissions, icon: Inbox, href: '/admin/submissions' },
    { label: 'Journals', value: journals, icon: BookOpen, href: '/admin/articles' },
    { label: 'Total downloads', value: downloads._sum.downloadCount ?? 0, icon: Download, href: '/admin/articles' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Dashboard</h1>
        <p className="mt-1.5 text-[14px] text-ink-600">
          Everything that needs your attention, in one place.
        </p>
      </header>

      {!storageConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-sm border border-amber-300 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <div className="text-[13px] leading-relaxed text-amber-900">
            <p className="font-semibold">File storage is not configured</p>
            <p className="mt-0.5">
              Uploaded PDFs and manuscripts are being written to this server&rsquo;s local disk.
              That is fine for testing, but on Railway the disk is wiped on every deploy — set
              the <code className="rounded bg-amber-100 px-1">S3_*</code> environment variables
              before you publish anything real.
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Publish an article
        </Link>
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-2 rounded-sm border border-ink-300 bg-white px-4 py-2.5 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade"
        >
          Review submissions
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-sm border border-paper-line bg-white p-4 transition-shadow hover:shadow-[0_2px_12px_rgba(10,37,64,0.06)]"
          >
            <Icon className="mb-2.5 h-4 w-4 text-ink-400" aria-hidden />
            <p className="font-serif text-[1.75rem] font-semibold leading-none text-ink-900">
              {value.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[12px] leading-snug text-ink-600">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent submissions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-[1.15rem] font-semibold text-ink-900">
              Recent submissions
            </h2>
            <Link
              href="/admin/submissions"
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-600 hover:text-ink-900"
            >
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-sm border border-paper-line bg-white">
            {recentSubmissions.length === 0 && (
              <p className="px-4 py-6 text-center text-[13px] text-ink-500">
                No submissions yet.
              </p>
            )}
            <ul className="divide-y divide-paper-line">
              {recentSubmissions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/submissions/${s.id}`}
                    className="block px-4 py-3 hover:bg-paper-shade"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-ink-900">
                          {s.manuscriptTitle}
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-500">
                          <span className="font-mono">{s.trackingId}</span> ·{' '}
                          {s.correspondingAuthorName} · {formatDate(s.submittedAt)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-sm bg-paper-shade px-2 py-0.5 text-[11px] font-medium text-ink-700">
                        {SUBMISSION_STATUS_LABELS[s.status]}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Needs attention */}
        <section>
          <h2 className="mb-3 font-serif text-[1.15rem] font-semibold text-ink-900">
            Published but incomplete
          </h2>
          <div className="overflow-hidden rounded-sm border border-paper-line bg-white">
            {needsAttention.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-500">
                Every published article has its DOI, PDF and abstract. Nothing to fix.
              </p>
            ) : (
              <>
                <p className="border-b border-paper-line bg-amber-50 px-4 py-2.5 text-[12px] leading-relaxed text-amber-900">
                  These are live on the site but missing something indexing services look for.
                </p>
                <ul className="divide-y divide-paper-line">
                  {needsAttention.map((a) => {
                    const missing = [
                      !a.doi && 'DOI',
                      !a.pdfUrl && 'PDF',
                      !a.abstract && 'abstract',
                    ].filter(Boolean)
                    return (
                      <li key={a.id}>
                        <Link
                          href={`/admin/articles/${a.id}`}
                          className="block px-4 py-3 hover:bg-paper-shade"
                        >
                          <p className="truncate text-[13.5px] font-medium text-ink-900">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-amber-800">
                            Missing {missing.join(', ')}
                          </p>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
