'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser, requireAdmin, canEditJournal } from '@/auth'
import { slugify } from '@/lib/utils'

export type JournalFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  journalId?: string
  slug?: string
  /** Whether the journal is on the public site after this save. */
  isPublished?: boolean
}

const FREQUENCIES = [
  'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'TRIANNUAL', 'BIANNUAL', 'ANNUAL', 'CONTINUOUS',
] as const

const PEER_REVIEW_TYPES = ['SINGLE_BLIND', 'DOUBLE_BLIND', 'OPEN'] as const

const LICENSE_TYPES = [
  'CC_BY', 'CC_BY_NC', 'CC_BY_SA', 'CC_BY_NC_ND', 'CC_BY_NC_SA',
] as const

const journalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Please give the journal its full name.'),
  shortName: z.string(),
  abbreviation: z.string(),
  slug: z.string().optional(),
  issnOnline: z.string(),
  issnPrint: z.string(),
  description: z.string(),
  aimsAndScope: z.string(),
  subjectAreas: z.string(),
  frequency: z.enum(FREQUENCIES),
  peerReviewType: z.enum(PEER_REVIEW_TYPES),
  apcAmount: z.string(),
  apcCurrency: z.string(),
  licenseType: z.enum(LICENSE_TYPES),
  doiPrefix: z.string(),
  foundedYear: z.string(),
  primaryColor: z.string(),
  sortOrder: z.string(),
  publish: z.string().optional(),
})

