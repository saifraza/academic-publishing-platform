import Link from 'next/link'
import { requireUser } from '@/auth'
import { db } from '@/lib/db'
import { EditorialMemberForm } from '@/components/admin/editorial-member-form'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewEditorialMemberPage() {
  const user = await requireUser()
  const isAdmin = user.role === 'SUPER_ADMIN'

  const journals = await db.journal.findMany({
    where: isAdmin ? {} : { id: { in: user.journalIds ?? [] } },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/editorial-board"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-600 hover:text-ink-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        Editorial board
      </Link>

      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Add a board member</h1>
        <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-600">
          Only the name and role are required. Everything you add appears on the journal&rsquo;s
          public editorial board page as soon as you save.
        </p>
      </header>

      {journals.length === 0 && !isAdmin ? (
        <p className="rounded-sm border border-paper-line bg-white px-5 py-6 text-[13.5px] text-ink-600">
          You have not been given access to any journal yet, so there is no board to add anyone to.
          Ask an administrator to assign you one.
        </p>
      ) : (
        <EditorialMemberForm
          initial={{ isActive: true }}
          journals={journals}
          canManagePublisherLevel={isAdmin}
        />
      )}
    </div>
  )
}
