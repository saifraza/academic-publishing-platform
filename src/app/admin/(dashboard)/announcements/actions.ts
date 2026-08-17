'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser, canEditJournal } from '@/auth'

export type AnnouncementFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  announcementId?: string
}

const announcementSchema = z.object({
  id: z.string().optional(),
  // Blank means the notice belongs to the publisher rather than one journal.
  journalId: z.string().optional(),
  title: z.string().min(3, 'Please give the announcement a title.'),
  body: z.string().min(1, 'Please write the announcement.'),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isPublished: z.string().optional(),
})

function toDate(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Publisher-wide notices appear on the home page above every journal, so only
 * an administrator may write them. Journal notices follow the usual rule.
 */
async function mayEditScope(
  journalId: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await requireUser()
  if (journalId) {
    return (await canEditJournal(journalId))
      ? { ok: true }
      : { ok: false, message: 'You do not have permission to post announcements for that journal.' }
  }
  return user.role === 'SUPER_ADMIN'
    ? { ok: true }
    : {
        ok: false,
        message:
          'Only an administrator can post an announcement for the whole publisher. Choose a journal instead.',
      }
}

export async function saveAnnouncement(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await requireUser()

  const parsed = announcementSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors }
  }

  const d = parsed.data
  const journalId = d.journalId?.trim() ? d.journalId.trim() : null

  const permission = await mayEditScope(journalId)
  if (!permission.ok) return { status: 'error', message: permission.message }

  if (d.id) {
    const existing = await db.announcement.findUnique({
      where: { id: d.id },
      select: { journalId: true },
    })
    if (!existing) return { status: 'error', message: 'That announcement no longer exists.' }
    const previous = await mayEditScope(existing.journalId)
    if (!previous.ok) return { status: 'error', message: previous.message }
  }

  const publishedAt = toDate(d.publishedAt) ?? new Date()
  const expiresAt = toDate(d.expiresAt)

  if (expiresAt && expiresAt < publishedAt) {
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors: { expiresAt: 'This date is before the date the announcement goes out.' },
    }
  }

  const data = {
    journalId,
    title: d.title.trim(),
    body: d.body.trim(),
    publishedAt,
    expiresAt,
    isPublished: d.isPublished === 'on',
  }

  const announcement = d.id
    ? await db.announcement.update({ where: { id: d.id }, data })
    : await db.announcement.create({ data })

  revalidatePath('/admin/announcements')
  revalidatePath('/announcements')
  revalidatePath('/')
  if (journalId) {
    const journal = await db.journal.findUnique({
      where: { id: journalId },
      select: { slug: true },
    })
    if (journal) revalidatePath(`/journals/${journal.slug}`)
  }

  return {
    status: 'success',
    announcementId: announcement.id,
    message: data.isPublished
      ? 'Saved. The announcement is on the site.'
      : 'Saved, but not shown on the site. Tick “Show this announcement” when you are ready.',
  }
}

export async function deleteAnnouncement(id: string, confirmTitle: string) {
  await requireUser()

  const announcement = await db.announcement.findUnique({
    where: { id },
    select: { journalId: true, title: true },
  })
  if (!announcement) throw new Error('Announcement not found')

  const permission = await mayEditScope(announcement.journalId)
  if (!permission.ok) throw new Error(permission.message)

  // Typing the title is the guard against an accidental irreversible delete.
  if (confirmTitle.trim() !== announcement.title.trim()) {
    throw new Error('The title you typed does not match. Nothing was deleted.')
  }

  await db.announcement.delete({ where: { id } })

  revalidatePath('/admin/announcements')
  revalidatePath('/announcements')
  revalidatePath('/')
}
