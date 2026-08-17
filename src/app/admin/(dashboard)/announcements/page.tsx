import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { Plus, Megaphone, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAnnouncementsPage() {
  const announcements = await db.announcement.findMany({
    orderBy: [{ isPublished: 'desc' }, { publishedAt: 'desc' }],
    include: { journal: { select: { name: true, primaryColor: true } } },
    take: 200,
  })

  const today = new Date()

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Announcements</h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-600">
            Short notices for readers and authors — calls for papers, new appointments, changes to
            charges. They appear on the home page and on the announcements page.
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Write an announcement
        </Link>
      </header>

      {announcements.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <Megaphone className="mx-auto h-6 w-6 text-ink-300" aria-hidden />
          <p className="mt-3 font-serif text-[1.15rem] font-semibold text-ink-900">
            No announcements yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            A call for papers is a good first one. Anything you post here shows up on the home page.
          </p>
          <Link
            href="/admin/announcements/new"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Write your first announcement
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-paper-line bg-white">
          <ul className="divide-y divide-paper-line">
            {announcements.map((a) => {
              const expired = a.expiresAt !== null && a.expiresAt < today
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 hover:bg-paper-shade/60"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/announcements/${a.id}`}
                      className="text-[13.5px] font-medium leading-snug text-ink-900 hover:underline"
                    >
                      {a.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-600">
                      {a.body}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px]">
                      {a.journal ? (
                        <span
                          className="rounded-sm px-1.5 py-0.5 font-medium text-white"
                          style={{ backgroundColor: a.journal.primaryColor }}
                        >
                          {a.journal.name}
                        </span>
                      ) : (
                        <span className="rounded-sm bg-ink-100 px-1.5 py-0.5 font-medium text-ink-700">
                          From the publisher
                        </span>
                      )}
                      {a.isPublished ? (
                        <span className="rounded-sm bg-green-50 px-2 py-0.5 font-medium text-green-800">
                          Live
                        </span>
                      ) : (
                        <span className="rounded-sm bg-paper-shade px-2 py-0.5 font-medium text-ink-600">
                          Not shown
                        </span>
                      )}
                      <span className="text-ink-500">{formatDate(a.publishedAt)}</span>
                      {expired && (
                        <span className="text-amber-700">
                          past its date of {formatDate(a.expiresAt)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/admin/announcements/${a.id}`}
                      className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                    >
                      Edit
                    </Link>
                    {a.isPublished && (
                      <a
                        href="/announcements"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                      >
                        View
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
