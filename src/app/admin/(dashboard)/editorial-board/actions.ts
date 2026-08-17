'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser, canEditJournal } from '@/auth'

export type MemberFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  memberId?: string
  /** What was typed, handed back so a rejected form is not wiped clean. */
  values?: Record<string, string>
}

function typedValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

const DESIGNATIONS = [
  'EDITOR_IN_CHIEF',
  'ASSOCIATE_EDITOR',
  'SECTION_EDITOR',
  'BOARD_MEMBER',
  'MANAGING_EDITOR',
  'COPY_EDITOR',
  'PRODUCTION_EDITOR',
  'LANGUAGE_EDITOR',
  'TECHNICAL_EDITOR',
  'ADVISORY_BOARD',
] as const

const memberSchema = z.object({
  id: z.string().optional(),
  /** Empty string means the person serves the publisher as a whole, not one journal. */
  journalId: z.string(),
  fullName: z.string().min(2, 'Please give the person’s full name.'),
  designation: z.enum(DESIGNATIONS, {
    errorMap: () => ({ message: 'Choose the role this person holds.' }),
  }),
  affiliation: z.string(),
  country: z.string(),
  email: z.string(),
  orcid: z.string(),
  profileUrl: z.string(),
  bio: z.string(),
  photoUrl: z.string(),
  sortOrder: z.string(),
  isActive: z.string().optional(),
})

/** ORCID identifiers are always 16 digits in four groups; the last one may be an X. */
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/
const URL_PATTERN = /^https?:\/\/\S+$/i

function toInt(v: string): number | null {
  if (!v.trim()) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/**
 * Returns a plain-language reason the signed-in person may not touch this board,
 * or null when they may. `null` journalId means the publisher-wide board.
 */
async function boardAccessError(journalId: string | null): Promise<string | null> {
  const user = await requireUser()
  if (journalId === null) {
    return user.role === 'SUPER_ADMIN'
      ? null
      : 'Only an administrator can change the publisher-wide list. Ask them to make this change.'
  }
  return (await canEditJournal(journalId))
    ? null
    : 'You do not have permission to change the editorial board of that journal.'
}

async function assertBoardAccess(journalId: string | null) {
  const reason = await boardAccessError(journalId)
  if (reason) throw new Error(reason)
}

export async function saveEditorialMember(
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireUser()

  const values = typedValues(formData)

  const parsed = memberSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors,
      values,
    }
  }

  const d = parsed.data
  const journalId = d.journalId.trim() ? d.journalId.trim() : null

  const accessError = await boardAccessError(journalId)
  if (accessError) return { status: 'error', message: accessError, values }

  if (journalId) {
    const journal = await db.journal.findUnique({ where: { id: journalId }, select: { id: true } })
    if (!journal) {
      return {
        status: 'error',
        message: 'That journal no longer exists. Choose another one.',
        fieldErrors: { journalId: 'Pick a journal from the list.' },
        values,
      }
    }
  }

  // Editing: the person must also be allowed to touch where the member is today,
  // otherwise a journal board could be emptied by moving people out of it.
  let existing: { journalId: string | null; designation: string; sortOrder: number } | null = null
  if (d.id) {
    existing = await db.editorialMember.findUnique({
      where: { id: d.id },
      select: { journalId: true, designation: true, sortOrder: true },
    })
    if (!existing) return { status: 'error', message: 'That board member no longer exists.' }
    if (existing.journalId !== journalId) {
      const fromError = await boardAccessError(existing.journalId)
      if (fromError) return { status: 'error', message: fromError, values }
    }
  }

  if (d.email && !z.string().email().safeParse(d.email).success) {
    return {
      status: 'error',
      message: 'Please check the email address.',
      fieldErrors: { email: 'That does not look like an email address.' },
      values,
    }
  }

  if (d.orcid && !ORCID_PATTERN.test(d.orcid.trim())) {
    return {
      status: 'error',
      message: 'Please check the ORCID.',
      fieldErrors: { orcid: 'An ORCID looks like 0000-0002-1825-0097 — sixteen digits in four groups.' },
      values,
    }
  }

  for (const [key, label] of [
    ['profileUrl', 'personal or university page'],
    ['photoUrl', 'photograph'],
  ] as const) {
    const value = d[key].trim()
    if (value && !URL_PATTERN.test(value)) {
      return {
        status: 'error',
        message: `Please check the link to the ${label}.`,
        fieldErrors: { [key]: 'Paste the whole web address, starting with https://' },
        values,
      }
    }
  }

  // Blank position = keep where they are, or go to the end of the group they join.
  let sortOrder = toInt(d.sortOrder)
  if (sortOrder === null) {
    if (existing && existing.journalId === journalId && existing.designation === d.designation) {
      sortOrder = existing.sortOrder
    } else {
      const last = await db.editorialMember.findFirst({
        where: { journalId, designation: d.designation },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })
      sortOrder = last ? last.sortOrder + 1 : 0
    }
  }

  const data = {
    journalId,
    fullName: d.fullName.trim(),
    designation: d.designation,
    affiliation: d.affiliation.trim(),
    country: d.country.trim(),
    email: d.email.trim() || null,
    orcid: d.orcid.trim() || null,
    profileUrl: d.profileUrl.trim() || null,
    bio: d.bio.trim(),
    photoUrl: d.photoUrl.trim() || null,
    sortOrder,
    isActive: d.isActive === 'on',
  }

  const member = d.id
    ? await db.editorialMember.update({ where: { id: d.id }, data })
    : await db.editorialMember.create({ data })

  revalidatePath('/admin/editorial-board')
  revalidatePath('/')

  return {
    status: 'success',
    memberId: member.id,
    message: data.isActive
      ? 'Saved. This person now appears on the public editorial board page.'
      : 'Saved, but marked as not currently serving — they are hidden from the public page.',
  }
}

