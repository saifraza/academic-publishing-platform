import Link from 'next/link'
import { requireUser } from '@/auth'
import { JournalForm } from '@/components/admin/journal-form'
import { ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewJournalPage() {
  const user = await requireUser()

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-sm border border-paper-line bg-white px-6 py-12 text-center">
          <ShieldAlert className="mx-auto mb-3 h-6 w-6 text-ink-300" aria-hidden />
          <h1 className="font-serif text-[1.3rem] font-semibold text-ink-900">
            Only an administrator can add a journal
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            You can edit the journals you have been given, but starting a new one is reserved for
            an administrator. Ask them to set it up and assign it to you.
          </p>
          <Link
            href="/admin/journals"
            className="mt-5 inline-block rounded-sm border border-ink-300 px-4 py-2 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade"
          >
            Back to all journals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Add a journal</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
          Fill in what you have — the name is the only thing required to get started, and you can
          come back for the rest. Nothing appears on the public site until you tick{' '}
          <strong>Show this journal on the public website</strong> at the bottom.
        </p>
      </header>

      <JournalForm initial={{}} />
    </div>
  )
}
