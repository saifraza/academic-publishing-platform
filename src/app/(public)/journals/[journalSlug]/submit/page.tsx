import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { SubmitForm } from './submit-form'
import { PEER_REVIEW_LABELS, LICENSE_LABELS } from '@/lib/labels'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}): Promise<Metadata> {
  const { journalSlug } = await params
  const j = await db.journal.findUnique({ where: { slug: journalSlug } })
  return { title: j ? `Submit a manuscript — ${j.name}` : 'Submit a manuscript' }
}

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ journalSlug: string }>
}) {
  const { journalSlug } = await params
  const journal = await db.journal.findUnique({ where: { slug: journalSlug } })
  if (!journal || !journal.isPublished) notFound()

  const apcText =
    journal.apcAmount === 0
      ? 'This journal does not currently charge an article processing fee. There is no submission fee and no publication fee.'
      : `If your manuscript is accepted, an article processing charge of ${journal.apcCurrency} ${journal.apcAmount.toLocaleString()} applies. Nothing is charged for manuscripts that are not accepted, and waivers are available on request.`

  return (
    <div className="shell py-12">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-8">
          <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
            Submit a manuscript
          </h1>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-700">
            Please read the{' '}
            <Link
              href={`/journals/${journal.slug}/author-guidelines`}
              className="font-medium accent-text underline underline-offset-2"
            >
              instructions for authors
            </Link>{' '}
            before you begin. Manuscripts that do not follow them are returned without review.
          </p>

          <div className="mt-9">
            <SubmitForm
              journalId={journal.id}
              journalSlug={journal.slug}
              journalName={journal.name}
              apcText={apcText}
            />
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-20 space-y-6">
            <div className="rounded-sm border border-paper-line bg-white p-6">
              <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
                Before you submit
              </h2>
              <ul className="space-y-3 text-[13px] leading-relaxed text-ink-700">
                {[
                  'Your manuscript is anonymised — no author names or affiliations in the file itself.',
                  'The abstract is under 300 words and keywords are chosen.',
                  'References follow the journal’s citation style.',
                  'Funding, conflicts of interest, ethics approval and data availability are all stated.',
                  'Every co-author has seen and approved this version.',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full accent-bg" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-sm border border-paper-line bg-paper-shade p-6">
              <h2 className="mb-3 font-serif text-[1.05rem] font-semibold text-ink-900">
                What happens next
              </h2>
              <ol className="space-y-2.5 text-[13px] leading-relaxed text-ink-700">
                {[
                  'You receive a tracking ID immediately.',
                  'Editorial screening, usually within ten working days.',
                  `${PEER_REVIEW_LABELS[journal.peerReviewType]} by at least two reviewers.`,
                  'A first decision, normally within eight weeks.',
                ].map((t, i) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="shrink-0 font-semibold accent-text">{i + 1}.</span>
                    {t}
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-paper-line pt-3 text-[12.5px] text-ink-600">
                Published under {LICENSE_LABELS[journal.licenseType]?.short}. Authors retain
                copyright.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
