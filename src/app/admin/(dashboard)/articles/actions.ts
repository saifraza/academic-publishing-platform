'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser, canEditJournal } from '@/auth'
import { uploadFile } from '@/lib/storage'
import { slugify } from '@/lib/utils'

export type ArticleFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  articleId?: string
  /**
   * React resets an uncontrolled form after its action runs, so a rejected save
   * would wipe everything the editor had typed. Handing the submitted values
   * back lets the form restore them.
   */
  values?: Record<string, string>
}

/** Everything except the file inputs, which a browser will not let us refill. */
function submittedValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

const authorSchema = z.object({
  fullName: z.string().min(1),
  email: z.string(),
  affiliation: z.string(),
  country: z.string(),
  orcid: z.string(),
  isCorresponding: z.boolean(),
})

const articleSchema = z.object({
  id: z.string().optional(),
  journalId: z.string().min(1, 'Choose which journal this article belongs to.'),
  issueId: z.string().optional(),
  title: z.string().min(5, 'Please give the article title.'),
  slug: z.string().optional(),
  abstract: z.string().min(1, 'An abstract is required — indexing services rely on it.'),
  keywords: z.string(),
  articleType: z.enum([
    'RESEARCH', 'REVIEW', 'CASE_REPORT', 'EDITORIAL', 'LETTER',
    'SHORT_COMMUNICATION', 'COMMENTARY', 'SYSTEMATIC_REVIEW',
  ]),
  doi: z.string(),
  pageStart: z.string(),
  pageEnd: z.string(),
  articleNumber: z.string(),
  receivedAt: z.string(),
  revisedAt: z.string(),
  acceptedAt: z.string(),
  publishedAt: z.string(),
  fundingStatement: z.string(),
  conflictOfInterest: z.string(),
  dataAvailability: z.string(),
  acknowledgements: z.string(),
  references: z.string(),
  authors: z.string(),
  isFeatured: z.string().optional(),
  publish: z.string().optional(),
})

function toDate(v: string): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function toInt(v: string): number | null {
  if (!v.trim()) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/** DOIs look like 10.<registrant>/<suffix>. Reject anything else early. */
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/

export async function saveArticle(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireUser()

  const values = submittedValues(formData)
  const parsed = articleSchema.safeParse(Object.fromEntries(formData.entries()))
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

  if (!(await canEditJournal(d.journalId))) {
    return {
      status: 'error',
      message: 'You do not have permission to publish in that journal.',
      values,
    }
  }

  if (d.doi && !DOI_PATTERN.test(d.doi)) {
    return {
      status: 'error',
      message: 'That DOI does not look right.',
      fieldErrors: {
        doi: 'A DOI looks like 10.12345/abcd.2026.001 — check the prefix and suffix.',
      },
      values,
    }
  }

  let authors: z.infer<typeof authorSchema>[] = []
  try {
    authors = z.array(authorSchema).parse(JSON.parse(d.authors || '[]'))
  } catch {
    return {
      status: 'error',
      message: 'The author list could not be read. Please re-enter it.',
      values,
    }
  }
  if (authors.length === 0) {
    return {
      status: 'error',
      message: 'Add at least one author.',
      fieldErrors: { authors: 'At least one author is required.' },
      values,
    }
  }

  // ------------------------------------------------------------- PDF
  let pdfUrl: string | undefined
  let pdfSizeBytes: number | undefined
  const pdf = formData.get('pdfFile')
  if (pdf instanceof File && pdf.size > 0) {
    const upload = await uploadFile(pdf, { prefix: 'articles', maxBytes: 40 * 1024 * 1024, allow: ['pdf'] })
    if (!upload.ok) {
      return {
        status: 'error',
        message: upload.error,
        fieldErrors: { pdfFile: upload.error },
        values,
      }
    }
    pdfUrl = upload.url
    pdfSizeBytes = upload.size
  }

  const wantsPublish = d.publish === 'on'
  const baseSlug = d.slug?.trim() ? slugify(d.slug) : slugify(d.title)

  // Slugs must be unique within a journal — append a counter rather than failing
  let slug = baseSlug
  let n = 1
  while (
    await db.article.findFirst({
      where: { journalId: d.journalId, slug, ...(d.id ? { id: { not: d.id } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${++n}`
  }

  const data = {
    journalId: d.journalId,
    issueId: d.issueId || null,
    slug,
    title: d.title,
    abstract: d.abstract,
    keywords: d.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    articleType: d.articleType,
    doi: d.doi || null,
    pageStart: toInt(d.pageStart),
    pageEnd: toInt(d.pageEnd),
    articleNumber: d.articleNumber || null,
    receivedAt: toDate(d.receivedAt),
    revisedAt: toDate(d.revisedAt),
    acceptedAt: toDate(d.acceptedAt),
    publishedAt: toDate(d.publishedAt) ?? (wantsPublish ? new Date() : null),
    fundingStatement: d.fundingStatement,
    conflictOfInterest: d.conflictOfInterest,
    dataAvailability: d.dataAvailability,
    acknowledgements: d.acknowledgements,
    references: d.references,
    isFeatured: d.isFeatured === 'on',
    isPublished: wantsPublish,
    ...(pdfUrl ? { pdfUrl, pdfSizeBytes } : {}),
  }

  const article = d.id
    ? await db.article.update({
        where: { id: d.id },
        data: { ...data, authors: { deleteMany: {}, create: authors.map((a, i) => ({ ...a, order: i })) } },
      })
    : await db.article.create({
        data: { ...data, authors: { create: authors.map((a, i) => ({ ...a, order: i })) } },
      })

  revalidatePath('/admin/articles')
  revalidatePath('/')

  return {
    status: 'success',
    articleId: article.id,
    message: wantsPublish
      ? 'Published. The article is now visible to everyone.'
      : 'Saved as a draft. It is not visible on the site yet.',
  }
}

export async function setArticlePublished(id: string, isPublished: boolean) {
  await requireUser()
  const article = await db.article.findUnique({ where: { id }, select: { journalId: true } })
  if (!article) throw new Error('Article not found')
  if (!(await canEditJournal(article.journalId))) throw new Error('Not authorised')

  await db.article.update({
    where: { id },
    data: { isPublished, ...(isPublished ? { publishedAt: new Date() } : {}) },
  })
  revalidatePath('/admin/articles')
  revalidatePath('/')
}

export async function deleteArticle(id: string, confirmTitle: string) {
  await requireUser()
  const article = await db.article.findUnique({ where: { id }, select: { journalId: true, title: true } })
  if (!article) throw new Error('Article not found')
  if (!(await canEditJournal(article.journalId))) throw new Error('Not authorised')

  // Typing the title is the guard against an accidental irreversible delete
  if (confirmTitle.trim() !== article.title.trim()) {
    throw new Error('The title you typed does not match. Nothing was deleted.')
  }

  await db.article.delete({ where: { id } })
  revalidatePath('/admin/articles')
  revalidatePath('/')
}
