import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/auth'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { ReviewerForm } from '@/components/admin/reviewer-form'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditReviewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireUser()

  const reviewer = await db.reviewer.findUnique({
    where: { id },
    include: { _count: { select: { assignments: true } } },
  })
  if (!reviewer) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/reviewers"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-600 hover:text-ink-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        Reviewers
      </Link>

      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">
          {reviewer.fullName}
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-600">
          {reviewer._count.assignments === 0
            ? 'Has not been sent a manuscript yet.'
            : `Has been sent ${reviewer._count.assignments} ${
                reviewer._count.assignments === 1 ? 'manuscript' : 'manuscripts'
              }.`}{' '}
          On the list since {formatDate(reviewer.createdAt)}.
        </p>
      </header>

      <ReviewerForm
        initial={{
          id: reviewer.id,
          fullName: reviewer.fullName,
          email: reviewer.email,
          affiliation: reviewer.affiliation,
          country: reviewer.country,
          orcid: reviewer.orcid,
          expertise: reviewer.expertise,
          isActive: reviewer.isActive,
        }}
      />
    </div>
  )
}
