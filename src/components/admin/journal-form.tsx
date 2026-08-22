'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { saveJournal, type JournalFormState } from '@/app/admin/(dashboard)/journals/actions'
import { FREQUENCY_LABELS, PEER_REVIEW_LABELS, LICENSE_LABELS } from '@/lib/labels'
import { slugify, contrastText } from '@/lib/utils'
import { AlertCircle, Check, ExternalLink, Plus, X } from 'lucide-react'

export type JournalInitial = {
  id?: string
  name?: string
  shortName?: string
  abbreviation?: string
  slug?: string
  issnOnline?: string | null
  issnPrint?: string | null
  description?: string
  aimsAndScope?: string
  subjectAreas?: string[]
  frequency?: string
  peerReviewType?: string
  apcAmount?: number
  apcCurrency?: string
  licenseType?: string
  doiPrefix?: string | null
  email?: string
  copyrightFormUrl?: string | null
  foundedYear?: number | null
  primaryColor?: string
  sortOrder?: number
  isPublished?: boolean
}

const input =
  'w-full rounded-sm border border-paper-line bg-white px-3 py-2 text-[13.5px] text-ink-900 placeholder:text-ink-400 focus:border-ink-500'

/** The currencies our publisher actually bills in. */
const CURRENCIES: [string, string][] = [
  ['INR', 'Indian rupees (INR)'],
  ['USD', 'US dollars (USD)'],
  ['EUR', 'Euros (EUR)'],
  ['GBP', 'Pounds sterling (GBP)'],
]

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
          <span className="font-medium">Show this journal on the public website</span>
          <span className="block text-[12px] text-ink-500">
            When ticked, anyone can read this journal&rsquo;s home page, archive and articles.
            Leave it unticked while you are still setting it up.
          </span>
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink-900 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save journal'}
      </button>
    </div>
  )
}

