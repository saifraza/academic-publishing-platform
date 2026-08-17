import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { FREQUENCY_LABELS, PEER_REVIEW_LABELS, LICENSE_LABELS } from '@/lib/labels'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Journals',
  description: 'Peer-reviewed open-access journals published by Meridian Academic Press.',
}

export default async function JournalsPage() {
  const journals = await db.journal.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { articles: true, editorialBoard: true } },
      volumes: {
        orderBy: { number: 'desc' },
        take: 1,
        include: { issues: { orderBy: { number: 'desc' }, take: 1 } },
      },
    },
  })

  return (
    <div className="shell py-10">
      <header className="mb-12 max-w-prose">
        <h1 className="font-serif text-[2.25rem] font-semibold leading-tight text-ink-900">
          Journals
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-700">
          Every journal below is fully open access and operates its own editorial board and
          review process. Article processing charges, where they apply, are stated on each
          journal&rsquo;s charges page before you submit.
        </p>
      </header>

      <div className="space-y-8">
        {journals.map((j) => {
          const latestIssue = j.volumes[0]?.issues[0]
          return (
            <article
              key={j.id}
              className="overflow-hidden rounded-sm border border-paper-line bg-white"
            >
              <div className="h-1.5" style={{ backgroundColor: j.primaryColor }} aria-hidden />
              <div className="grid gap-8 p-8 md:grid-cols-3 md:gap-10">
                <div className="md:col-span-2">
                  <h2 className="font-serif text-[1.6rem] font-semibold leading-snug text-ink-900">
                    <Link href={`/journals/${j.slug}`} className="hover:underline hover:underline-offset-4">
                      {j.name}
                    </Link>
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{j.description}</p>

                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {j.subjectAreas.map((s) => (
                      <span
                        key={s}
                        className="rounded-sm bg-paper-shade px-2 py-1 text-[11.5px] text-ink-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={`/journals/${j.slug}`}
                      className="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: j.primaryColor }}
                    >
                      Visit journal <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/journals/${j.slug}/submit`}
                      className="inline-flex items-center rounded-sm border border-ink-300 px-4 py-2.5 text-[13.5px] font-medium text-ink-800 hover:border-ink-900 hover:bg-paper-shade"
                    >
                      Submit a manuscript
                    </Link>
                    {latestIssue && (
                      <Link
                        href={`/journals/${j.slug}/current-issue`}
                        className="inline-flex items-center rounded-sm border border-ink-300 px-4 py-2.5 text-[13.5px] font-medium text-ink-800 hover:border-ink-900 hover:bg-paper-shade"
                      >
                        Current issue
                      </Link>
                    )}
                  </div>
                </div>

                <dl className="space-y-3.5 border-t border-paper-line pt-6 text-[13px] md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  {[
                    ['ISSN (online)', j.issnOnline ?? 'Application in progress'],
                    ['Frequency', FREQUENCY_LABELS[j.frequency]],
                    ['Review', PEER_REVIEW_LABELS[j.peerReviewType]],
                    ['Licence', LICENSE_LABELS[j.licenseType]?.short],
                    [
                      'Article charges',
                      j.apcAmount === 0
                        ? 'None'
                        : `${j.apcCurrency} ${j.apcAmount.toLocaleString()}`,
                    ],
                    ['Articles published', String(j._count.articles)],
                    ['Editorial board', `${j._count.editorialBoard} members`],
                    j.foundedYear ? ['Founded', String(j.foundedYear)] : null,
                  ]
                    .filter((row): row is [string, string] => row !== null)
                    .map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="shrink-0 text-ink-500">{label}</dt>
                        <dd className="text-right font-medium text-ink-900">{value}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