function toInt(v: string): number | null {
  if (!v.trim()) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/** An ISSN is eight characters — 2456-1234 — the last of which is a check digit. */
const ISSN_SHAPE = /^\d{4}-\d{3}[\dXx]$/

function issnCheckDigitOk(issn: string): boolean {
  const digits = issn.replace('-', '').toUpperCase()
  let sum = 0
  for (let i = 0; i < 7; i++) sum += Number(digits[i]) * (8 - i)
  const remainder = sum % 11
  const expected = remainder === 0 ? '0' : remainder === 1 ? 'X' : String(11 - remainder)
  return digits[7] === expected
}

/** A DOI prefix is the part before the slash: 10.12345 */
const DOI_PREFIX_PATTERN = /^10\.\d{4,9}$/

const HEX_COLOUR = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function normaliseColour(v: string): string | null {
  const m = v.trim().match(HEX_COLOUR)
  if (!m) return null
  const body = m[1].toLowerCase()
  const full = body.length === 3 ? body.split('').map((c) => c + c).join('') : body
  return `#${full}`
}

export async function saveJournal(
  _prev: JournalFormState,
  formData: FormData,
): Promise<JournalFormState> {
  await requireUser()

  const parsed = journalSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors }
  }

  const d = parsed.data

  // Only an administrator may add a journal; an editor may edit the ones they run.
  if (d.id) {
    if (!(await canEditJournal(d.id))) {
      return { status: 'error', message: 'You do not have permission to edit this journal.' }
    }
  } else {
    try {
      await requireAdmin()
    } catch {
      return {
        status: 'error',
        message: 'Only an administrator can add a new journal. Ask them to set it up for you.',
      }
    }
  }

  // --------------------------------------------------------- field checks
  const fieldErrors: Record<string, string> = {}

  for (const [key, value] of [
    ['issnOnline', d.issnOnline],
    ['issnPrint', d.issnPrint],
  ] as const) {
    if (!value.trim()) continue
    if (!ISSN_SHAPE.test(value.trim())) {
      fieldErrors[key] = 'An ISSN is eight characters with a dash in the middle, like 2456-1234.'
    } else if (!issnCheckDigitOk(value.trim())) {
      fieldErrors[key] =
        'The last character of this ISSN does not match the rest — that is almost always a typo.'
    }
  }

  if (d.doiPrefix.trim() && !DOI_PREFIX_PATTERN.test(d.doiPrefix.trim())) {
    fieldErrors.doiPrefix =
      'A DOI prefix looks like 10.12345 — just the part before the slash, no article code.'
  }

  const primaryColor = normaliseColour(d.primaryColor)
  if (!primaryColor) {
    fieldErrors.primaryColor = 'Pick a colour, or type one as six characters like #0a2540.'
  }

  const foundedYear = toInt(d.foundedYear)
  const thisYear = new Date().getFullYear()
  if (d.foundedYear.trim() && (foundedYear === null || foundedYear < 1600 || foundedYear > thisYear + 1)) {
    fieldErrors.foundedYear = `Give the year as four digits, between 1600 and ${thisYear + 1}.`
  }

  const apcAmount = toInt(d.apcAmount) ?? 0
  if (apcAmount < 0) {
    fieldErrors.apcAmount = 'The charge cannot be less than zero. Enter 0 if authors pay nothing.'
  }

  const apcCurrency = d.apcCurrency.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(apcCurrency)) {
    fieldErrors.apcCurrency = 'Choose a currency.'
  }

  let subjectAreas: string[] = []
  try {
    subjectAreas = z
      .array(z.string())
      .parse(JSON.parse(d.subjectAreas || '[]'))
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return {
      status: 'error',
      message: 'The list of subject areas could not be read. Please re-enter it.',
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors }
  }

  // ---------------------------------------------------------------- slug
  const baseSlug = d.slug?.trim() ? slugify(d.slug) : slugify(d.name)
  if (!baseSlug) {
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors: { slug: 'The web address cannot be empty — it is built from the name.' },
    }
  }

  // Every journal needs its own web address — add a counter rather than failing
  let slug = baseSlug
  let n = 1
  while (
    await db.journal.findFirst({
      where: { slug, ...(d.id ? { id: { not: d.id } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${++n}`
  }

  const wantsPublish = d.publish === 'on'

  const data = {
    slug,
    name: d.name.trim(),
    shortName: d.shortName.trim(),
    abbreviation: d.abbreviation.trim(),
    issnOnline: d.issnOnline.trim() ? d.issnOnline.trim().toUpperCase() : null,
    issnPrint: d.issnPrint.trim() ? d.issnPrint.trim().toUpperCase() : null,
    description: d.description,
    aimsAndScope: d.aimsAndScope,
    subjectAreas,
    frequency: d.frequency,
    peerReviewType: d.peerReviewType,
    apcAmount,
    apcCurrency,
    licenseType: d.licenseType,
    doiPrefix: d.doiPrefix.trim() || null,
    foundedYear,
    primaryColor: primaryColor as string,
    sortOrder: toInt(d.sortOrder) ?? 0,
    isPublished: wantsPublish,
  }

  const journal = d.id
    ? await db.journal.update({ where: { id: d.id }, data })
    : await db.journal.create({ data })

  revalidatePath('/admin/journals')
  revalidatePath('/journals')
  revalidatePath(`/journals/${journal.slug}`)
  revalidatePath('/')

  return {
    status: 'success',
    journalId: journal.id,
    slug: journal.slug,
    isPublished: journal.isPublished,
    message: wantsPublish
      ? 'Saved. This journal is now on the public website.'
      : 'Saved. This journal is hidden from the public website until you tick the box below.',
  }
}

export async function setJournalPublished(id: string, isPublished: boolean) {
  await requireUser()

  const journal = await db.journal.findUnique({ where: { id }, select: { slug: true } })
  if (!journal) throw new Error('Journal not found')
  if (!(await canEditJournal(id))) throw new Error('Not authorised')

  await db.journal.update({ where: { id }, data: { isPublished } })

  revalidatePath('/admin/journals')
  revalidatePath('/journals')
  revalidatePath(`/journals/${journal.slug}`)
  revalidatePath('/')
}

export async function deleteJournal(id: string, confirmName: string) {
  await requireUser()
  await requireAdmin()

  const journal = await db.journal.findUnique({
    where: { id },
    select: { name: true, slug: true, _count: { select: { articles: true } } },
  })
  if (!journal) throw new Error('Journal not found')

  // Typing the name is the guard against an accidental irreversible delete
  if (confirmName.trim() !== journal.name.trim()) {
    throw new Error('The name you typed does not match. Nothing was deleted.')
  }
  if (journal._count.articles > 0) {
    throw new Error(
      `This journal still has ${journal._count.articles} article(s). Move or remove them first.`,
    )
  }

  await db.journal.delete({ where: { id } })

  revalidatePath('/admin/journals')
  revalidatePath('/journals')
  revalidatePath('/')
}
