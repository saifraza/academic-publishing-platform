'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireUser, canEditJournal } from '@/auth'
import { slugify } from '@/lib/utils'

export type PageFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  pageId?: string
  publicUrl?: string
}

const pageSchema = z.object({
  id: z.string().optional(),
  // An empty string means "applies to all journals" (Page.journalId is null).
  journalId: z.string().optional(),
  title: z.string().min(2, 'Please give this page a title.'),
  slug: z.string().optional(),
  navGroup: z.string().optional(),
  sortOrder: z.string().optional(),
  showInNav: z.string().optional(),
  isPublished: z.string().optional(),
  body: z.string().optional(),
})

// ---------------------------------------------------------------------------
// HTML sanitising
//
// The page body is written in the admin and rendered on the public site with
// dangerouslySetInnerHTML, so everything that arrives here is scrubbed first.
// Deliberately dependency-free: a handful of regexes over the markup, with a
// tag allow-list as a second line of defence.
// ---------------------------------------------------------------------------

/** Elements removed together with everything inside them. */
const STRIPPED_ELEMENTS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'svg',
  'math',
]

/** Everything a page body is allowed to contain. Other tags are unwrapped. */
const ALLOWED_ELEMENTS = new Set([
  'p', 'br', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u',
  'a', 'blockquote', 'hr', 'sup', 'sub', 'code', 'pre', 'small',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
])

/** Attributes kept, per element. Anything else is dropped. */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  td: new Set(['colspan', 'rowspan']),
  ol: new Set(['start']),
}

/** Attributes that carry a URL and therefore need a scheme check. */
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'xlink:href'])

/**
 * True for javascript:, vbscript: and data: URLs, including the entity-encoded
 * and whitespace-padded spellings browsers still happily execute.
 */
function isUnsafeUrl(value: string): boolean {
  const decoded = value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;|&newline;/gi, '')
    // Control characters and whitespace are ignored by URL parsers, so remove
    // them before testing the scheme.
    .replace(/[\u0000-\u0020]/g, '')
    .toLowerCase()
  return /^(javascript|vbscript|data|file):/.test(decoded)
}

