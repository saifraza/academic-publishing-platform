import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { DESIGNATION_LABELS, DESIGNATION_ORDER } from '@/lib/labels'
import { ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}): Promise<Metadata> {
  const { journalSlug } = await params
  const j = await db.journal.findUnique({ where: { slug: journalSlug } })
  return { title: j ? `Editorial Board — ${j.name}` : 'Editorial Board' }
}

export default async function EditorialBoardPage({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}) {
  const { journalSlug } = await params
  const journal = await db.journal.findUnique({
    where: { slug: journalSlug },
    include: {
      editorialBoard: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!journal) notFound()

  // Group by designation, ordered by seniority
  const grouped = DESIGNATION_ORDER.map((d) => ({
    designation: d,
    label: DESIGNATION_LABELS[d],
    members: journal.editorialBoard.filter((m) => m.designation === d),
  })).filter((g) => g.members.length > 0)

  return (
    <div className="shell py-12">
      <header className="mb-10 max-w-prose">
        <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
          Editorial Board
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-ink-700">
          Every member listed below has agreed to serve on the board of {journal.name}. Editors
          handle manuscripts within their area of expertise and recuse themselves where a
          conflict of interest exists.
        </p>
      </header>

      <div className="space-y-12">
        {grouped.map((group) => (
          <section key={group.designation}>
            <h2 className="mb-5 border-b-2 border-ink-900 pb-2 font-serif text-[1.3rem] font-semibold text-ink-900">
              {group.label}
              {group.members.length > 1 ? 's' : ''}
            </h2>
            <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.members.map((m) => (
                <li key={m.id} className="border-l-2 accent-border pl-4">
                  <p className="font-serif text-[1.05rem] font-semibold leading-snug text-ink-900">
                    {m.fullName}
                  </p>
                  {m.affiliation && (
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{m.affiliation}</p>
                  )}
                  {m.country && <p className="mt-0.5 text-[12.5px] text-ink-500">{m.country}</p>}
                  {m.bio && (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600">{m.bio}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                    {m.orcid && (
                      <a
                        href={`https://orcid.org/${m.orcid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 accent-text hover:underline"
                      >
                        ORCID <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                    {m.profileUrl && (
                      <a
                        href={m.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 accent-text hover:underline"
                      >
                        Profile <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {journal.editorialBoard.length === 0 && (
        <p className="rounded-sm border border-paper-line bg-paper-shade p-6 text-[14px] text-ink-600">
          The editorial board for this journal has not been published yet.
        </p>
      )}
    </div>
  )
}
