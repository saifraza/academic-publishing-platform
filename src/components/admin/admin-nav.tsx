'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Layers,
  Inbox,
  Users,
  FileCog,
  Megaphone,
  Settings,
  UserCog,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
  badge?: boolean
  /** Not built yet — rendered greyed out rather than as a link that 404s. */
  pending?: boolean
}

const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    heading: 'Publishing',
    items: [
      { href: '/admin/articles', label: 'Articles', icon: FileText },
      { href: '/admin/issues', label: 'Volumes and issues', icon: Layers },
      { href: '/admin/journals', label: 'Journals', icon: BookOpen },
    ],
  },
  {
    heading: 'Editorial',
    items: [
      { href: '/admin/submissions', label: 'Submissions', icon: Inbox, badge: true },
      { href: '/admin/editorial-board', label: 'Editorial board', icon: Users },
      { href: '/admin/reviewers', label: 'Reviewers', icon: UserCog },
    ],
  },
  {
    heading: 'Site content',
    items: [
      { href: '/admin/pages', label: 'Pages and policies', icon: FileCog },
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/settings', label: 'Site settings', icon: Settings },
    ],
  },
]

export function AdminNav({
  pendingSubmissions,
  userName,
  userRole,
  mark,
}: {
  pendingSubmissions: number
  userName: string
  userRole: string
  mark: string
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin"
      className="hidden w-60 shrink-0 flex-col border-r border-paper-line bg-white md:flex"
    >
      <div className="border-b border-paper-line px-5 py-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink-900 font-serif text-[15px] font-semibold text-white"
          >
            {mark}
          </span>
          <span>
            <span className="block text-[13.5px] font-semibold leading-tight text-ink-900">
              Publishing admin
            </span>
            <span className="block text-[11.5px] text-ink-500">
              {userRole === 'SUPER_ADMIN' ? 'Administrator' : 'Editor'}
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">
              {section.heading}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                const Icon = item.icon

                if (item.pending) {
                  return (
                    <li key={item.href}>
                      <span
                        title="Not built yet"
                        className="flex cursor-not-allowed items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] text-ink-300"
                      >
                        <Icon className="h-[15px] w-[15px] shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide">soon</span>
                      </span>
                    </li>
                  )
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] transition-colors',
                        active
                          ? 'bg-ink-900 font-medium text-white'
                          : 'text-ink-700 hover:bg-paper-shade hover:text-ink-900',
                      )}
                    >
                      <Icon className="h-[15px] w-[15px] shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge && pendingSubmissions > 0 && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold',
                            active ? 'bg-white text-ink-900' : 'bg-ink-900 text-white',
                          )}
                        >
                          {pendingSubmissions}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-paper-line px-5 py-3">
        <p className="truncate text-[12px] text-ink-500">{userName}</p>
      </div>
    </nav>
  )
}
