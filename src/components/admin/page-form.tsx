'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { savePage, type PageFormState } from '@/app/admin/(dashboard)/pages/actions'
import { slugify } from '@/lib/utils'
import {
  AlertCircle,
  Bold,
  Check,
  Code2,
  ExternalLink,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Pilcrow,
} from 'lucide-react'

type JournalOption = { id: string; name: string; slug: string }

export type PageInitial = {
  id?: string
  journalId?: string | null
  slug?: string
  title?: string
  body?: string
  navGroup?: string
  sortOrder?: number
  showInNav?: boolean
  isPublished?: boolean
}

const input =
  'w-full rounded-sm border border-paper-line bg-white px-3 py-2 text-[13.5px] text-ink-900 placeholder:text-ink-400 focus:border-ink-500'

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-sm border border-paper-line bg-white p-5">
      <h2 className="font-serif text-[1.1rem] font-semibold text-ink-900">{title}</h2>
      {hint && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink-900">
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The writing area
//
// A contentEditable box driven by document.execCommand. No editor library —
// the markup it produces is deliberately the same handful of tags the public
// pages already use, so an existing page opens and saves back unchanged.
// ---------------------------------------------------------------------------

/**
 * Tags kept as they are — the same set the server allows, so switching between
 * the writing view and the HTML view never quietly drops anything. Everything
 * else loses its markup but keeps its text.
 */
const KEEP = new Set([
  'P', 'BR', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'A',
  'BLOCKQUOTE', 'HR', 'SUP', 'SUB', 'CODE', 'PRE', 'SMALL',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION',
])

/** Tags that stand on their own line at the top level of a page. */
const BLOCKS = new Set([
  'P', 'H2', 'H3', 'H4', 'UL', 'OL', 'BLOCKQUOTE', 'HR', 'PRE', 'TABLE',
])

/** Attributes kept, per tag. Mirrors the allow-list the server enforces. */
const KEEP_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(['href', 'title', 'target', 'rel']),
  TH: new Set(['colspan', 'rowspan', 'scope']),
  TD: new Set(['colspan', 'rowspan']),
  OL: new Set(['start']),
}

/** execCommand still emits these; the public pages use the semantic ones. */
const RENAME: Record<string, string> = { B: 'STRONG', I: 'EM', DIV: 'P' }

function unsafeUrl(url: string): boolean {
  return /^\s*(javascript|vbscript|data|file):/i.test(url)
}

/**
 * Turn whatever the browser (or a paste from Word) left in the box into the
 * small, tidy subset of HTML the site renders. Works on a detached copy, so
 * calling it never disturbs the cursor in the live editor.
 */
function tidy(raw: string, { wrapBlocks }: { wrapBlocks: boolean }): string {
  if (typeof document === 'undefined') return raw

  const host = document.createElement('div')
  host.innerHTML = raw

  // <b> → <strong>, <i> → <em>, <div> → <p>
  for (const el of Array.from(host.querySelectorAll('b, i, div'))) {
    const replacement = document.createElement(RENAME[el.tagName])
    while (el.firstChild) replacement.appendChild(el.firstChild)
    el.replaceWith(replacement)
  }

  // Drop everything that is not part of the allowed subset, and every
  // attribute except the ones a link needs.
  for (const el of Array.from(host.querySelectorAll('*'))) {
    if (!KEEP.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes))
      continue
    }
    const allowedAttributes = KEEP_ATTRIBUTES[el.tagName]
    for (const attribute of Array.from(el.attributes)) {
      if (!allowedAttributes?.has(attribute.name)) el.removeAttribute(attribute.name)
    }
    if (el.tagName === 'A' && unsafeUrl(el.getAttribute('href') ?? '')) {
      el.removeAttribute('href')
    }
  }

  if (!wrapBlocks) return host.innerHTML

  // Loose text or stray inline markup at the top level becomes a paragraph.
  for (const node of Array.from(host.childNodes)) {
    if (node.nodeType === 3) {
      const text = node.textContent ?? ''
      if (!text.trim()) {
        node.remove()
        continue
      }
      const p = document.createElement('p')
      p.textContent = text.trim()
      node.replaceWith(p)
    } else if (node instanceof HTMLElement && !BLOCKS.has(node.tagName)) {
      const p = document.createElement('p')
      node.replaceWith(p)
      p.appendChild(node)
    } else if (node.nodeType === 8) {
      node.remove()
    }
  }

  // Turning a line into a list leaves an empty paragraph either side of it.
  // They would show as unexplained gaps on the page, so drop them.
  for (const el of Array.from(host.children)) {
    if (['P', 'H2', 'H3', 'H4'].includes(el.tagName) && !el.textContent?.trim()) el.remove()
  }

  // One block per line keeps the "View HTML" source readable.
  return Array.from(host.children)
    .map((el) => el.outerHTML)
    .join('\n')
}

