import Link from 'next/link'
import { db } from '@/lib/db'
import { Search } from 'lucide-react'
import { MobileNav } from './mobile-nav'

export async function SiteHeader() {
  const [publisher, journals] = await Promise.all([
    db.publisher.findFirst(),
    db.journal.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true, shortName: true, issnOnline: true, primaryColor: true },
    }),
  ])

  // The logo mark follows the publisher name, so renaming in Site settings
  // does not leave a stale initial behind.
  const mark = (publisher?.shortName || publisher?.name || 'P')
    .replace(/^The\s+/i, '')
    .trim()
    .charAt(0)
    .toUpperCase()

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/journals', label: 'Journals' },
    { href: '/about', label: 'About' },
    { href: '/policies', label: 'Policies' },
    { href: '/announcements', label: 'Announcements' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <header className="no-print border-b border-paper-line bg-white">
      {/* Utility bar */}
      <div className="border-b border-paper-line bg-ink-950 text-[12.5px] text-ink-200">
        <div className="shell flex items-center justify-between gap-4 py-1.5">
          <p className="truncate">
            Open access · Peer reviewed · {publisher?.city}, {publisher?.country}
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <Link href="/track" className="hover:text-white">
              Track a submission
            </Link>
            <Link href="/admin" className="hover:text-white">
              Editor login
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="shell">
        <div className="flex items-center justify-between gap-6 py-5">
          {/* min-w-0 lets this flex child shrink below its content width —
              without it the publisher name forces the page to scroll sideways
              on a narrow screen. */}
          <Link href="/" className="group flex min-w-0 items-center gap-3.5">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-ink-900 font-serif text-[19px] font-semibold text-white"
            >
              {mark}
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-[18px] font-semibold leading-tight text-ink-900 group-hover:text-ink-700 sm:text-[21px]">
                {publisher?.name}
              </span>
              <span className="block truncate text-[12.5px] text-ink-500">{publisher?.tagline}</span>
            </span>
          </Link>

          <form action="/search" className="hidden md:block">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="Search articles, authors, keywords"
                aria-label="Search articles"
                className="w-72 rounded-sm border border-paper-line bg-paper-shade py-2 pl-9 pr-3 text-[13.5px] placeholder:text-ink-400 focus:border-ink-400 focus:bg-white"
              />
            </div>
          </form>

          <MobileNav nav={nav} journals={journals} />
        </div>
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary" className="hidden border-t border-paper-line md:block">
        <div className="shell flex items-stretch gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b-2 border-transparent px-3 py-2.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
          <span className="ml-auto flex items-center gap-2 py-2.5">
            {journals.map((j) => (
              <Link
                key={j.slug}
                href={`/journals/${j.slug}`}
                className="rounded-sm px-2.5 py-1 text-[12.5px] font-medium text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: j.primaryColor }}
              >
                {j.shortName || j.name}
              </Link>
            ))}
          </span>
        </div>
      </nav>
    </header>
  )
}
