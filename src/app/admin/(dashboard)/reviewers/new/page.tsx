import Link from 'next/link'
import { requireUser } from '@/auth'
import { ReviewerForm } from '@/components/admin/reviewer-form'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewReviewerPage() {
  await requireUser()

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
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Add a reviewer</h1>
        <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-600">
          A name and an email address are all you need to start. Adding the subjects they cover
          makes it far quicker to find them when a matching manuscript arrives.
        </p>
      </header>

      <ReviewerForm initial={{ isActive: true }} />
    </div>
  )
}
