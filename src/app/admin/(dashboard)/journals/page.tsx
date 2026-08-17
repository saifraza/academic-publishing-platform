import Link from 'next/link'
import { db } from '@/lib/db'
import { requireUser } from '@/auth'
import { setJournalPublished } from './actions'
import { FREQUENCY_LABELS } from '@/lib/labels'
import { Plus, ExternalLink, AlertCircle, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminJournalsPage() {
  const user = await requireUser()
  const isAdmin = user.role === 'SUPER_ADMIN'

  const journals = await db.journal.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { articles: true } } },
  })

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Journals</h1>
          <p className="mt-1.5 text-[14px] text-ink-600">
            Every journal the house publishes, live or still being set up.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/journals/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add a journal
          </Link>
        )}
      </header>

      {journals.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-6 w-6 text-ink-300" aria-hidden />
          <p className="font-serif text-[1.15rem] font-semibold text-ink-900">No journals yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            A journal holds its own articles, volumes and editorial board. Set the first one up
            here — nothing appears on the public site until you choose to show it.
          </p>
          {isAdmin ? (
            <Link
              href="/admin/journals/new"
              className="mt-5 inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add your first journal
            </Link>
          ) : (
            <p className="mt-5 text-[12.5px] text-ink-500">
              Ask an administrator to add the first journal.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {journals.map((j) => {
            const missing = [
              !j.issnOnline && !j.issnPrint && 'an ISSN',
              !j.doiPrefix && 'a DOI prefix',
            ].filter(Boolean)

            return (
              <article
                key={j.id}
                className="flex flex-col rounded-sm border border-paper-line bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    title={`Accent colour ${j.primaryColor}`}
                    className="mt-0.5 h-10 w-10 shrink-0 rounded-sm border border-paper-line"
                    style={{ backgroundColor: j.primaryColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/journals/${j.id}`}
                      className="font-serif text-[1.15rem] font-semibold leading-snug text-ink-900 hover:underline"
                    >
                      {j.name}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {j.shortName || j.abbreviation || `/journals/${j.slug}`}
                    </p>
                  </div>
                  {j.isPublished ? (
                    <span className="shrink-0 rounded-sm bg-green-50 px-2 py-0.5 text-[11.5px] font-medium text-green-800">
                      Live
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-sm bg-paper-shade px-2 py-0.5 text-[11.5px] font-medium text-ink-600">
                      Not shown yet
                    </span>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px] sm:grid-cols-4">
                  <div>
                    <dt className="text-ink-500">ISSN (online)</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">
                      {j.issnOnline || <span className="font-normal text-ink-400">—</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">ISSN (print)</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">
                      {j.issnPrint || <span className="font-normal text-ink-400">—</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Articles</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">
                      {j._count.articles.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Issues</dt>
                    <dd className="mt-0.5 font-medium text-ink-900">
                      {FREQUENCY_LABELS[j.frequency]}
                    </dd>
                  </div>
                </dl>

                {missing.length > 0 && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-sm bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    Still missing {missing.join(' and ')} — indexing services look for these.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-paper-line pt-4">
                  <Link
                    href={`/admin/journals/${j.id}`}
                    className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/articles?journal=${j.slug}`}
                    className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                  >
                    Its articles
                  </Link>
                  {j.isPublished && (
                    <a
                      href={`/journals/${j.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                    >
                      View
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                  <form
                    className="ml-auto"
                    action={async () => {
                      'use server'
                      await setJournalPublished(j.id, !j.isPublished)
                    }}
                  >
                    <button
                      type="submit"
                      title={
                        j.isPublished
                          ? 'Hide this journal and all of its pages from the public site'
                          : 'Show this journal and all of its published articles on the public site'
                      }
                      className="rounded-sm border border-ink-300 px-2.5 py-1 text-[12.5px] font-medium text-ink-800 hover:bg-paper-shade"
                    >
                      {j.isPublished ? 'Take off the site' : 'Put on the site'}
                    </button>
                  </form>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
