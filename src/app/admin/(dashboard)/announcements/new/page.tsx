import { db } from '@/lib/db'
import { AnnouncementForm } from '../announcement-form'

export const dynamic = 'force-dynamic'

export default async function NewAnnouncementPage() {
  const journals = await db.journal.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">
          Write an announcement
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
          Keep it to a paragraph or two. It appears on the home page, on the announcements page,
          and — if you pick a journal — on that journal&rsquo;s own page.
        </p>
      </header>

      <AnnouncementForm initial={{}} journals={journals} />
    </div>
  )
}
