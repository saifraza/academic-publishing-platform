'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { saveArticle, type ArticleFormState } from '@/app/admin/(dashboard)/articles/actions'
import { ARTICLE_TYPE_LABELS } from '@/lib/labels'
import { Plus, Trash2, GripVertical, AlertCircle, Check, ExternalLink } from 'lucide-react'

type AuthorRow = {
  fullName: string
  email: string
  affiliation: string
  country: string
  orcid: string
  isCorresponding: boolean
}

type IssueOption = { id: string; label: string; journalId: string }
type JournalOption = { id: string; name: string; slug: string; doiPrefix: string | null }

export type ArticleInitial = {
  id?: string
  journalId?: string
  issueId?: string | null
  slug?: string
  title?: string
  abstract?: string
  keywords?: string[]
  articleType?: string
  doi?: string | null
  pageStart?: number | null
  pageEnd?: number | null
  articleNumber?: string | null
  receivedAt?: string
  revisedAt?: string
  acceptedAt?: string
  publishedAt?: string
  fundingStatement?: string
  conflictOfInterest?: string
  dataAvailability?: string
  acknowledgements?: string
  references?: string
  isFeatured?: boolean
  isPublished?: boolean
  pdfUrl?: string | null
  authors?: AuthorRow[]
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
  forIndexing,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  forIndexing?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink-900">
        {label}
        {required && <span className="text-red-600">*</span>}
        {forIndexing && (
          <span className="rounded-sm bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-700">
            needed for indexing
          </span>
        )}
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

function SaveBar({ isPublished }: { isPublished: boolean }) {
  const { pending } = useFormStatus()
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper-line bg-white px-6 py-3.5 lg:-mx-8 lg:px-8">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          name="publish"
          defaultChecked={isPublished}
          className="h-4 w-4"
        />
        <span className="text-[13.5px] text-ink-800">
          <span className="font-medium">Publish this article</span>
          <span className="block text-[12px] text-ink-500">
            When ticked, the article is visible to everyone on the public site.
          </span>
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink-900 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save article'}
      </button>
    </div>
  )
}

