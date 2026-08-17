'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser, canEditJournal } from '@/auth'

/** Shared shape for the volume and issue dialog forms. */
export type IssueFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
}

/** Result of the one-click row actions (publish, unpublish, delete). */
export type ActionResult = { ok: boolean; message: string }

// ---------------------------------------------------------------- validation

/**
 * Whole numbers typed by hand. Anything that is not plain digits gets a
 * sentence a publisher can act on, not a parser message.
 */
function wholeNumber(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `Enter the ${label}.`)
    .regex(/^\d+$/, `The ${label} must be a plain whole number, like 12.`)
    .transform(Number)
    .refine((n) => n >= min && n <= max, `The ${label} should be between ${min} and ${max}.`)
}

const volumeSchema = z.object({
  journalId: z.string().min(1, 'Choose which journal this volume belongs to.'),
  number: wholeNumber('volume number', 1, 999),
  year: wholeNumber('year', 1800, 2200),
})

const issueSchema = z.object({
  id: z.string().optional(),
  volumeId: z.string().min(1, 'Choose the volume this issue belongs to.'),
  number: wholeNumber('issue number', 1, 999),
  title: z.string().max(200, 'Please keep the title under 200 characters.').default(''),
  publishedAt: z.string().default(''),
  isSpecialIssue: z.string().optional(),
  specialIssueTitle: z
    .string()
    .max(200, 'Please keep the special issue theme under 200 characters.')
    .default(''),
  isPublished: z.string().optional(),
})

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0])
    if (!out[key]) out[key] = issue.message
  }
  return out
}

