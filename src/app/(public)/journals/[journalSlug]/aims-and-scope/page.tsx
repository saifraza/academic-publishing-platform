import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { FREQUENCY_LABELS, PEER_REVIEW_LABELS, LICENSE_LABELS } from '@/lib/labels'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}): Promise<Metadata> {
  const { journalSlug } = await params
  const j = await db.journal.findUnique({ where: { slug: journalSlug } })
  return { title: j ? `Aims and Scope — ${j.name}` : 'Aims and Scope' }
}

export default async function AimsAndScopePage({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}) {
  const { journalSlug } = await params
  const journal = await db.journal.findUnique({ where: { slug: journalSlug } })
  if (!journal) notFound()

  return (
    <div className="shell py-12">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
            Aims and Scope
          </h1>
          <div className="prose-doc mt-6 max-w-prose">
            {journal.aimsAndScope.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <h2 className="mt-10 font-serif text-[1.35rem] font-semibold text-ink-900">
            Subject areas covered
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {journal.subjectAreas.map((s) => (
              <li
                key={s}
                className="border-l-2 accent-border py-1 pl-3 text-[14px] text-ink-800"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
              At a glance
            </h2>
            <dl className="space-y-3 text-[13px]">
              {[
                ['ISSN (online)', journal.issnOnline ?? 'In progress'],
                ['Frequency', FREQUENCY_LABELS[journal.frequency]],
                ['Review model', PEER_REVIEW_LABELS[journal.peerReviewType]],
                ['Licence', LICENSE_LABELS[journal.licenseType]?.short],
                ['Access', 'Fully open access'],
                [
                  'Article charges',
                  journal.apcAmount === 0
                    ? 'None'
                    : `${journal.apcCurrency} ${journal.apcAmount.toLocaleString()}`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b border-paper-line pb-2.5 last:border-0"
                >
                  <dt className="shrink-0 text-ink-500">{label}</dt>
                  <dd className="text-right font-medium text-ink-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