function sanitizeAttributes(tagName: string, rawAttributes: string): string {
  const allowed = ALLOWED_ATTRIBUTES[tagName]
  if (!allowed) return ''

  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g
  const kept: string[] = []

  for (const match of rawAttributes.matchAll(pattern)) {
    const name = match[1].toLowerCase()
    const raw = match[2] ?? ''
    const value = raw.replace(/^["']|["']$/g, '')

    // Event handlers — onclick, onerror, onmouseover and friends.
    if (name.startsWith('on')) continue
    if (name === 'style' || name === 'srcdoc') continue
    if (!allowed.has(name)) continue
    if (URL_ATTRIBUTES.has(name) && isUnsafeUrl(value)) continue

    kept.push(`${name}="${value.replace(/"/g, '&quot;')}"`)
  }

  // Links that leave the site open in a new tab, safely.
  if (tagName === 'a') {
    const href = kept.find((a) => a.startsWith('href='))
    if (href && /^href="https?:\/\//i.test(href) && !kept.some((a) => a.startsWith('rel='))) {
      kept.push('rel="noopener noreferrer"')
    }
  }

  return kept.length ? ' ' + kept.join(' ') : ''
}

/**
 * Remove scripting from a submitted page body. Strips <script>, <style> and
 * <iframe> (with their contents), every on* event-handler attribute, and any
 * javascript: URL. Tags outside the allow-list lose their markup but keep
 * their text, so nothing the publisher typed is ever silently deleted.
 */
function sanitizeHtml(input: string): string {
  let html = input

  // 1. Whole elements, contents included. Repeated until stable so that
  //    smuggled fragments such as <scr<script>ipt> cannot survive.
  for (const tag of STRIPPED_ELEMENTS) {
    const paired = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi')
    let previous: string
    do {
      previous = html
      html = html.replace(paired, '')
    } while (html !== previous)
    // Anything left unclosed.
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>?`, 'gi'), '')
  }

  // 2. Comments and doctype-style declarations.
  html = html.replace(/<!--[\s\S]*?-->/g, '')
  html = html.replace(/<![^>]*>/g, '')

  // 3. Every remaining opening tag: drop it if not allowed, otherwise scrub
  //    its attributes down to the allow-list.
  html = html.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*?)?)\s*(\/?)>/g,
    (_match, name: string, attributes: string, selfClosing: string) => {
      const tag = name.toLowerCase()
      if (!ALLOWED_ELEMENTS.has(tag)) return ''
      return `<${tag}${sanitizeAttributes(tag, attributes)}${selfClosing ? ' /' : ''}>`
    },
  )

  // 4. Closing tags for elements we removed.
  html = html.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g, (_match, name: string) => {
    const tag = name.toLowerCase()
    return ALLOWED_ELEMENTS.has(tag) ? `</${tag}>` : ''
  })

  // 5. Every well-formed tag has now been rewritten, so any "<" still here
  //    belonged to markup that did not parse — for instance the leftovers of
  //    <scr<script>ipt>. Show it as text rather than let the browser guess.
  const names = Array.from(ALLOWED_ELEMENTS).join('|')
  html = html.replace(new RegExp(`<(?!\\/?(?:${names})[\\s/>])`, 'gi'), '&lt;')

  return html.trim()
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Publisher-wide pages sit above any single journal, so only an administrator
 * may touch them. Journal pages follow the same rule as everything else.
 */
async function mayEditScope(
  journalId: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await requireUser()
  if (journalId) {
    return (await canEditJournal(journalId))
      ? { ok: true }
      : { ok: false, message: 'You do not have permission to edit pages for that journal.' }
  }
  return user.role === 'SUPER_ADMIN'
    ? { ok: true }
    : {
        ok: false,
        message:
          'Only an administrator can edit pages that apply to all journals. Choose a single journal instead.',
      }
}

export async function savePage(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  await requireUser()

  const parsed = pageSchema.safeParse(Object.fromEntries(formData.entries()))
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

  // When editing, make sure the page has not been moved out from under us.
  if (d.id) {
    const existing = await db.page.findUnique({
      where: { id: d.id },
      select: { journalId: true },
    })
    if (!existing) return { status: 'error', message: 'That page no longer exists.' }
    const previous = await mayEditScope(existing.journalId)
    if (!previous.ok) return { status: 'error', message: previous.message }
  }

  const baseSlug = d.slug?.trim() ? slugify(d.slug) : slugify(d.title)
  if (!baseSlug) {
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors: {
        slug: 'The web address cannot be worked out from this title. Type one yourself, using letters and hyphens.',
      },
    }
  }

  // Web addresses must be unique within their scope — add a counter rather
  // than refusing to save.
  let slug = baseSlug
  let n = 1
  while (
    await db.page.findFirst({
      where: { journalId, slug, ...(d.id ? { id: { not: d.id } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${++n}`
  }

  const sortOrder = Number.parseInt(d.sortOrder ?? '', 10)

  const data = {
    journalId,
    slug,
    title: d.title.trim(),
    body: sanitizeHtml(d.body ?? ''),
    navGroup: d.navGroup?.trim() || 'Policies',
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    showInNav: d.showInNav === 'on',
    isPublished: d.isPublished === 'on',
  }

  const page = d.id
    ? await db.page.update({ where: { id: d.id }, data })
    : await db.page.create({ data })

  const journal = journalId
    ? await db.journal.findUnique({ where: { id: journalId }, select: { slug: true } })
    : null

  const publicUrl = journal ? `/journals/${journal.slug}/${slug}` : `/policies/${slug}`

  revalidatePath('/admin/pages')
  revalidatePath(publicUrl)
  if (journal) revalidatePath(`/journals/${journal.slug}`, 'layout')
  else revalidatePath('/policies')
  revalidatePath('/')

  return {
    status: 'success',
    pageId: page.id,
    publicUrl: data.isPublished ? publicUrl : undefined,
    message: data.isPublished
      ? 'Saved. This page is live on the site.'
      : 'Saved as a draft. Nobody can see it on the site yet.',
  }
}

export async function deletePage(id: string, confirmTitle: string) {
  await requireUser()

  const page = await db.page.findUnique({
    where: { id },
    select: { journalId: true, title: true, slug: true, journal: { select: { slug: true } } },
  })
  if (!page) throw new Error('Page not found')

  const permission = await mayEditScope(page.journalId)
  if (!permission.ok) throw new Error(permission.message)

  // Typing the title is the guard against an accidental irreversible delete.
  if (confirmTitle.trim() !== page.title.trim()) {
    throw new Error('The title you typed does not match. Nothing was deleted.')
  }

  await db.page.delete({ where: { id } })

  revalidatePath('/admin/pages')
  if (page.journal) revalidatePath(`/journals/${page.journal.slug}`, 'layout')
  else revalidatePath('/policies')
  revalidatePath('/')
}