/**
 * Moves a person one place up or down within their own group (same journal, same
 * role), then renumbers the whole group so the public page order matches exactly.
 */
export async function reorderEditorialMember(id: string, direction: 'up' | 'down') {
  await requireUser()

  const member = await db.editorialMember.findUnique({
    where: { id },
    select: { journalId: true, designation: true },
  })
  if (!member) throw new Error('That board member no longer exists.')
  await assertBoardAccess(member.journalId)

  const group = await db.editorialMember.findMany({
    where: { journalId: member.journalId, designation: member.designation },
    orderBy: [{ sortOrder: 'asc' }, { fullName: 'asc' }],
    select: { id: true },
  })

  const from = group.findIndex((g) => g.id === id)
  const to = direction === 'up' ? from - 1 : from + 1
  if (from === -1 || to < 0 || to >= group.length) return

  ;[group[from], group[to]] = [group[to], group[from]]

  await db.$transaction(
    group.map((g, index) =>
      db.editorialMember.update({ where: { id: g.id }, data: { sortOrder: index } }),
    ),
  )

  revalidatePath('/admin/editorial-board')
  revalidatePath('/')
}

export async function setMemberActive(id: string, isActive: boolean) {
  await requireUser()

  const member = await db.editorialMember.findUnique({
    where: { id },
    select: { journalId: true },
  })
  if (!member) throw new Error('That board member no longer exists.')
  await assertBoardAccess(member.journalId)

  await db.editorialMember.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/editorial-board')
  revalidatePath('/')
}

export async function deleteEditorialMember(id: string, confirmName: string) {
  await requireUser()

  const member = await db.editorialMember.findUnique({
    where: { id },
    select: { journalId: true, fullName: true },
  })
  if (!member) throw new Error('That board member no longer exists.')
  await assertBoardAccess(member.journalId)

  // Typing the name is the guard against an accidental irreversible delete
  if (confirmName.trim() !== member.fullName.trim()) {
    throw new Error('The name you typed does not match. Nothing was removed.')
  }

  await db.editorialMember.delete({ where: { id } })
  revalidatePath('/admin/editorial-board')
  revalidatePath('/')
}
