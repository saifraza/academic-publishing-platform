import Link from 'next/link'
import { db } from '@/lib/db'
import { DESIGNATION_LABELS, DESIGNATION_ORDER } from '@/lib/labels'
import { Plus, ExternalLink, Users } from 'lucide-react'
import { MoveButtons, ActiveToggle, DeleteMember } from './member-row-actions'

export const dynamic = 'force-dynamic'

/** The value used in the filter box for people who serve the publisher as a whole. */
const PUBLISHER_WIDE = 'publisher-wide'

export default async function AdminEditorialBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ journal?: string }>
}) {
  const sp = await searchParams

  const journals = await db.journal.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, name: true, shortName: true, primaryColor: true },
  })

  const members = await db.editorialMember.findMany({
    where: {
      ...(sp.journal === PUBLISHER_WIDE ? { journalId: null } : {}),
      ...(sp.journal && sp.journal !== PUBLISHER_WIDE
        ? { journal: { slug: sp.journal } }
        : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { fullName: 'asc' }],
  })

  // One block per journal, plus one for the publisher-wide people, in the same
  // order the public site uses.
  const blocks = [
    {
      key: PUBLISHER_WIDE,
      name: 'Across all journals',
      hint: 'People who serve the publishing house rather than a single journal.',
      publicUrl: null as string | null,
      color: null as string | null,
      members: members.filter((m) => m.journalId === null),
    },
    ...journals.map((j) => ({
      key: j.id,
      name: j.name,
      hint: null as string | null,
      publicUrl: `/journals/${j.slug}/editorial-board`,
      color: j.primaryColor,
      members: members.filter((m) => m.journalId === j.id),
    })),
  ].filter((b) => b.members.length > 0)

  const hidden = members.filter((m) => !m.isActive).length

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Editorial board</h1>
          <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-600">
            Everyone listed on the board pages of your journals. They appear publicly in the order
            shown here, most senior role first — use the arrows to change who comes first within a
            role.
          </p>
        </div>
        <Link
          href="/admin/editorial-board/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add a board member
        </Link>
      </header>

      {/* Filter */}
      <form className="mb-5 flex flex-wrap items-center gap-2.5 rounded-sm border border-paper-line bg-white p-4">
        <label className="text-[13px] font-medium text-ink-800" htmlFor="journal-filter">
          Show
        </label>
        <select
          id="journal-filter"
          name="journal"
          defaultValue={sp.journal ?? ''}
          className="rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
        >
          <option value="">Every journal</option>
          <option value={PUBLISHER_WIDE}>Across all journals (publisher-wide)</option>
          {journals.map((j) => (
            <option key={j.id} value={j.slug}>
              {j.shortName || j.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-ink-300 px-4 py-2 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade"
        >
          Filter
        </button>
        {hidden > 0 && (
          <p className="ml-auto text-[12.5px] text-ink-500">
            {hidden} {hidden === 1 ? 'person is' : 'people are'} hidden from the public pages.
          </p>
        )}
      </form>

      {blocks.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden />
          <p className="font-serif text-[1.15rem] font-semibold text-ink-900">
            {sp.journal ? 'Nobody listed here yet' : 'No board members yet'}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            Add your editors and board members here and they appear on the editorial board page of
            the journal you choose.
          </p>
          <Link
            href="/admin/editorial-board/new"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add the first board member
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {blocks.map((block) => {
            // Within a journal, group by role in the order the public page uses.
            const groups = DESIGNATION_ORDER.map((designation) => ({
              designation,
              label: DESIGNATION_LABELS[designation],
              rows: block.members.filter((m) => m.designation === designation),
            })).filter((g) => g.rows.length > 0)

            return (
              <section
                key={block.key}
                className="overflow-hidden rounded-sm border border-paper-line bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-line bg-paper-shade px-4 py-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-serif text-[1.1rem] font-semibold text-ink-900">
                      {block.color && (
                        <span
                          aria-hidden
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: block.color }}
                        />
                      )}
                      {block.name}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {block.hint ??
                        `${block.members.length} ${
                          block.members.length === 1 ? 'person' : 'people'
                        } on this board`}
                    </p>
                  </div>
                  {block.publicUrl && (
                    <a
                      href={block.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-sm border border-paper-line bg-white px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                    >
                      View the public page
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                </div>

                {groups.map((group) => (
                  <div key={group.designation}>
                    <h3 className="border-b border-paper-line px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                      {group.label}
                      {group.rows.length > 1 ? 's' : ''} ({group.rows.length})
                    </h3>
                    <ul className="divide-y divide-paper-line">
                      {group.rows.map((m, i) => (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-start gap-3 px-4 py-3 hover:bg-paper-shade/60"
                        >
                          <MoveButtons
                            id={m.id}
                            fullName={m.fullName}
                            canMoveUp={i > 0}
                            canMoveDown={i < group.rows.length - 1}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/admin/editorial-board/${m.id}`}
                                className="text-[13.5px] font-medium leading-snug text-ink-900 hover:underline"
                              >
                                {m.fullName}
                              </Link>
                              {m.isActive ? (
                                <span className="rounded-sm bg-green-50 px-2 py-0.5 text-[11.5px] font-medium text-green-800">
                                  On the public page
                                </span>
                              ) : (
                                <span className="rounded-sm bg-paper-shade px-2 py-0.5 text-[11.5px] font-medium text-ink-600">
                                  Hidden
                                </span>
                              )}
                            </p>
                            {m.affiliation && (
                              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-600">
                                {m.affiliation}
                              </p>
                            )}
                            <p className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-ink-500">
                              {m.country && <span>{m.country}</span>}
                              {m.email && <span>{m.email}</span>}
                              {m.orcid && <span>ORCID {m.orcid}</span>}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/editorial-board/${m.id}`}
                              className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                            >
                              Edit
                            </Link>
                            <ActiveToggle
                              id={m.id}
                              fullName={m.fullName}
                              isActive={m.isActive}
                            />
                          </div>

                          <DeleteMember id={m.id} fullName={m.fullName} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
