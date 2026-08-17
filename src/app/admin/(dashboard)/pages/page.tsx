import Link from 'next/link'
import { db } from '@/lib/db'
import { Plus, ExternalLink, FileCog } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PageRow = {
  id: string
  slug: string
  title: string
  navGroup: string
  sortOrder: number
  isPublished: boolean
  showInNav: boolean
  journalId: string | null
}

function Badge({ tone, children }: { tone: 'live' | 'draft' | 'quiet'; children: React.ReactNode }) {
  const styles = {
    live: 'bg-green-50 text-green-800',
    draft: 'bg-paper-shade text-ink-600',
    quiet: 'bg-ink-100 text-ink-700',
  }[tone]
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[11.5px] font-medium ${styles}`}>
      {children}
    </span>
  )
}

export default async function AdminPagesPage() {
  const [journals, pages] = await Promise.all([
    db.journal.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    db.page.findMany({
      orderBy: [{ navGroup: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        navGroup: true,
        sortOrder: true,
        isPublished: true,
        showInNav: true,
        journalId: true,
      },
    }),
  ])

  // Publisher-wide first, then one section per journal.
  const scopes: { key: string; heading: string; note: string; prefix: string; rows: PageRow[] }[] = [
    {
      key: 'publisher',
      heading: 'Applies to all journals',
      note: 'These pages sit under Editorial policies on the main site.',
      prefix: '/policies/',
      rows: pages.filter((p) => p.journalId === null),
    },
    ...journals.map((j) => ({
      key: j.id,
      heading: j.name,
      note: `Shown in the menu of ${j.name} only.`,
      prefix: `/journals/${j.slug}/`,
      rows: pages.filter((p) => p.journalId === j.id),
    })),
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">
            Pages and policies
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-600">
            The written pages of the site — ethics statements, author guidelines, charges and
            anything else you want readers to be able to find.
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Write a new page
        </Link>
      </header>

      {pages.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <FileCog className="mx-auto h-6 w-6 text-ink-300" aria-hidden />
          <p className="mt-3 font-serif text-[1.15rem] font-semibold text-ink-900">
            There are no pages yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            Write your first one — a peer review policy or a set of author guidelines is usually the
            place to start.
          </p>
          <Link
            href="/admin/pages/new"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Write your first page
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {scopes.map((scope) => {
            // Within a scope, pages are shown under their menu heading.
            const groups = scope.rows.reduce<Record<string, PageRow[]>>((acc, p) => {
              ;(acc[p.navGroup] ??= []).push(p)
              return acc
            }, {})

            return (
              <section key={scope.key}>
                <div className="mb-3">
                  <h2 className="font-serif text-[1.2rem] font-semibold text-ink-900">
                    {scope.heading}
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">{scope.note}</p>
                </div>

                {scope.rows.length === 0 ? (
                  <p className="rounded-sm border border-dashed border-paper-line bg-white px-4 py-6 text-center text-[13px] text-ink-500">
                    No pages here yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groups).map(([group, rows]) => (
                      <div
                        key={group}
                        className="overflow-hidden rounded-sm border border-paper-line bg-white"
                      >
                        <p className="border-b border-paper-line bg-paper-shade px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                          {group}
                        </p>
                        <ul className="divide-y divide-paper-line">
                          {rows.map((p) => (
                            <li
                              key={p.id}
                              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-paper-shade/60"
                            >
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/pages/${p.id}`}
                                  className="text-[13.5px] font-medium leading-snug text-ink-900 hover:underline"
                                >
                                  {p.title}
                                </Link>
                                <p className="mt-1 truncate text-[12px] text-ink-500">
                                  {scope.prefix}
                                  {p.slug}
                                </p>
                                <p className="mt-1.5 flex flex-wrap items-center gap-2">
                                  {p.isPublished ? (
                                    <Badge tone="live">Live</Badge>
                                  ) : (
                                    <Badge tone="draft">Not shown on the site</Badge>
                                  )}
                                  {p.isPublished && !p.showInNav && (
                                    <Badge tone="quiet">Hidden from the menu</Badge>
                                  )}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-wrap gap-2">
                                <Link
                                  href={`/admin/pages/${p.id}`}
                                  className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                                >
                                  Edit
                                </Link>
                                {p.isPublished && (
                                  <a
                                    href={`${scope.prefix}${p.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                                  >
                                    View
                                    <ExternalLink className="h-3 w-3" aria-hidden />
                                  </a>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
