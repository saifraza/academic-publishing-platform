import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { canEditJournal } from '@/auth'
import { JournalForm } from '@/components/admin/journal-form'
import { ExternalLink, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditJournalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const journal = await db.journal.findUnique({
    where: { id },
    include: { _count: { select: { articles: true } } },
  })

  if (!journal) notFound()

  if (!(await canEditJournal(journal.id))) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-sm border border-paper-line bg-white px-6 py-12 text-center">
          <ShieldAlert className="mx-auto mb-3 h-6 w-6 text-ink-300" aria-hidden />
          <h1 className="font-serif text-[1.3rem] font-semibold text-ink-900">
            This journal is not one of yours
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            You can only change the journals you have been assigned to. Ask an administrator if
            you think this is wrong.
          </p>
          <Link
            href="/admin/journals"
            className="mt-5 inline-block rounded-sm border border-ink-300 px-4 py-2 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade"
          >
            Back to all journals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.6rem] font-semibold leading-snug text-ink-900">
              Edit journal
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-ink-600">
              <span
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 rounded-sm border border-paper-line"
                style={{ backgroundColor: journal.primaryColor }}
              />
              {journal.name}
            </p>
          </div>
          {journal.isPublished && (
            <a
              href={`/journals/${journal.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-paper-line bg-white px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-paper-shade"
            >
              Preview live page
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
        <p className="mt-3 rounded-sm bg-paper-shade px-3.5 py-2 text-[12.5px] leading-relaxed text-ink-600">
          {journal.isPublished
            ? `This journal is on the public site. Changes appear as soon as you save. It holds ${journal._count.articles.toLocaleString()} article(s).`
            : `This journal is hidden from the public site, along with everything in it. It holds ${journal._count.articles.toLocaleString()} article(s).`}
        </p>
      </header>

      <JournalForm
        initial={{
          id: journal.id,
          name: journal.name,
          shortName: journal.shortName,
          abbreviation: journal.abbreviation,
          slug: journal.slug,
          issnOnline: journal.issnOnline,
          issnPrint: journal.issnPrint,
          description: journal.description,
          aimsAndScope: journal.aimsAndScope,
          subjectAreas: journal.subjectAreas,
          frequency: journal.frequency,
          peerReviewType: journal.peerReviewType,
          apcAmount: journal.apcAmount,
          apcCurrency: journal.apcCurrency,
          licenseType: journal.licenseType,
          doiPrefix: journal.doiPrefix,
          email: journal.email,
          copyrightFormUrl: journal.copyrightFormUrl,
          foundedYear: journal.foundedYear,
          primaryColor: journal.primaryColor,
          sortOrder: journal.sortOrder,
          isPublished: journal.isPublished,
        }}
      />

      <p className="mt-8 text-center text-[12.5px] text-ink-500">
        <Link href="/admin/journals" className="underline underline-offset-2">
          Back to all journals
        </Link>
      </p>
    </div>
  )
}
