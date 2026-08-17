import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/auth'
import { db } from '@/lib/db'
import { DESIGNATION_LABELS } from '@/lib/labels'
import { EditorialMemberForm } from '@/components/admin/editorial-member-form'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditEditorialMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const isAdmin = user.role === 'SUPER_ADMIN'

  const member = await db.editorialMember.findUnique({
    where: { id },
    include: { journal: { select: { id: true, name: true, slug: true } } },
  })
  if (!member) notFound()

  const journals = await db.journal.findMany({
    where: isAdmin ? {} : { id: { in: user.journalIds ?? [] } },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  // Keep the journal this person is already on in the list, even for an editor
  // who cannot normally see it — otherwise the form would silently move them.
  if (member.journal && !journals.some((j) => j.id === member.journal!.id)) {
    journals.unshift(member.journal)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/editorial-board"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-600 hover:text-ink-900"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        Editorial board
      </Link>

      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">{member.fullName}</h1>
        <p className="mt-1.5 text-[14px] text-ink-600">
          {DESIGNATION_LABELS[member.designation] ?? 'Board member'} &middot;{' '}
          {member.journal ? member.journal.name : 'Across all journals'}
        </p>
      </header>

      <EditorialMemberForm
        initial={{
          id: member.id,
          journalId: member.journalId,
          fullName: member.fullName,
          designation: member.designation,
          affiliation: member.affiliation,
          country: member.country,
          email: member.email,
          orcid: member.orcid,
          profileUrl: member.profileUrl,
          bio: member.bio,
          photoUrl: member.photoUrl,
          sortOrder: member.sortOrder,
          isActive: member.isActive,
        }}
        journals={journals}
        canManagePublisherLevel={isAdmin || member.journalId === null}
      />
    </div>
  )
}
