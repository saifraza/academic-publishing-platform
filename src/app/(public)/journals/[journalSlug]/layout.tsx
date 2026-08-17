import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { hexToRgb, contrastText } from '@/lib/utils'
import { JournalNav } from '@/components/site/journal-nav'

export default async function JournalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ journalSlug: string }>
}) {
  const { journalSlug } = await params

  const journal = await db.journal.findUnique({
    where: { slug: journalSlug },
    include: {
      pages: {
        where: { isPublished: true, showInNav: true },
        orderBy: { sortOrder: 'asc' },
        select: { slug: true, title: true, navGroup: true },
      },
    },
  })

  if (!journal || !journal.isPublished) notFound()

  const nav = [
    { href: `/journals/${journal.slug}`, label: 'Journal home' },
    { href: `/journals/${journal.slug}/aims-and-scope`, label: 'Aims and scope' },
    { href: `/journals/${journal.slug}/editorial-board`, label: 'Editorial board' },
    { href: `/journals/${journal.slug}/current-issue`, label: 'Current issue' },
    { href: `/journals/${journal.slug}/archives`, label: 'Archives' },
    ...journal.pages.map((p) => ({
      href: `/journals/${journal.slug}/${p.slug}`,
      label: p.title,
    })),
    { href: `/journals/${journal.slug}/submit`, label: 'Submit manuscript' },
  ]

  return (
    <div
      style={
        {
          '--accent': hexToRgb(journal.primaryColor),
          '--accent-fg': hexToRgb(contrastText(journal.primaryColor)),
        } as React.CSSProperties
      }
    >
      {/* Journal masthead */}
      <div className="border-b border-paper-line bg-white">
        <div className="h-1.5 accent-bg" aria-hidden />
        <div className="shell py-7">
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <Link href={`/journals/${journal.slug}`} className="group block">
                <h1 className="font-serif text-[1.7rem] font-semibold leading-tight text-ink-900 group-hover:text-ink-700 md:text-[2rem]">
                  {journal.name}
                </h1>
              </Link>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-600">
                {journal.issnOnline && <span>ISSN (online) {journal.issnOnline}</span>}
                <span aria-hidden className="text-ink-300">·</span>
                <span>Open access</span>
                <span aria-hidden className="text-ink-300">·</span>
                <span>Double-blind peer reviewed</span>
              </p>
            </div>
            <Link
              href={`/journals/${journal.slug}/submit`}
              className="shrink-0 rounded-sm accent-bg px-4 py-2.5 text-[13.5px] font-medium transition-opacity hover:opacity-90"
            >
              Submit a manuscript
            </Link>
          </div>
        </div>
      </div>

      <JournalNav items={nav} />

      {children}
    </div>
  )
}
