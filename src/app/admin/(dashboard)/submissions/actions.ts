'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser, canEditJournal } from '@/auth'
import { sendMail } from '@/lib/mail'
import { SUBMISSION_STATUS_LABELS } from '@/lib/labels'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    'SUBMITTED', 'UNDER_SCREENING', 'UNDER_REVIEW', 'REVISION_REQUESTED',
    'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'PUBLISHED',
  ]),
  notifyAuthor: z.string().optional(),
})

export type StatusState = { status: 'idle' | 'error' | 'success'; message?: string }

export async function updateSubmissionStatus(
  _prev: StatusState,
  formData: FormData,
): Promise<StatusState> {
  await requireUser()

  const parsed = statusSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) return { status: 'error', message: 'That status is not valid.' }

  const submission = await db.submission.findUnique({
    where: { id: parsed.data.id },
    include: { journal: { select: { id: true, name: true } } },
  })
  if (!submission) return { status: 'error', message: 'Submission not found.' }
  if (!(await canEditJournal(submission.journal.id))) {
    return { status: 'error', message: 'You do not have access to this journal.' }
  }

  await db.submission.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  })

  if (parsed.data.notifyAuthor === 'on') {
    await sendMail({
      to: submission.correspondingAuthorEmail,
      subject: `Update on your submission ${submission.trackingId}`,
      html: `<div style="font-family: sans-serif; line-height: 1.6; color: #0a2540;">
        <p>Dear ${submission.correspondingAuthorName},</p>
        <p>The status of your manuscript <strong>${submission.manuscriptTitle}</strong>
        (${submission.trackingId}), submitted to ${submission.journal.name}, has changed to:</p>
        <p style="font-size: 16px;"><strong>${SUBMISSION_STATUS_LABELS[parsed.data.status]}</strong></p>
        <p>You can check progress at any time at <a href="${SITE}/track">${SITE}/track</a>.</p>
        <p>Kind regards,<br>The Editorial Office</p>
      </div>`,
    })
  }

  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${parsed.data.id}`)

  return {
    status: 'success',
    message: `Status updated to “${SUBMISSION_STATUS_LABELS[parsed.data.status]}”.${
      parsed.data.notifyAuthor === 'on' ? ' The author has been emailed.' : ''
    }`,
  }
}

export async function saveInternalNotes(id: string, notes: string) {
  await requireUser()
  const submission = await db.submission.findUnique({
    where: { id },
    select: { journalId: true },
  })
  if (!submission) throw new Error('Submission not found')
  if (!(await canEditJournal(submission.journalId))) throw new Error('Not authorised')

  await db.submission.update({ where: { id }, data: { internalNotes: notes } })
  revalidatePath(`/admin/submissions/${id}`)
}