const toolbarButton =
  'flex h-8 min-w-8 items-center justify-center gap-1 rounded-sm px-1.5 text-[12.5px] text-ink-700 hover:bg-white'

function BodyEditor({ name, initialHtml }: { name: string; initialHtml: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const firstHtml = useRef(initialHtml)
  const [html, setHtml] = useState(initialHtml)
  const [showSource, setShowSource] = useState(false)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState('')

  // Ask the browser for <p> on Enter and for tags rather than inline styles.
  useEffect(() => {
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p')
      document.execCommand('styleWithCSS', false, 'false')
    } catch {
      // Older browsers reject the command; the editor still works.
    }
  }, [])

  // Light up the toolbar buttons that apply where the cursor is.
  useEffect(() => {
    function onSelectionChange() {
      const selection = document.getSelection()
      const box = editorRef.current
      if (!box || !selection?.anchorNode || !box.contains(selection.anchorNode)) return
      let block = ''
      try {
        block = document.queryCommandValue('formatBlock').toLowerCase()
      } catch {
        block = ''
      }
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        bullets: document.queryCommandState('insertUnorderedList'),
        numbers: document.queryCommandState('insertOrderedList'),
        h2: block === 'h2',
        h3: block === 'h3',
      })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  function sync() {
    if (editorRef.current) setHtml(tidy(editorRef.current.innerHTML, { wrapBlocks: true }))
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    sync()
  }

  function addLink() {
    const url = window.prompt(
      'Paste the web address this text should link to.\n\nFor a page on this site, start with a slash — for example /policies/peer-review-policy',
      'https://',
    )
    if (url === null) return
    const trimmed = url.trim()
    if (!trimmed || trimmed === 'https://') return
    if (unsafeUrl(trimmed)) {
      setNotice('That web address is not allowed. Use one starting with https:// or /.')
      return
    }
    setNotice('')
    exec('createLink', trimmed)
  }

  function toggleSource() {
    if (showSource) {
      // Back to the writing view: take whatever was typed in the source box.
      if (editorRef.current) editorRef.current.innerHTML = html
      setShowSource(false)
      sync()
    } else {
      sync()
      setShowSource(true)
    }
  }

  // Pasted content is cleaned before it lands, so what you see in the box is
  // exactly what gets saved.
  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pastedHtml = event.clipboardData.getData('text/html')
    const pastedText = event.clipboardData.getData('text/plain')
    event.preventDefault()
    if (pastedHtml) {
      document.execCommand('insertHTML', false, tidy(pastedHtml, { wrapBlocks: false }))
    } else {
      document.execCommand('insertText', false, pastedText)
    }
    sync()
  }

  const buttons: {
    key: string
    label: string
    title: string
    icon: React.ReactNode
    run: () => void
  }[] = [
    { key: 'bold', label: 'Bold', title: 'Bold', icon: <Bold className="h-3.5 w-3.5" />, run: () => exec('bold') },
    { key: 'italic', label: 'Italic', title: 'Italic', icon: <Italic className="h-3.5 w-3.5" />, run: () => exec('italic') },
    { key: 'h2', label: 'Heading', title: 'Main heading', icon: <Heading2 className="h-3.5 w-3.5" />, run: () => exec('formatBlock', '<h2>') },
    { key: 'h3', label: 'Sub-heading', title: 'Smaller heading', icon: <Heading3 className="h-3.5 w-3.5" />, run: () => exec('formatBlock', '<h3>') },
    { key: 'p', label: 'Normal text', title: 'Ordinary paragraph', icon: <Pilcrow className="h-3.5 w-3.5" />, run: () => exec('formatBlock', '<p>') },
    { key: 'bullets', label: 'Bullets', title: 'Bulleted list', icon: <List className="h-3.5 w-3.5" />, run: () => exec('insertUnorderedList') },
    { key: 'numbers', label: 'Numbers', title: 'Numbered list', icon: <ListOrdered className="h-3.5 w-3.5" />, run: () => exec('insertOrderedList') },
    { key: 'link', label: 'Link', title: 'Add a link', icon: <Link2 className="h-3.5 w-3.5" />, run: addLink },
    { key: 'unlink', label: 'Remove link', title: 'Remove the link', icon: <Link2Off className="h-3.5 w-3.5" />, run: () => exec('unlink') },
  ]

  return (
    <div className="rounded-sm border border-paper-line">
      <input type="hidden" name={name} value={html} />

      <div className="flex flex-wrap items-center gap-0.5 border-b border-paper-line bg-paper-shade px-2 py-1.5">
        {buttons.map((button) => (
          <button
            key={button.key}
            type="button"
            title={button.title}
            aria-label={button.title}
            aria-pressed={active[button.key] ? true : undefined}
            disabled={showSource}
            // Keep the text selection while the button is clicked.
            onMouseDown={(e) => e.preventDefault()}
            onClick={button.run}
            className={
              toolbarButton +
              (active[button.key] ? ' bg-white font-semibold text-ink-900 shadow-sm' : '') +
              (showSource ? ' cursor-not-allowed opacity-40' : '')
            }
          >
            {button.icon}
            <span className="hidden sm:inline">{button.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={toggleSource}
          title="Show the underlying HTML"
          className={toolbarButton + ' ml-auto' + (showSource ? ' bg-white font-semibold text-ink-900' : '')}
        >
          <Code2 className="h-3.5 w-3.5" />
          {showSource ? 'Back to writing' : 'View HTML'}
        </button>
      </div>

      {notice && (
        <p className="border-b border-paper-line bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {notice}
        </p>
      )}

      {/* Kept mounted while the source view is open so nothing is lost. */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Page text"
        onInput={sync}
        onBlur={sync}
        onPaste={onPaste}
        style={{ display: showSource ? 'none' : 'block' }}
        className="prose-doc min-h-[24rem] max-w-none overflow-y-auto px-4 py-3 text-[14px] focus:outline-none"
        dangerouslySetInnerHTML={{ __html: firstHtml.current }}
      />

      {showSource && (
        <div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            rows={20}
            aria-label="Page HTML"
            className="block w-full resize-y border-0 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-900 focus:outline-none"
          />
          <p className="border-t border-paper-line bg-paper-shade px-4 py-2 text-[12px] text-ink-500">
            Only paragraphs, headings, lists, bold, italic and links are kept. Anything else is
            removed when you save.
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function SaveBar({ isPublished }: { isPublished: boolean }) {
  const { pending } = useFormStatus()
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper-line bg-white px-6 py-3.5 lg:-mx-8 lg:px-8">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input type="checkbox" name="isPublished" defaultChecked={isPublished} className="h-4 w-4" />
        <span className="text-[13.5px] text-ink-800">
          <span className="font-medium">Show this page on the site</span>
          <span className="block text-[12px] text-ink-500">
            Untick to take it down without deleting it.
          </span>
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink-900 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save page'}
      </button>
    </div>
  )
}

export function PageForm({
  initial,
  journals,
  navGroups,
}: {
  initial: PageInitial
  journals: JournalOption[]
  navGroups: string[]
}) {
  const [state, action] = useActionState<PageFormState, FormData>(savePage, { status: 'idle' })
  const [journalId, setJournalId] = useState(initial.journalId ?? '')
  const [title, setTitle] = useState(initial.title ?? '')
  const [slug, setSlug] = useState(initial.slug ?? '')
  // Once the publisher edits the web address by hand we stop rewriting it.
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug))

  const journal = journals.find((j) => j.id === journalId)
  const prefix = journal ? `/journals/${journal.slug}/` : '/policies/'
  const shownSlug = slug || slugify(title) || 'web-address'

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {state.status === 'success' && (
        <div className="flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {state.message}
            {state.publicUrl && (
              <>
                {' '}
                <a
                  href={state.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  Open the live page <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </>
            )}
          </span>
        </div>
      )}

      {state.status === 'error' && state.message && (
        <div className="flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      {/* ------------------------------------------------------ Where it sits */}
      <Section
        title="Where this page belongs"
        hint="A page can apply to the whole publisher — like an ethics policy — or to one journal only."
      >
        <Field
          label="This page applies to"
          hint="Choosing a journal puts the page in that journal's own menu instead of the publisher-wide policies list."
        >
          <select
            name="journalId"
            value={journalId}
            onChange={(e) => setJournalId(e.target.value)}
            className={input}
          >
            <option value="">All journals (a publisher-wide page)</option>
            {journals.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* -------------------------------------------------------- The page */}
      <Section title="The page">
        <Field label="Title" required error={state.fieldErrors?.title}>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Peer Review Policy"
            className={input}
          />
        </Field>

        <Field
          label="Web address"
          error={state.fieldErrors?.slug}
          hint="The end of the page's address, written from the title. Only change it if you have a reason — changing it breaks any link anyone has already shared."
        >
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
            <span className="shrink-0">{prefix}</span>
            <input
              name="slug"
              value={slugEdited ? slug : slugify(title)}
              onChange={(e) => {
                setSlugEdited(true)
                setSlug(e.target.value)
              }}
              placeholder="written from the title"
              className={input + ' flex-1'}
            />
          </div>
          <p className="mt-1.5 text-[12px] text-ink-500">
            Readers will find this page at{' '}
            <span className="font-medium text-ink-700">
              {prefix}
              {slugEdited ? slugify(slug) || 'web-address' : shownSlug}
            </span>
          </p>
        </Field>

        <Field
          label="Page text"
          hint="Write as you would in a word processor. Use the buttons for headings, bold, lists and links."
        >
          <BodyEditor name="body" initialHtml={initial.body ?? ''} />
        </Field>
      </Section>

      {/* ------------------------------------------------------ In the menu */}
      <Section
        title="Where it appears in the menu"
        hint="Pages are listed under a heading. Reuse an existing heading to group related pages together."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Menu heading"
            hint="For example “For Authors”, “Editorial Policies” or “Ethics”."
          >
            <input
              name="navGroup"
              defaultValue={initial.navGroup ?? 'Policies'}
              list="page-nav-groups"
              className={input}
            />
            <datalist id="page-nav-groups">
              {navGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>

          <Field
            label="Position in the list"
            hint="A lower number appears higher up. Pages with the same number keep their existing order."
          >
            <input
              name="sortOrder"
              type="number"
              defaultValue={initial.sortOrder ?? 0}
              className={input}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-sm bg-paper-shade px-3.5 py-2.5">
          <input
            type="checkbox"
            name="showInNav"
            defaultChecked={initial.showInNav ?? true}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-[13px] text-ink-800">
            <span className="font-medium">List this page in the menu</span>
            <span className="block text-[12px] text-ink-500">
              Untick for a page you want to link to yourself but not show in the navigation.
            </span>
          </span>
        </label>
      </Section>

      <SaveBar isPublished={initial.isPublished ?? true} />

      <p className="text-center text-[12.5px] text-ink-500">
        <Link href="/admin/pages" className="underline underline-offset-2 hover:text-ink-800">
          Back to all pages
        </Link>
      </p>
    </form>
  )
}
