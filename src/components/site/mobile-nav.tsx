'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

type NavItem = { href: string; label: string }
type JournalItem = { slug: string; name: string; shortName: string; primaryColor: string }

export function MobileNav({ nav, journals }: { nav: NavItem[]; journals: JournalItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-sm border border-paper-line p-2 text-ink-700"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between border-b border-paper-line px-5 py-4">
            <span className="font-serif text-lg font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-sm border border-paper-line p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="px-5 py-4" aria-label="Mobile">
            <form action="/search" className="mb-5">
              <input
                type="search"
                name="q"
                placeholder="Search articles"
                className="w-full rounded-sm border border-paper-line bg-paper-shade px-3 py-2.5 text-sm"
              />
            </form>

            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-paper-line py-2.5 text-[15px] text-ink-800"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Journals
            </p>
            <ul className="space-y-2">
              {journals.map((j) => (
                <li key={j.slug}>
                  <Link
                    href={`/journals/${j.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-3 py-2.5 text-[14px] font-medium text-white"
                    style={{ backgroundColor: j.primaryColor }}
                  >
                    {j.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}