export function ArticleForm({
  initial,
  journals,
  issues,
}: {
  initial: ArticleInitial
  journals: JournalOption[]
  issues: IssueOption[]
}) {
  const [state, action] = useActionState<ArticleFormState, FormData>(saveArticle, {
    status: 'idle',
  })
  const [journalId, setJournalId] = useState(initial.journalId ?? journals[0]?.id ?? '')
  const [authors, setAuthors] = useState<AuthorRow[]>(
    initial.authors?.length
      ? initial.authors
      : [{ fullName: '', email: '', affiliation: '', country: '', orcid: '', isCorresponding: true }],
  )

  // After a rejected save React resets the form to its defaultValues, so those
  // defaults must reflect what was just submitted or the editor loses their work.
  const v = (name: string, fallback?: string | number | null) =>
    state.values?.[name] ?? (fallback === null || fallback === undefined ? '' : String(fallback))
  const checked = (name: string, fallback: boolean) =>
    state.values ? state.values[name] === 'on' : fallback
  // Selects need a key so a changed defaultValue actually takes effect on reset.
  const resetKey = state.values ? 'restored' : 'initial'

  const journalIssues = issues.filter((i) => i.journalId === journalId)
  const selectedJournal = journals.find((j) => j.id === journalId)
  const publicUrl =
    initial.id && initial.slug && selectedJournal
      ? `/journals/${selectedJournal.slug}/articles/${initial.slug}`
      : null

  function updateAuthor(i: number, patch: Partial<AuthorRow>) {
    setAuthors((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)))
  }

  function move(i: number, dir: -1 | 1) {
    setAuthors((prev) => {
      const next = [...prev]
      const target = i + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[i], next[target]] = [next[target], next[i]]
      return next
    })
  }

  return (
    <form action={action} className="space-y-5">
      {/* After a create, carry the new id forward so pressing Save again edits
          the record instead of creating a second copy of it. */}
      {(state.articleId ?? initial.id) && (
        <input type="hidden" name="id" value={state.articleId ?? initial.id} />
      )}
      <input type="hidden" name="authors" value={JSON.stringify(authors)} />

      {state.status === 'success' && (
        <div className="flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {state.message}
            {publicUrl && (
              <>
                {' '}
                <a
                  href={publicUrl}
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

      {/* --------------------------------------------------- Where it goes */}
      <Section
        title="Where this article belongs"
        hint="Choose the journal first — the list of issues below changes to match."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Journal" required error={state.fieldErrors?.journalId}>
            <select
              name="journalId"
              value={journalId}
              onChange={(e) => setJournalId(e.target.value)}
              className={input}
            >
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Issue"
            hint="Leave as “Not in an issue” to publish ahead of an issue (online first)."
          >
            <select name="issueId" key={resetKey}
              defaultValue={v('issueId', initial.issueId)} className={input}>
              <option value="">Not in an issue (online first)</option>
              {journalIssues.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------- The article */}
      <Section title="The article">
        <Field label="Title" required error={state.fieldErrors?.title}>
          <input name="title" defaultValue={v('title', initial.title)} className={input} />
        </Field>

        <Field label="Article type" required>
          <select
            name="articleType"
            key={resetKey}
            defaultValue={v('articleType', initial.articleType ?? 'RESEARCH')}
            className={input}
          >
            {Object.entries(ARTICLE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Abstract"
          required
          forIndexing
          error={state.fieldErrors?.abstract}
          hint="Paste the full abstract. This is what appears in search results and in Google Scholar."
        >
          <textarea name="abstract" rows={8} defaultValue={v('abstract', initial.abstract)} className={input} />
        </Field>

        <Field
          label="Keywords"
          forIndexing
          hint="Separated by commas. Four to eight is usual."
        >
          <input
            name="keywords"
            defaultValue={v('keywords', initial.keywords?.join(', '))}
            placeholder="periodontitis, biofilm, randomised trial"
            className={input}
          />
        </Field>

        <Field
          label="Web address"
          hint="Generated from the title. Only change it if you have a reason — changing it breaks any existing links."
        >
          <div className="flex items-center gap-2 text-[13px] text-ink-500">
            <span className="shrink-0">/journals/{selectedJournal?.slug}/articles/</span>
            <input
              name="slug"
              defaultValue={v('slug', initial.slug)}
              placeholder="generated from the title"
              className={input}
            />
          </div>
        </Field>
      </Section>

      {/* ---------------------------------------------------------- Authors */}
      <Section
        title="Authors"
        hint="In the order they appear on the paper. The first author is listed first."
      >
        {state.fieldErrors?.authors && (
          <p className="text-[12.5px] text-red-700">{state.fieldErrors.authors}</p>
        )}

        <div className="space-y-3">
          {authors.map((a, i) => (
            <div key={i} className="rounded-sm border border-paper-line bg-paper-shade p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-ink-500">
                  <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  Author {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move author ${i + 1} up`}
                    className="rounded-sm px-2 py-1 text-[12px] text-ink-600 hover:bg-white disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === authors.length - 1}
                    aria-label={`Move author ${i + 1} down`}
                    className="rounded-sm px-2 py-1 text-[12px] text-ink-600 hover:bg-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthors((p) => p.filter((_, j) => j !== i))}
                    disabled={authors.length === 1}
                    aria-label={`Remove author ${i + 1}`}
                    className="rounded-sm px-2 py-1 text-ink-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['fullName', 'Full name', 'Priya Ramaswamy'],
                    ['affiliation', 'Affiliation', 'Department of Prosthodontics, …'],
                    ['email', 'Email', ''],
                    ['country', 'Country', ''],
                    ['orcid', 'ORCID', '0000-0002-1825-0097'],
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label className="block text-[12px] font-medium text-ink-700">{label}</label>
                    <input
                      value={a[key]}
                      placeholder={placeholder}
                      onChange={(e) => updateAuthor(i, { [key]: e.target.value })}
                      className="mt-1 w-full rounded-sm border border-paper-line px-2.5 py-1.5 text-[13px]"
                    />
                  </div>
                ))}
                <label className="flex items-end gap-2 pb-1.5">
                  <input
                    type="checkbox"
                    checked={a.isCorresponding}
                    onChange={(e) => updateAuthor(i, { isCorresponding: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-[13px] text-ink-800">Corresponding author</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setAuthors((p) => [
              ...p,
              { fullName: '', email: '', affiliation: '', country: '', orcid: '', isCorresponding: false },
            ])
          }
          className="inline-flex items-center gap-1.5 rounded-sm border border-ink-300 px-3 py-2 text-[13px] font-medium text-ink-800 hover:bg-paper-shade"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add another author
        </button>
      </Section>

      {/* -------------------------------------------------------------- PDF */}
      <Section
        title="The PDF"
        hint="The typeset article readers will download. PDFs only, up to 40 MB."
      >
        {initial.pdfUrl && (
          <p className="rounded-sm bg-paper-shade px-3.5 py-2.5 text-[12.5px] text-ink-700">
            A PDF is already attached.{' '}
            <a
              href={initial.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              View it
            </a>
            . Uploading a new file replaces it.
          </p>
        )}
        <Field label="Upload PDF" error={state.fieldErrors?.pdfFile}>
          <input
            type="file"
            name="pdfFile"
            accept=".pdf"
            className="block w-full rounded-sm border border-dashed border-ink-300 bg-paper-shade px-4 py-5 text-[13px] file:mr-3 file:rounded-sm file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-white"
          />
        </Field>
      </Section>

      {/* ------------------------------------------------- Publication record */}
      <Section
        title="Publication record"
        hint="These appear on the article page and are read by Google Scholar and indexing services."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="DOI"
            forIndexing
            error={state.fieldErrors?.doi}
            hint={
              selectedJournal?.doiPrefix
                ? `This journal's prefix is ${selectedJournal.doiPrefix} — e.g. ${selectedJournal.doiPrefix}/jcdr.2026.001`
                : 'Register the DOI with Crossref first, then paste it here.'
            }
          >
            <input
              name="doi"
              defaultValue={v('doi', initial.doi)}
              placeholder="10.12345/jcdr.2026.001"
              className={input}
            />
          </Field>

          <Field label="Article number" hint="For continuous publication instead of page numbers.">
            <input name="articleNumber" defaultValue={v('articleNumber', initial.articleNumber)} className={input} />
          </Field>

          <Field label="First page">
            <input name="pageStart" type="number" defaultValue={v('pageStart', initial.pageStart)} className={input} />
          </Field>
          <Field label="Last page">
            <input name="pageEnd" type="number" defaultValue={v('pageEnd', initial.pageEnd)} className={input} />
          </Field>

          {(
            [
              ['receivedAt', 'Date received'],
              ['revisedAt', 'Date revised'],
              ['acceptedAt', 'Date accepted'],
              ['publishedAt', 'Date published'],
            ] as const
          ).map(([name, label]) => (
            <Field key={name} label={label}>
              <input
                type="date"
                name={name}
                defaultValue={v(name, initial[name])}
                className={input}
              />
            </Field>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-sm bg-paper-shade px-3.5 py-2.5">
          <input
            type="checkbox"
            name="isFeatured"
            key={resetKey}
            defaultChecked={checked('isFeatured', initial.isFeatured ?? false)}
            className="h-4 w-4"
          />
          <span className="text-[13px] text-ink-800">
            Feature this article on the publisher homepage
          </span>
        </label>
      </Section>

      {/* ----------------------------------------------------- Declarations */}
      <Section
        title="Declarations"
        hint="Required by most indexing services and by our own ethics policy."
      >
        {(
          [
            ['fundingStatement', 'Funding statement'],
            ['conflictOfInterest', 'Conflict of interest'],
            ['dataAvailability', 'Data availability'],
            ['acknowledgements', 'Acknowledgements'],
          ] as const
        ).map(([name, label]) => (
          <Field key={name} label={label}>
            <textarea name={name} rows={2} defaultValue={v(name, initial[name])} className={input} />
          </Field>
        ))}

        <Field label="References" hint="Paste the reference list, one per line.">
          <textarea name="references" rows={6} defaultValue={v('references', initial.references)} className={input} />
        </Field>
      </Section>

      <SaveBar
        key={resetKey}
        isPublished={checked('publish', initial.isPublished ?? false)}
      />

      <p className="text-center text-[12.5px] text-ink-500">
        <Link href="/admin/articles" className="underline underline-offset-2 hover:text-ink-800">
          Back to all articles
        </Link>
      </p>
    </form>
  )
}
