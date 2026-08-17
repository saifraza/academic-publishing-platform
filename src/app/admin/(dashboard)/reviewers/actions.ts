'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser } from '@/auth'

export type ReviewerFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  reviewerId?: string
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

const reviewerSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, 'Please give the reviewer’s full name.'),
  email: z.string().min(1, 'An email address is required — it is how reviewers are invited.'),
  affiliation: z.string(),
  country: z.string(),
  orcid: z.string(),
  /** JSON array of subject tags, built by the tag box in the form. */
  expertise: z.string(),
  isActive: z.string().optional(),
})

/** ORCID identifiers are always 16 digits in four groups; the last one may be an X. */
const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/

export async function saveReviewer(
  _prev: ReviewerFormState,
  formData: FormData,
): Promise<ReviewerFormState> {
  await requireUser()

  const values = typedValues(formData)

  const parsed = reviewerSchema.safeParse(Object.fromEntries(formData.entries()))
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
  const email = d.email.trim().toLowerCase()

  if (!z.string().email().safeParse(email).success) {
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
      fieldErrors: {
        orcid: 'An ORCID looks like 0000-0002-1825-0097 — sixteen digits in four groups.',
      },
      values,
    }
  }

  // Every reviewer is identified by their email, so a repeat has to be caught
  // and explained rather than shown as a database error.
  const clash = await db.reviewer.findUnique({
    where: { email },
    select: { id: true, fullName: true },
  })
  if (clash && clash.id !== d.id) {
    return {
      status: 'error',
      message: `${clash.fullName} is already on the reviewer list with that email address. Open their record instead of adding them again.`,
      fieldErrors: { email: 'This email is already used by another reviewer.' },
      values,
    }
  }

  let expertise: string[] = []
  try {
    expertise = z
      .array(z.string())
      .parse(JSON.parse(d.expertise || '[]'))
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 30)
  } catch {
    return {
      status: 'error',
      message: 'The list of subjects could not be read. Please enter it again.',
      values,
    }
  }
  // Drop repeats, ignoring capitalisation, but keep the first spelling entered.
  expertise = expertise.filter(
    (tag, i) => expertise.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === i,
  )

  const data = {
    fullName: d.fullName.trim(),
    email,
    affiliation: d.affiliation.trim(),
    country: d.country.trim(),
    orcid: d.orcid.trim() || null,
    expertise,
    isActive: d.isActive === 'on',
  }

  let reviewer
  try {
    reviewer = d.id
      ? await db.reviewer.update({ where: { id: d.id }, data })
      : await db.reviewer.create({ data })
  } catch (error) {
    // Belt and braces: two editors saving the same email at the same moment.
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2002') {
      return {
        status: 'error',
        message: 'Someone else was just added with that email address. Please check the list.',
        fieldErrors: { email: 'This email is already used by another reviewer.' },
        values,
      }
    }
    throw error
  }

  revalidatePath('/admin/reviewers')

  return {
    status: 'success',
    reviewerId: reviewer.id,
    message: data.isActive
      ? 'Saved. They can now be invited to review manuscripts.'
      : 'Saved, and marked as not available — they will not be suggested for new reviews.',
  }
}

export async function setReviewerActive(id: string, isActive: boolean) {
  await requireUser()

  const reviewer = await db.reviewer.findUnique({ where: { id }, select: { id: true } })
  if (!reviewer) throw new Error('That reviewer no longer exists.')

  await db.reviewer.update({ where: { id }, data: { isActive } })
  revalidatePath('/admin/reviewers')
}

export async function deleteReviewer(id: string, confirmName: string) {
  await requireUser()

  const reviewer = await db.reviewer.findUnique({
    where: { id },
    select: { fullName: true },
  })
  if (!reviewer) throw new Error('That reviewer no longer exists.')

  // Typing the name is the guard against an accidental irreversible delete
  if (confirmName.trim() !== reviewer.fullName.trim()) {
    throw new Error('The name you typed does not match. Nothing was deleted.')
  }

  await db.reviewer.delete({ where: { id } })
  revalidatePath('/admin/reviewers')
}
