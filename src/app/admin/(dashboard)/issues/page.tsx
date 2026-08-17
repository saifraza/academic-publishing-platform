import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import {
  AddVolumeButton,
  AddIssueButton,
  EditIssueButton,
  PublishIssueButton,
  DeleteIssueButton,
  type JournalChoice,
  type VolumeChoice,
} from '@/components/admin/issue-dialogs'
import { ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/** The <input type="date"> format. */
function toDateInput(date: Date | null): string {
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

export default async function AdminIssuesPage() {
  const [journals, articleTallies] = await Promise.all([
    db.journal.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        shortName: true,
        primaryColor: true,
        volumes: {
          orderBy: { number: 'desc' },
          select: {
            id: true,
            number: true,
            year: true,
            issues: {
              orderBy: { number: 'desc' },
              select: {
                id: true,
                volumeId: true,
                number: true,
                title: true,
                publishedAt: true,
                isPublished: true,
                isSpecialIssue: true,
                specialIssueTitle: true,
              },
            },
          },
        },
      },
    }),
    // One grouped query rather than a count per issue
    db.article.groupBy({
      by: ['issueId', 'isPublished'],
      where: { issueId: { not: null } },
      _count: { _all: true },
    }),
  ])

  const counts = new Map<string, { total: number; drafts: number }>()
  for (const row of articleTallies) {
    if (!row.issueId) continue
    const entry = counts.get(row.issueId) ?? { total: 0, drafts: 0 }
    entry.total += row._count._all
    if (!row.isPublished) entry.drafts += row._count._all
    counts.set(row.issueId, entry)
  }

  const journalChoices: JournalChoice[] = journals.map((j) => ({ id: j.id, name: j.name }))

  const volumeChoices: VolumeChoice[] = journals.flatMap((j) =>
    j.volumes.map((v) => ({
      id: v.id,
      journalName: j.name,
      label: `Volume ${v.number} (${v.year})`,
    })),
  )

  // Sensible suggestions so the publisher rarely has to think about numbering
  const nextVolumeNumber: Record<string, number> = {}
  const nextIssueNumber: Record<string, number> = {}
  for (const j of journals) {
    nextVolumeNumber[j.id] = Math.max(0, ...j.volumes.map((v) => v.number)) + 1
    for (const v of j.volumes) {
      nextIssueNumber[v.id] = Math.max(0, ...v.issues.map((i) => i.number)) + 1
    }
  }

  const totalIssues = journals.reduce(
    (sum, j) => sum + j.volumes.reduce((s, v) => s + v.issues.length, 0),
    0,
  )

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">
            Volumes and issues
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-600">
            Each journal is divided into volumes, each volume holds issues, and each issue holds
            articles.
          </p>
        </div>
        {journals.length > 0 && (
          <AddVolumeButton journals={journalChoices} nextVolumeNumber={nextVolumeNumber} />
        )}
      </header>

      {journals.length > 0 && (
        <div className="mb-5 rounded-sm border border-paper-line bg-white px-4 py-3.5 text-[13px] leading-relaxed text-ink-600">
          <p>
            <strong className="text-ink-800">Two ways to publish.</strong> Use{' '}
            <strong>Publish issue</strong> on a row to put the issue and every article in it on the
            public site in one go. To publish articles one at a time instead, use the{' '}
            <Link href="/admin/articles" className="underline underline-offset-2 hover:text-ink-900">
              Articles
            </Link>{' '}
            screen. Taking an issue offline hides the issue page only — the articles in it stay
            published.
          </p>
        </div>
      )}

      {journals.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <p className="font-serif text-[1.15rem] font-semibold text-ink-900">No journals yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            Volumes and issues belong to a journal, so a journal has to exist first. Once one has
            been set up, come back here to add its first volume.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {journals.map((j) => {
            const journalIssues = j.volumes.reduce((s, v) => s + v.issues.length, 0)

            return (
              <section
                key={j.id}
                className="overflow-hidden rounded-sm border border-paper-line bg-white"
              >
                {/* ------------------------------------------------- Journal */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-line bg-paper-shade px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="shrink-0 rounded-sm px-1.5 py-0.5 text-[11.5px] font-medium text-white"
                      style={{ backgroundColor: j.primaryColor }}
                    >
                      {j.shortName || j.name}
                    </span>
                    <h2 className="truncate font-serif text-[1.05rem] font-semibold text-ink-900">
                      {j.name}
                    </h2>
                  </div>
                  <p className="text-[12px] text-ink-500">
                    {plural(j.volumes.length, 'volume')} · {plural(journalIssues, 'issue')}
                  </p>
                </header>

                {j.volumes.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-[13.5px] text-ink-700">
                      This journal has no volumes yet.
                    </p>
                    <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-500">
                      Start with Volume 1 for the journal&rsquo;s first year, then add issues inside
                      it.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <AddVolumeButton
                        journals={journalChoices}
                        nextVolumeNumber={nextVolumeNumber}
                        defaultJournalId={j.id}
                        label="Add the first volume"
                      />
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-paper-line">
                    {j.volumes.map((v) => (
                      <li key={v.id} className="px-4 py-4">
                        {/* ---------------------------------------- Volume */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-serif text-[1rem] font-semibold text-ink-900">
                            Volume {v.number}
                            <span className="ml-2 font-sans text-[12.5px] font-normal text-ink-500">
                              {v.year} · {plural(v.issues.length, 'issue')}
                            </span>
                          </h3>
                          <AddIssueButton
                            volumes={volumeChoices}
                            nextIssueNumber={nextIssueNumber}
                            defaultVolumeId={v.id}
                          />
                        </div>

                        {v.issues.length === 0 ? (
                          <p className="mt-3 rounded-sm border border-dashed border-paper-line px-3.5 py-5 text-center text-[12.5px] text-ink-500">
                            No issues in this volume yet.
                          </p>
                        ) : (
                          <ul className="mt-3 space-y-2">
                            {v.issues.map((iss) => {
                              const tally = counts.get(iss.id) ?? { total: 0, drafts: 0 }
                              const label = `Volume ${v.number}, Issue ${iss.number}`

                              return (
                                <li
                                  key={iss.id}
                                  className="flex flex-wrap items-start justify-between gap-3 rounded-sm border border-paper-line bg-paper px-3.5 py-3"
                                >
                                  {/* ------------------------------ Issue */}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[13.5px] font-medium leading-snug text-ink-900">
                                      Issue {iss.number}
                                      {iss.title && (
                                        <span className="font-normal text-ink-700">
                                          {' '}
                                          — {iss.title}
                                        </span>
                                      )}
                                    </p>
                                    <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-500">
                                      <span>
                                        {iss.publishedAt
                                          ? formatDate(iss.publishedAt)
                                          : 'No publication date set'}
                                      </span>
                                      <span aria-hidden className="text-ink-300">
                                        ·
                                      </span>
                                      <span>
                                        {tally.total === 0
                                          ? 'No articles yet'
                                          : plural(tally.total, 'article')}
                                        {tally.drafts > 0 && (
                                          <span className="text-amber-700">
                                            {' '}
                                            ({tally.drafts} still{' '}
                                            {tally.drafts === 1 ? 'a draft' : 'drafts'})
                                          </span>
                                        )}
                                      </span>
                                    </p>
                                    {iss.isSpecialIssue && iss.specialIssueTitle && (
                                      <p className="mt-1.5 inline-block rounded-sm bg-ink-100 px-1.5 py-0.5 text-[11.5px] font-medium text-ink-700">
                                        Special issue: {iss.specialIssueTitle}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {iss.isPublished ? (
                                      <span className="rounded-sm bg-green-50 px-2 py-0.5 text-[11.5px] font-medium text-green-800">
                                        On the site
                                      </span>
                                    ) : (
                                      <span className="rounded-sm bg-paper-shade px-2 py-0.5 text-[11.5px] font-medium text-ink-600">
                                        Draft
                                      </span>
                                    )}

                                    <EditIssueButton
                                      volumes={volumeChoices}
                                      nextIssueNumber={nextIssueNumber}
                                      issue={{
                                        id: iss.id,
                                        volumeId: iss.volumeId,
                                        number: iss.number,
                                        title: iss.title,
                                        publishedAt: toDateInput(iss.publishedAt),
                                        isSpecialIssue: iss.isSpecialIssue,
                                        specialIssueTitle: iss.specialIssueTitle ?? '',
                                        isPublished: iss.isPublished,
                                      }}
                                    />

                                    <PublishIssueButton
                                      id={iss.id}
                                      label={label}
                                      isPublished={iss.isPublished}
                                      articleCount={tally.total}
                                      draftArticleCount={tally.drafts}
                                    />

                                    {iss.isPublished && (
                                      <a
                                        href={`/journals/${j.slug}/archives/${v.number}/${iss.number}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                                      >
                                        View
                                        <ExternalLink className="h-3 w-3" aria-hidden />
                                      </a>
                                    )}

                                    <DeleteIssueButton
                                      id={iss.id}
                                      label={label}
                                      articleCount={tally.total}
                                    />
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
