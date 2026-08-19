'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { uploadFile } from '@/lib/storage'
import { sendMail, submissionReceivedEmail, editorNotificationEmail } from '@/lib/mail'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const coAuthorSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().or(z.literal('')),
  affiliation: z.string(),
  orcid: z.string(),
})

const submissionSchema = z.object({
  journalId: z.string().min(1),
  manuscriptTitle: z.string().min(10, 'Please give the full title of your manuscript.'),
  abstract: z.string().min(100, 'The abstract should be at least 100 characters.'),
  keywords: z
    .string()
    .min(1, 'Please give at least three keywords, separated by commas.')
    .transform((s) => s.split(',').map((k) => k.trim()).filter(Boolean)),
  articleType: z.enum([
    'RESEARCH',
    'REVIEW',
    'CASE_REPORT',
    'EDITORIAL',
    'LETTER',
    'SHORT_COMMUNICATION',
    'COMMENTARY',
    'SYSTEMATIC_REVIEW',
  ]),
  correspondingAuthorName: z.string().min(2, 'Please give the corresponding author’s full name.'),
  correspondingAuthorEmail: z.string().email('Please give a valid email address.'),
  correspondingAuthorPhone: z.string(),
  correspondingAffiliation: z.string().min(2, 'Please give an institutional affiliation.'),
  correspondingOrcid: z.string(),
  coAuthors: z.string().transform((s) => {
    try {
      const parsed = JSON.parse(s || '[]')
      return z.array(coAuthorSchema).parse(parsed)
    } catch {
      return []
    }
  }),
  declarationOriginal: z.literal('on', {
    errorMap: () => ({ message: 'All declarations must be accepted.' }),
  }),
  declarationNotElsewhere: z.literal('on', {
    errorMap: () => ({ message: 'All declarations must be accepted.' }),
  }),
  declarationEthics: z.literal('on', {
    errorMap: () => ({ message: 'All declarations must be accepted.' }),
  }),
  declarationConflict: z.literal('on', {
    errorMap: () => ({ message: 'All declarations must be accepted.' }),
  }),
})

export type SubmitState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  trackingId?: string
}

/** JCDR-2026-0042 — readable, sortable, and safe to quote over email. */
async function nextTrackingId(journalAbbrev: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `${journalAbbrev}-${year}-`
  const last = await db.submission.findFirst({
    where: { trackingId: { startsWith: prefix } },
    orderBy: { trackingId: 'desc' },
    select: { trackingId: true },
  })
  const n = last ? Number(last.trackingId.slice(prefix.length)) + 1 : 1
  return `${prefix}${String(n).padStart(4, '0')}`
}

function abbreviate(name: string): string {
  return (
    name
      .replace(/\b(of|and|the|for|in|on|a|an)\b/gi, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .join('')
      .slice(0, 5) || 'SUB'
  )
}

export async function submitManuscript(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = submissionSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return {
      status: 'error',
      message: 'Please correct the highlighted fields and submit again.',
      fieldErrors,
    }
  }

  const data = parsed.data

  const journal = await db.journal.findUnique({ where: { id: data.journalId } })
  if (!journal || !journal.isPublished) {
    return { status: 'error', message: 'That journal is not accepting submissions.' }
  }

  // ------------------------------------------------------------- Files
  const manuscript = formData.get('manuscriptFile')
  if (!(manuscript instanceof File) || manuscript.size === 0) {
    return {
      status: 'error',
      message: 'Please attach your manuscript file.',
      fieldErrors: { manuscriptFile: 'A manuscript file is required.' },
    }
  }

  const manuscriptUpload = await uploadFile(manuscript, {
    prefix: 'manuscripts',
    maxBytes: 25 * 1024 * 1024,
    allow: ['pdf', 'doc', 'docx'],
  })
  if (!manuscriptUpload.ok) {
    return {
      status: 'error',
      message: manuscriptUpload.error,
      fieldErrors: { manuscriptFile: manuscriptUpload.error },
    }
  }

  // Cover letter — required
  const coverLetter = formData.get('coverLetterFile')
  if (!(coverLetter instanceof File) || coverLetter.size === 0) {
    return {
      status: 'error',
      message: 'Please attach your cover letter.',
      fieldErrors: { coverLetterFile: 'A cover letter is required.' },
    }
  }
  const coverLetterUpload = await uploadFile(coverLetter, {
    prefix: 'cover-letters',
    maxBytes: 10 * 1024 * 1024,
    allow: ['pdf', 'doc', 'docx'],
  })
  if (!coverLetterUpload.ok) {
    return {
      status: 'error',
      message: `Cover letter: ${coverLetterUpload.error}`,
      fieldErrors: { coverLetterFile: coverLetterUpload.error },
    }
  }

  // Signed copyright form — required
  const copyrightForm = formData.get('copyrightFormFile')
  if (!(copyrightForm instanceof File) || copyrightForm.size === 0) {
    return {
      status: 'error',
      message: 'Please attach the completed copyright form.',
      fieldErrors: {
        copyrightFormFile:
          'The signed copyright form is required. Download the template from this page, sign it, and attach it here.',
      },
    }
  }
  const copyrightUpload = await uploadFile(copyrightForm, {
    prefix: 'copyright-forms',
    maxBytes: 10 * 1024 * 1024,
    allow: ['pdf', 'doc', 'docx'],
  })
  if (!copyrightUpload.ok) {
    return {
      status: 'error',
      message: `Copyright form: ${copyrightUpload.error}`,
      fieldErrors: { copyrightFormFile: copyrightUpload.error },
    }
  }

  // ---------------------------------------------------------- Persist
  const trackingId = await nextTrackingId(
    journal.abbreviation ? abbreviate(journal.abbreviation) : abbreviate(journal.name),
  )

  await db.submission.create({
    data: {
      trackingId,
      journalId: journal.id,
      manuscriptTitle: data.manuscriptTitle,
      abstract: data.abstract,
      keywords: data.keywords,
      articleType: data.articleType,
      correspondingAuthorName: data.correspondingAuthorName,
      correspondingAuthorEmail: data.correspondingAuthorEmail,
      correspondingAuthorPhone: data.correspondingAuthorPhone,
      correspondingAffiliation: data.correspondingAffiliation,
      correspondingOrcid: data.correspondingOrcid || null,
      coAuthors: data.coAuthors,
      manuscriptFileUrl: manuscriptUpload.url,
      coverLetterFileUrl: coverLetterUpload.url,
      copyrightFormFileUrl: copyrightUpload.url,
      declarationAccepted: true,
      status: 'SUBMITTED',
    },
  })

  // ------------------------------------------------------------ Email
  await sendMail({
    to: data.correspondingAuthorEmail,
    subject: `Submission received — ${trackingId}`,
    html: submissionReceivedEmail({
      authorName: data.correspondingAuthorName,
      trackingId,
      title: data.manuscriptTitle,
      journalName: journal.name,
      siteUrl: SITE,
    }),
  })

  const editorEmail = process.env.EDITOR_NOTIFICATION_EMAIL
  if (editorEmail) {
    await sendMail({
      to: editorEmail,
      subject: `New submission: ${trackingId} — ${journal.name}`,
      html: editorNotificationEmail({
        trackingId,
        title: data.manuscriptTitle,
        journalName: journal.name,
        authorName: data.correspondingAuthorName,
        authorEmail: data.correspondingAuthorEmail,
        siteUrl: SITE,
      }),
    })
  }

  return { status: 'success', trackingId }
}
