import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Announcements' }

export default async function AnnouncementsPage() {
  const announcements = await db.announcement.findMany({
    // An expiry date has to actually take the notice down, otherwise the field
    // in the admin promises something it does not do.
    where: {
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { publishedAt: 'desc' },
    include: { journal: { select: { name: true, slug: true, primaryColor: true } } },
  })

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-[2.25rem] font-semibold leading-tight text-ink-900">
        Announcements
      </h1>
      <p className="mt-3 text-[15.5px] text-ink-700">
        Calls for papers, editorial appointments and notices from our journals.
      </p>

      <div className="mt-10 space-y-8">
        {announcements.map((n) => (
          <article key={n.id} className="border-b border-paper-line pb-8 last:border-0">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              <time className="text-ink-500">{formatDate(n.publishedAt)}</time>
              {n.journal && (
                <Link
                  href={`/journals/${n.journal.slug}`}
                  className="rounded-sm px-2 py-0.5 font-medium text-white hover:opacity-90"
                  style={{ backgroundColor: n.journal.primaryColor }}
                >
                  {n.journal.name}
                </Link>
              )}
            </div>
            <h2 className="font-serif text-[1.4rem] font-semibold leading-snug text-ink-900">
              {n.title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{n.body}</p>
          </article>
        ))}

        {announcements.length === 0 && (
          <p className="rounded-sm border border-paper-line bg-paper-shade p-6 text-[14px] text-ink-600">
            There are no announcements at the moment.
          </p>
        )}
      </div>
    </div>
  )
}
