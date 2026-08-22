import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { AdminNav } from '@/components/admin/admin-nav'
import { db } from '@/lib/db'
import { LogOut, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const [pendingSubmissions, publisher] = await Promise.all([
    db.submission.count({ where: { status: { in: ['SUBMITTED', 'UNDER_SCREENING'] } } }),
    db.publisher.findFirst({ select: { name: true, shortName: true } }),
  ])

  const mark = (publisher?.shortName || publisher?.name || 'P')
    .replace(/^The\s+/i, '')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-paper-shade">
      <AdminNav
        pendingSubmissions={pendingSubmissions}
        userName={session.user.name ?? 'Editor'}
        userRole={session.user.role}
        mark={mark}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-paper-line bg-white px-6 py-3">
          <p className="text-[13px] text-ink-600">
            Signed in as <span className="font-medium text-ink-900">{session.user.name}</span>
          </p>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm border border-paper-line px-3 py-1.5 text-[13px] font-medium text-ink-700 hover:bg-paper-shade"
            >
              View the live site
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/admin/login' })
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-medium text-ink-600 hover:bg-paper-shade hover:text-ink-900"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