function toDate(v: string): Date | null {
  if (!v.trim()) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function issueLabel(volumeNumber: number, issueNumber: number): string {
  return `Volume ${volumeNumber}, Issue ${issueNumber}`
}

/** Every screen that can show a volume, an issue or an article count. */
function refresh() {
  revalidatePath('/admin/issues')
  revalidatePath('/admin/articles')
  revalidatePath('/')
}

// ------------------------------------------------------------------- volumes

export async function createVolume(
  _prev: IssueFormState,
  formData: FormData,
): Promise<IssueFormState> {
  await requireUser()

  const parsed = volumeSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const d = parsed.data

  const journal = await db.journal.findUnique({
    where: { id: d.journalId },
    select: { id: true, name: true },
  })
  if (!journal) {
    return { status: 'error', message: 'That journal no longer exists. Refresh the page and try again.' }
  }
  if (!(await canEditJournal(journal.id))) {
    return { status: 'error', message: `You do not have permission to add volumes to ${journal.name}.` }
  }

  // Checked here so the publisher sees a sentence, never a database error
  const clash = await db.volume.findUnique({
    where: { journalId_number: { journalId: d.journalId, number: d.number } },
    select: { year: true },
  })
  if (clash) {
    return {
      status: 'error',
      message: `${journal.name} already has a Volume ${d.number} (${clash.year}). Give this one a different number, or add your issue to the volume that already exists.`,
      fieldErrors: { number: `Volume ${d.number} is already in use in this journal.` },
    }
  }

  try {
    await db.volume.create({
      data: { journalId: d.journalId, number: d.number, year: d.year },
    })
  } catch {
    return {
      status: 'error',
      message: `Volume ${d.number} could not be saved — someone may have just created it. Refresh the page to see the latest list.`,
    }
  }

  refresh()

  return {
    status: 'success',
    message: `Volume ${d.number} (${d.year}) has been added to ${journal.name}. You can now add issues to it.`,
  }
}

// -------------------------------------------------------------------- issues

export async function createIssue(
  _prev: IssueFormState,
  formData: FormData,
): Promise<IssueFormState> {
  await requireUser()

  const parsed = issueSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const d = parsed.data
  const isSpecial = d.isSpecialIssue === 'on'
  const wantsPublished = d.isPublished === 'on'

  if (isSpecial && !d.specialIssueTitle.trim()) {
    return {
      status: 'error',
      message: 'A special issue needs a theme, so readers know what it is about.',
      fieldErrors: {
        specialIssueTitle:
          'Give the theme, for example “Advances in Regenerative Endodontics”, or untick the special issue box.',
      },
    }
  }

  const volume = await db.volume.findUnique({
    where: { id: d.volumeId },
    select: { id: true, number: true, year: true, journalId: true, journal: { select: { name: true } } },
  })
  if (!volume) {
    return { status: 'error', message: 'That volume no longer exists. Refresh the page and try again.' }
  }
  if (!(await canEditJournal(volume.journalId))) {
    return {
      status: 'error',
      message: `You do not have permission to add issues to ${volume.journal.name}.`,
    }
  }

  const clash = await db.issue.findUnique({
    where: { volumeId_number: { volumeId: d.volumeId, number: d.number } },
    select: { id: true },
  })
  if (clash) {
    return {
      status: 'error',
      message: `Volume ${volume.number} already has an Issue ${d.number}. Give this one a different number, or edit the issue that already exists.`,
      fieldErrors: { number: `Issue ${d.number} is already in use in this volume.` },
    }
  }

  try {
    await db.issue.create({
      data: {
        volumeId: d.volumeId,
        number: d.number,
        title: d.title.trim(),
        publishedAt: toDate(d.publishedAt),
        isSpecialIssue: isSpecial,
        specialIssueTitle: isSpecial ? d.specialIssueTitle.trim() : null,
        isPublished: wantsPublished,
      },
    })
  } catch {
    return {
      status: 'error',
      message: `Issue ${d.number} could not be saved — someone may have just created it. Refresh the page to see the latest list.`,
    }
  }

  refresh()

  return {
    status: 'success',
    message: wantsPublished
      ? `${issueLabel(volume.number, d.number)} has been added and is visible on the public site. It is empty until you put articles in it.`
      : `${issueLabel(volume.number, d.number)} has been added. It is not on the public site yet.`,
  }
}

export async function updateIssue(
  _prev: IssueFormState,
  formData: FormData,
): Promise<IssueFormState> {
  await requireUser()

  const parsed = issueSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const d = parsed.data
  if (!d.id) {
    return { status: 'error', message: 'We lost track of which issue you were editing. Please reopen it.' }
  }

  const isSpecial = d.isSpecialIssue === 'on'
  const wantsPublished = d.isPublished === 'on'

  if (isSpecial && !d.specialIssueTitle.trim()) {
    return {
      status: 'error',
      message: 'A special issue needs a theme, so readers know what it is about.',
      fieldErrors: {
        specialIssueTitle:
          'Give the theme, for example “Advances in Regenerative Endodontics”, or untick the special issue box.',
      },
    }
  }

  const existing = await db.issue.findUnique({
    where: { id: d.id },
    select: {
      id: true,
      volumeId: true,
      volume: { select: { journalId: true, journal: { select: { name: true } } } },
      _count: { select: { articles: true } },
    },
  })
  if (!existing) {
    return { status: 'error', message: 'That issue no longer exists. Refresh the page and try again.' }
  }
  if (!(await canEditJournal(existing.volume.journalId))) {
    return {
      status: 'error',
      message: `You do not have permission to change issues in ${existing.volume.journal.name}.`,
    }
  }

  const target = await db.volume.findUnique({
    where: { id: d.volumeId },
    select: { id: true, number: true, journalId: true, journal: { select: { name: true } } },
  })
  if (!target) {
    return { status: 'error', message: 'That volume no longer exists. Refresh the page and try again.' }
  }
  if (target.id !== existing.volumeId) {
    if (!(await canEditJournal(target.journalId))) {
      return {
        status: 'error',
        message: `You do not have permission to move this issue into ${target.journal.name}.`,
      }
    }
    // An article belongs to a journal as well as an issue — moving a full issue
    // across journals would leave those articles pointing at the wrong journal.
    if (target.journalId !== existing.volume.journalId && existing._count.articles > 0) {
      return {
        status: 'error',
        message: `This issue holds ${plural(existing._count.articles, 'article')}, so it cannot be moved to a different journal. Move the articles first on the Articles screen.`,
        fieldErrors: { volumeId: 'Choose a volume in the same journal.' },
      }
    }
  }

  const clash = await db.issue.findFirst({
    where: { volumeId: d.volumeId, number: d.number, id: { not: d.id } },
    select: { id: true },
  })
  if (clash) {
    return {
      status: 'error',
      message: `Volume ${target.number} already has an Issue ${d.number}. Give this one a different number.`,
      fieldErrors: { number: `Issue ${d.number} is already in use in this volume.` },
    }
  }

  try {
    await db.issue.update({
      where: { id: d.id },
      data: {
        volumeId: d.volumeId,
        number: d.number,
        title: d.title.trim(),
        publishedAt: toDate(d.publishedAt),
        isSpecialIssue: isSpecial,
        specialIssueTitle: isSpecial ? d.specialIssueTitle.trim() : null,
        isPublished: wantsPublished,
      },
    })
  } catch {
    return {
      status: 'error',
      message: `Issue ${d.number} could not be saved — that number may have just been taken. Refresh the page to see the latest list.`,
    }
  }

  refresh()

  return {
    status: 'success',
    message: wantsPublished
      ? `${issueLabel(target.number, d.number)} has been saved and is visible on the public site. The articles inside it keep their own settings.`
      : `${issueLabel(target.number, d.number)} has been saved. It is not on the public site.`,
  }
}

/**
 * Publishing an issue publishes the issue *and* every article in it, in one
 * transaction. Unpublishing hides only the issue page — the articles stay
 * published, on purpose, so live links and citations are never broken.
 */
export async function setIssuePublished(id: string, isPublished: boolean): Promise<ActionResult> {
  await requireUser()

  const issue = await db.issue.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      publishedAt: true,
      volume: { select: { number: true, journalId: true, journal: { select: { name: true } } } },
      _count: { select: { articles: true } },
    },
  })
  if (!issue) {
    return { ok: false, message: 'That issue no longer exists. Refresh the page and try again.' }
  }
  if (!(await canEditJournal(issue.volume.journalId))) {
    return {
      ok: false,
      message: `You do not have permission to publish issues in ${issue.volume.journal.name}.`,
    }
  }

  const label = issueLabel(issue.volume.number, issue.number)
  const count = issue._count.articles
  const now = new Date()

  if (!isPublished) {
    await db.issue.update({ where: { id }, data: { isPublished: false } })
    refresh()
    return {
      ok: true,
      message:
        count === 0
          ? `${label} has been taken off the public site.`
          : `${label} has been taken off the public site. The ${plural(count, 'article')} in it are still published and still reachable at their own web addresses.`,
    }
  }

  await db.$transaction([
    db.issue.update({
      where: { id },
      data: { isPublished: true, publishedAt: issue.publishedAt ?? now },
    }),
    // Give any article that never had one a publication date, then publish all
    db.article.updateMany({
      where: { issueId: id, publishedAt: null },
      data: { publishedAt: issue.publishedAt ?? now },
    }),
    db.article.updateMany({ where: { issueId: id }, data: { isPublished: true } }),
  ])

  refresh()

  return {
    ok: true,
    message:
      count === 0
        ? `${label} is now on the public site. It has no articles in it yet.`
        : `${label} is now on the public site, together with all ${plural(count, 'article')} in it.`,
  }
}

/** Deletion is only allowed once the issue is empty — nothing is cascaded away. */
export async function deleteIssue(id: string): Promise<ActionResult> {
  await requireUser()

  const issue = await db.issue.findUnique({
    where: { id },
    select: {
      id: true,
      number: true,
      volume: { select: { number: true, journalId: true, journal: { select: { name: true } } } },
      _count: { select: { articles: true } },
    },
  })
  if (!issue) {
    return { ok: false, message: 'That issue no longer exists. Refresh the page and try again.' }
  }
  if (!(await canEditJournal(issue.volume.journalId))) {
    return {
      ok: false,
      message: `You do not have permission to delete issues in ${issue.volume.journal.name}.`,
    }
  }

  const label = issueLabel(issue.volume.number, issue.number)

  if (issue._count.articles > 0) {
    return {
      ok: false,
      message: `${label} still holds ${plural(issue._count.articles, 'article')}, so it cannot be deleted. On the Articles screen, move each of those articles to another issue — or set it to “Not in an issue” — and then delete this issue. Nothing has been changed.`,
    }
  }

  await db.issue.delete({ where: { id } })
  refresh()

  return { ok: true, message: `${label} has been deleted. It was empty, so no articles were affected.` }
}
