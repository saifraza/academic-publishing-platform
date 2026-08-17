import Link from 'next/link'
import { db } from '@/lib/db'
import { Plus, UserCog } from 'lucide-react'
import { AvailabilityToggle, DeleteReviewer } from './reviewer-row-actions'

export const dynamic = 'force-dynamic'

export default async function AdminReviewersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; availability?: string }>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''

  const reviewers = await db.reviewer.findMany({
    where: {
      ...(sp.availability === 'available' ? { isActive: true } : {}),
      ...(sp.availability === 'unavailable' ? { isActive: false } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
              { affiliation: { contains: q, mode: 'insensitive' as const } },
              { country: { contains: q, mode: 'insensitive' as const } },
              { expertise: { has: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    include: { _count: { select: { assignments: true } } },
    take: 300,
  })

  const total = await db.reviewer.count()

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Reviewers</h1>
          <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-600">
            Everyone who has agreed to review manuscripts for you. Search by name, institution or
            subject to find the right person for a paper.
          </p>
        </div>
        <Link
          href="/admin/reviewers/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add a reviewer
        </Link>
      </header>

      {/* Search */}
      <form className="mb-5 flex flex-wrap gap-2.5 rounded-sm border border-paper-line bg-white p-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, email, institution, country or subject"
          className="min-w-64 flex-1 rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
        />
        <select
          name="availability"
          defaultValue={sp.availability ?? ''}
          className="rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
        >
          <option value="">Everyone</option>
          <option value="available">Available only</option>
          <option value="unavailable">Unavailable only</option>
        </select>
        <button
          type="submit"
          className="rounded-sm border border-ink-300 px-4 py-2 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade"
        >
          Search
        </button>
      </form>

      {reviewers.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <UserCog className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden />
          <p className="font-serif text-[1.15rem] font-semibold text-ink-900">
            {total > 0 ? 'No reviewer matches that search' : 'No reviewers yet'}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            {total > 0
              ? 'Try a shorter search, or clear it to see the whole list again. Subjects have to be typed in full.'
              : 'Build up your reviewer list here. Add the subjects each person can cover and you can find them again in seconds.'}
          </p>
          <Link
            href={total > 0 ? '/admin/reviewers' : '/admin/reviewers/new'}
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            {total > 0 ? (
              'Show every reviewer'
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden />
                Add your first reviewer
              </>
            )}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-2.5 text-[12.5px] text-ink-500">
            Showing {reviewers.length} of {total} {total === 1 ? 'reviewer' : 'reviewers'}.
          </p>

          <div className="overflow-hidden rounded-sm border border-paper-line bg-white">
            <table className="w-full text-left">
              <thead className="border-b border-paper-line bg-paper-shade">
                <tr className="text-[11px] uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-2.5 font-semibold">Reviewer</th>
                  <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">
                    Subjects they cover
                  </th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Reviews</th>
                  <th className="px-4 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {reviewers.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-paper-shade/60">
                    <td className="px-4 py-3">
                      <p className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/reviewers/${r.id}`}
                          className="text-[13.5px] font-medium leading-snug text-ink-900 hover:underline"
                        >
                          {r.fullName}
                        </Link>
                        {r.isActive ? (
                          <span className="rounded-sm bg-green-50 px-2 py-0.5 text-[11.5px] font-medium text-green-800">
                            Available
                          </span>
                        ) : (
                          <span className="rounded-sm bg-paper-shade px-2 py-0.5 text-[11.5px] font-medium text-ink-600">
                            Not available
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink-600">{r.email}</p>
                      {r.affiliation && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">
                          {r.affiliation}
                        </p>
                      )}
                      {r.country && <p className="mt-0.5 text-[12px] text-ink-500">{r.country}</p>}
                    </td>

                    <td className="hidden px-4 py-3 lg:table-cell">
                      {r.expertise.length === 0 ? (
                        <span className="text-[12.5px] text-ink-400">
                          No subjects added yet
                        </span>
                      ) : (
                        <ul className="flex flex-wrap gap-1.5">
                          {r.expertise.map((tag) => (
                            <li
                              key={tag}
                              className="rounded-sm border border-paper-line bg-paper-shade px-2 py-0.5 text-[11.5px] text-ink-700"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>

                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="text-[13px] font-medium text-ink-800">
                        {r._count.assignments}
                      </span>
                      <span className="block text-[11.5px] text-ink-500">
                        {r._count.assignments === 1 ? 'manuscript' : 'manuscripts'} sent to them
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-start gap-2">
                        <Link
                          href={`/admin/reviewers/${r.id}`}
                          className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                        >
                          Edit
                        </Link>
                        <AvailabilityToggle
                          id={r.id}
                          fullName={r.fullName}
                          isActive={r.isActive}
                        />
                        <DeleteReviewer
                          id={r.id}
                          fullName={r.fullName}
                          assignmentCount={r._count.assignments}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
