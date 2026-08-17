'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function JournalNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Journal sections"
      className="no-print sticky top-0 z-30 border-b border-paper-line bg-white/95 backdrop-blur"
    >
      <div className="shell">
        <ul className="flex snap-x gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = pathname === item.href
            return (
              <li key={item.href} className="snap-start">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
                    active
                      ? 'accent-border accent-text'
                      : 'border-transparent text-ink-600 hover:border-ink-300 hover:text-ink-900',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
