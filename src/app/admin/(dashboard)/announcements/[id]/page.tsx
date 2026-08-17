import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { AnnouncementForm } from '../announcement-form'

export const dynamic = 'force-dynamic'

function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : ''
}

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [announcement, journals] = await Promise.all([
    db.announcement.findUnique({ where: { id } }),
    db.journal.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ])

  if (!announcement) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-[1.6rem] font-semibold leading-snug text-ink-900">
          Edit announcement
        </h1>
        <p className="mt-1 line-clamp-2 text-[14px] text-ink-600">{announcement.title}</p>
        <p className="mt-3 rounded-sm bg-paper-shade px-3.5 py-2 text-[12.5px] text-ink-600">
          {announcement.isPublished
            ? 'This announcement is on the site. Changes appear as soon as you save.'
            : 'This announcement is not on the site. Nobody can see it until you tick “Show this announcement”.'}
        </p>
      </header>

      <AnnouncementForm
        initial={{
          id: announcement.id,
          journalId: announcement.journalId,
          title: announcement.title,
          body: announcement.body,
          publishedAt: toDateInput(announcement.publishedAt),
          expiresAt: toDateInput(announcement.expiresAt),
          isPublished: announcement.isPublished,
        }}
        journals={journals}
      />

      <p className="mt-8 text-center text-[12.5px] text-ink-500">
        <Link href="/admin/announcements" className="underline underline-offset-2">
          Back to all announcements
        </Link>
      </p>
    </div>
  )
}