export function JournalForm({ initial }: { initial: JournalInitial }) {
  const [state, action] = useActionState<JournalFormState, FormData>(saveJournal, {
    status: 'idle',
  })

  const [name, setName] = useState(initial.name ?? '')
  const [slug, setSlug] = useState(initial.slug ?? '')
  // An existing journal keeps the address it was given; a new one follows the name.
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug))
  const [colour, setColour] = useState(initial.primaryColor ?? '#0a2540')
  const [areas, setAreas] = useState<string[]>(initial.subjectAreas ?? [])
  const [areaDraft, setAreaDraft] = useState('')

  const effectiveSlug = slugEdited ? slug : slugify(name)
  const savedId = initial.id ?? state.journalId
  const liveSlug = state.slug ?? initial.slug ?? effectiveSlug
  const colourIsValid = /^#[0-9a-fA-F]{6}$/.test(colour)

  // Keep an existing journal's currency selectable even if it is not in our
  // short list. On a new journal there is nothing to preserve, so the list is
  // used as-is — appending a default here duplicated the INR option.
  const currencies =
    initial.apcCurrency && !CURRENCIES.some(([c]) => c === initial.apcCurrency)
      ? [...CURRENCIES, [initial.apcCurrency, initial.apcCurrency] as [string, string]]
      : CURRENCIES

  function addArea() {
    const value = areaDraft.trim().replace(/,$/, '').trim()
    if (!value) return
    setAreas((prev) =>
      prev.some((a) => a.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value],
    )
    setAreaDraft('')
  }

  return (
    <form action={action} className="space-y-5">
      {savedId && <input type="hidden" name="id" value={savedId} />}
      <input type="hidden" name="subjectAreas" value={JSON.stringify(areas)} />

      {state.status === 'success' && (
        <div className="flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {state.message}
            {state.isPublished && (
              <>
                {' '}
                <a
                  href={`/journals/${liveSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  Open its page <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </>
            )}
            {!initial.id && state.journalId && (
              <>
                {' '}
                <Link
                  href={`/admin/journals/${state.journalId}`}
                  className="font-medium underline underline-offset-2"
                >
                  Keep editing it
                </Link>
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

      {/* --------------------------------------------------------- The name */}
      <Section
        title="Name and web address"
        hint="How the journal is named on the site, in citations and in the address bar."
      >
        <Field
          label="Full name"
          required
          error={state.fieldErrors?.name}
          hint="Exactly as it appears on the cover, for example “Journal of Clinical Dentistry Research”."
        >
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Journal of Clinical Dentistry Research"
            className={input}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Short name"
            hint="A few words used in menus and on small labels, e.g. “Clinical Dentistry”."
          >
            <input name="shortName" defaultValue={initial.shortName} className={input} />
          </Field>

          <Field
            label="Abbreviation"
            forIndexing
            hint="The official short title used when the journal is cited, e.g. “J Clin Dent Res”."
          >
            <input
              name="abbreviation"
              defaultValue={initial.abbreviation}
              placeholder="J Clin Dent Res"
              className={input}
            />
          </Field>
        </div>

        <Field
          label="Web address"
          error={state.fieldErrors?.slug}
          hint={
            initial.id
              ? 'This is the part of the link that identifies the journal. It was built from the name. Changing it breaks every existing link and bookmark to this journal, so only change it if you must.'
              : 'This is the part of the link that identifies the journal. It is built from the name — you can change it, but it is easiest to leave it alone.'
          }
        >
          <div className="flex items-center gap-2 text-[13px] text-ink-500">
            <span className="shrink-0">/journals/</span>
            <input
              name="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugEdited(true)
                setSlug(e.target.value)
              }}
              placeholder="built from the name"
              className={input}
            />
          </div>
          {initial.id && slugEdited && slug !== initial.slug && (
            <p className="mt-1.5 flex items-start gap-1.5 rounded-sm bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              You are changing the web address. Links people have saved, and links printed in
              other papers, will stop working.
            </p>
          )}
        </Field>
      </Section>

      {/* --------------------------------------------------- Identifiers */}
      <Section
        title="Registration numbers"
        hint="Databases such as Crossref, DOAJ and Google Scholar use these to recognise the journal. Leave one blank if it has not been issued yet."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="ISSN (online edition)"
            forIndexing
            error={state.fieldErrors?.issnOnline}
            hint="The eight-character number issued for the website edition."
          >
            <input
              name="issnOnline"
              defaultValue={initial.issnOnline ?? ''}
              placeholder="2456-1234"
              className={input}
            />
          </Field>

          <Field
            label="ISSN (print edition)"
            forIndexing
            error={state.fieldErrors?.issnPrint}
            hint="Only if the journal is also printed on paper."
          >
            <input
              name="issnPrint"
              defaultValue={initial.issnPrint ?? ''}
              placeholder="2456-1226"
              className={input}
            />
          </Field>
        </div>

        <Field
          label="DOI prefix"
          forIndexing
          error={state.fieldErrors?.doiPrefix}
          hint="The number Crossref gave the publisher — just the part before the slash. Every article DOI you type will start with it."
        >
          <input
            name="doiPrefix"
            defaultValue={initial.doiPrefix ?? ''}
            placeholder="10.12345"
            className={input}
          />
        </Field>

        <Field
          label="Editorial email for this journal"
          error={state.fieldErrors?.email}
          hint="Where authors write about this journal specifically. Leave blank to use the publisher's main address."
        >
          <input
            name="email"
            type="email"
            defaultValue={initial.email ?? ''}
            placeholder="editor.example@yourdomain.com"
            className={input}
          />
        </Field>

        <Field
          label="Copyright form for authors"
          error={state.fieldErrors?.copyrightFormFile}
          hint="The blank form authors download, sign and send back with their manuscript. Word or PDF, up to 10 MB. Until you upload one, the submission page tells authors to ask the editorial office for a copy."
        >
          {initial.copyrightFormUrl && (
            <p className="mb-2 rounded-sm bg-paper-shade px-3.5 py-2 text-[12.5px] text-ink-700">
              A form is already uploaded.{' '}
              <a
                href={initial.copyrightFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2"
              >
                View it
              </a>
              . Choosing a new file replaces it.
            </p>
          )}
          <input
            type="file"
            name="copyrightFormFile"
            accept=".pdf,.doc,.docx"
            className="block w-full rounded-sm border border-dashed border-ink-300 bg-paper-shade px-4 py-4 text-[13px] file:mr-3 file:rounded-sm file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-white"
          />
        </Field>
      </Section>

      {/* ------------------------------------------------- What it publishes */}
      <Section
        title="What the journal publishes"
        hint="This is the wording readers and prospective authors see first."
      >
        <Field
          label="Short description"
          hint="Two or three sentences. Used on the journals list and in search results."
        >
          <textarea name="description" rows={3} defaultValue={initial.description} className={input} />
        </Field>

        <Field
          label="Aims and scope"
          hint="The full statement of what the journal covers and what it will consider. It gets its own page on the site."
        >
          <textarea
            name="aimsAndScope"
            rows={8}
            defaultValue={initial.aimsAndScope}
            className={input}
          />
        </Field>

        <Field
          label="Subject areas"
          hint="The fields this journal covers. Type one and press Enter to add it."
        >
          <div className="flex gap-2">
            <input
              value={areaDraft}
              onChange={(e) => setAreaDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addArea()
                }
              }}
              placeholder="Periodontics"
              className={input}
            />
            <button
              type="button"
              onClick={addArea}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-ink-300 px-3 py-2 text-[13px] font-medium text-ink-800 hover:bg-paper-shade"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add
            </button>
          </div>

          {areas.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-ink-500">No subject areas added yet.</p>
          ) : (
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {areas.map((area, i) => (
                <li
                  key={`${area}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-paper-line bg-paper-shade px-2.5 py-1 text-[12.5px] text-ink-800"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => setAreas((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove ${area}`}
                    className="rounded-sm text-ink-500 hover:text-red-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>
      </Section>

      {/* ------------------------------------------------------ How it runs */}
      <Section title="How the journal runs">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="How often issues come out">
            <select
              name="frequency"
              defaultValue={initial.frequency ?? 'QUARTERLY'}
              className={input}
            >
              {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Type of peer review"
            hint="Shown to authors so they know what to expect when they submit."
          >
            <select
              name="peerReviewType"
              defaultValue={initial.peerReviewType ?? 'DOUBLE_BLIND'}
              className={input}
            >
              {Object.entries(PEER_REVIEW_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Year the journal started"
            error={state.fieldErrors?.foundedYear}
            hint="Four digits. Leave blank if it has not published its first issue yet."
          >
            <input
              name="foundedYear"
              type="number"
              defaultValue={initial.foundedYear ?? ''}
              placeholder="2016"
              className={input}
            />
          </Field>

          <Field
            label="Position in the journals list"
            hint="A lower number puts this journal nearer the top of every list on the site. Use 0 for the flagship."
          >
            <input
              name="sortOrder"
              type="number"
              defaultValue={initial.sortOrder ?? 0}
              className={input}
            />
          </Field>
        </div>
      </Section>

      {/* -------------------------------------------------- Fees and licence */}
      <Section
        title="Author charges and reuse licence"
        hint="Both of these appear on the journal page and are checked by directories such as DOAJ."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Article processing charge"
            error={state.fieldErrors?.apcAmount}
            hint="What an author pays once a paper is accepted. Enter 0 if you charge nothing."
          >
            <input
              name="apcAmount"
              type="number"
              min={0}
              defaultValue={initial.apcAmount ?? 0}
              className={input}
            />
          </Field>

          <Field label="Currency of that charge" error={state.fieldErrors?.apcCurrency}>
            <select
              name="apcCurrency"
              defaultValue={initial.apcCurrency ?? 'INR'}
              className={input}
            >
              {currencies.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="How readers may reuse articles"
          hint="The licence printed on every article in this journal. Attribution-only is the most open and the one most directories prefer."
        >
          <select name="licenseType" defaultValue={initial.licenseType ?? 'CC_BY'} className={input}>
            {Object.entries(LICENSE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l.full} ({l.short})
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* ------------------------------------------------------ Appearance */}
      <Section
        title="Appearance"
        hint="The journal’s own colour, used on its pages and on the labels that mark its articles."
      >
        <Field
          label="Accent colour"
          error={state.fieldErrors?.primaryColor}
          hint="Pick a colour, or type it as six characters if you have the exact one from your designer."
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={colourIsValid ? colour : '#0a2540'}
              onChange={(e) => setColour(e.target.value)}
              aria-label="Choose the accent colour"
              className="h-10 w-14 shrink-0 cursor-pointer rounded-sm border border-paper-line bg-white p-1"
            />
            <input
              name="primaryColor"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              placeholder="#0a2540"
              className="w-36 rounded-sm border border-paper-line bg-white px-3 py-2 font-mono text-[13.5px] text-ink-900"
            />
            <span
              className="rounded-sm px-2.5 py-1 text-[12.5px] font-medium"
              style={
                colourIsValid
                  ? { backgroundColor: colour, color: contrastText(colour) }
                  : { backgroundColor: '#f6f4f0', color: '#365b83' }
              }
            >
              {name.trim() || 'Journal label preview'}
            </span>
          </div>
        </Field>
      </Section>

      <SaveBar isPublished={initial.isPublished ?? false} />

      <p className="text-center text-[12.5px] text-ink-500">
        <Link href="/admin/journals" className="underline underline-offset-2 hover:text-ink-800">
          Back to all journals
        </Link>
      </p>
    </form>
  )
}
