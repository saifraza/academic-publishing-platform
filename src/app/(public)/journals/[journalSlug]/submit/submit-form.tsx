'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { submitManuscript, type SubmitState } from './actions'
import { ARTICLE_TYPE_LABELS } from '@/lib/labels'
import { Plus, Trash2, Check, AlertCircle, Upload, ArrowLeft, ArrowRight } from 'lucide-react'

type CoAuthor = { fullName: string; email: string; affiliation: string; orcid: string }

const STEPS = ['Manuscript', 'Authors', 'Files', 'Declarations', 'Review'] as const

const DECLARATIONS = [
  {
    name: 'declarationOriginal',
    label: 'This manuscript is my own original work, and all sources are properly attributed.',
  },
  {
    name: 'declarationNotElsewhere',
    label: 'It is not under consideration by any other journal, and has not been published before.',
  },
  {
    name: 'declarationEthics',
    label:
      'Where the study involved human participants or animals, appropriate ethical approval and informed consent were obtained.',
  },
  {
    name: 'declarationConflict',
    label:
      'All financial and non-financial conflicts of interest have been disclosed in the manuscript.',
  },
] as const

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-sm accent-bg px-6 py-3 text-[14px] font-medium transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Submitting…' : 'Submit manuscript'}
    </button>
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
      <label className="block text-[13.5px] font-medium text-ink-900">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{hint}</p>}
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

const inputClass =
  'w-full rounded-sm border border-paper-line bg-white px-3 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-ink-500'

export function SubmitForm({
  journalId,
  journalSlug,
  journalName,
  apcText,
}: {
  journalId: string
  journalSlug: string
  journalName: string
  apcText: string
}) {
  const [state, formAction] = useActionState<SubmitState, FormData>(submitManuscript, {
    status: 'idle',
  })
  const [step, setStep] = useState(0)
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})

  const storageKey = `submission-draft-${journalSlug}`

  // Restore an in-progress draft — long forms lose people otherwise
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setDraft(parsed.fields ?? {})
        setCoAuthors(parsed.coAuthors ?? [])
      } catch {
        /* ignore a corrupt draft */
      }
    }
  }, [storageKey])

  function persist(fields: Record<string, string>, authors: CoAuthor[]) {
    localStorage.setItem(storageKey, JSON.stringify({ fields, coAuthors: authors }))
  }

  function onFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const next = { ...draft, [e.target.name]: e.target.value }
    setDraft(next)
    persist(next, coAuthors)
  }

  useEffect(() => {
    if (state.status === 'success') localStorage.removeItem(storageKey)
  }, [state.status, storageKey])

  // Jump to the first step containing an error
  useEffect(() => {
    if (state.status !== 'error' || !state.fieldErrors) return
    const keys = Object.keys(state.fieldErrors)
    const stepOf: Record<string, number> = {
      manuscriptTitle: 0, abstract: 0, keywords: 0, articleType: 0,
      correspondingAuthorName: 1, correspondingAuthorEmail: 1, correspondingAffiliation: 1,
      manuscriptFile: 2,
      declarationOriginal: 3, declarationNotElsewhere: 3, declarationEthics: 3, declarationConflict: 3,
    }
    const target = Math.min(...keys.map((k) => stepOf[k] ?? 4))
    if (Number.isFinite(target)) setStep(target)
  }, [state])

  if (state.status === 'success') {
    return (
      <div className="rounded-sm border border-paper-line bg-white p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full accent-bg">
          <Check className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="font-serif text-[1.6rem] font-semibold text-ink-900">
          Your manuscript has been received
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-700">
          Thank you for submitting to {journalName}. A confirmation has been sent to the
          corresponding author&rsquo;s email address.
        </p>
        <div className="mx-auto mt-7 max-w-xs rounded-sm border-2 accent-border bg-paper-shade px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Your tracking ID
          </p>
          <p className="mt-1 font-mono text-[1.4rem] font-semibold text-ink-900">
            {state.trackingId}
          </p>
        </div>
        <p className="mx-auto mt-5 max-w-md text-[13.5px] leading-relaxed text-ink-600">
          Keep this ID. You can check your submission&rsquo;s progress at any time using it
          together with your email address.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/track"
            className="rounded-sm accent-bg px-5 py-2.5 text-[13.5px] font-medium hover:opacity-90"
          >
            Track this submission
          </Link>
          <Link
            href={`/journals/${journalSlug}`}
            className="rounded-sm border border-ink-300 px-5 py-2.5 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade"
          >
            Back to the journal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="journalId" value={journalId} />
      <input type="hidden" name="coAuthors" value={JSON.stringify(coAuthors)} />

      {/* Step indicator */}
      <ol className="flex flex-wrap gap-x-1 gap-y-2 border-b border-paper-line pb-4">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-sm px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                i === step
                  ? 'accent-bg'
                  : i < step
                    ? 'text-ink-800 hover:bg-paper-shade'
                    : 'text-ink-400 hover:bg-paper-shade'
              }`}
            >
              <span className="mr-1.5 opacity-60">{i + 1}</span>
              {label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="px-0.5 text-ink-300" aria-hidden>
                ›
              </span>
            )}
          </li>
        ))}
      </ol>

      {state.status === 'error' && state.message && (
        <div className="flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      {/* ------------------------------------------------- 1. Manuscript */}
      <div className={step === 0 ? 'space-y-5' : 'hidden'}>
        <Field label="Article type" required error={state.fieldErrors?.articleType}>
          <select
            name="articleType"
            defaultValue={draft.articleType ?? 'RESEARCH'}
            onChange={onFieldChange}
            className={inputClass}
          >
            {Object.entries(ARTICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Manuscript title"
          required
          hint="The full title, exactly as it appears on your title page."
          error={state.fieldErrors?.manuscriptTitle}
        >
          <input
            type="text"
            name="manuscriptTitle"
            defaultValue={draft.manuscriptTitle}
            onChange={onFieldChange}
            className={inputClass}
          />
        </Field>

        <Field
          label="Abstract"
          required
          hint="Up to 300 words. Structured abstracts should keep their headings."
          error={state.fieldErrors?.abstract}
        >
          <textarea
            name="abstract"
            rows={9}
            defaultValue={draft.abstract}
            onChange={onFieldChange}
            className={inputClass}
          />
        </Field>

        <Field
          label="Keywords"
          required
          hint="Between four and eight, separated by commas."
          error={state.fieldErrors?.keywords}
        >
          <input
            type="text"
            name="keywords"
            placeholder="periodontitis, biofilm, randomised trial"
            defaultValue={draft.keywords}
            onChange={onFieldChange}
            className={inputClass}
          />
        </Field>
      </div>

      {/* ---------------------------------------------------- 2. Authors */}
      <div className={step === 1 ? 'space-y-6' : 'hidden'}>
        <div className="rounded-sm border border-paper-line bg-paper-shade p-5">
          <h3 className="font-serif text-[1.05rem] font-semibold text-ink-900">
            Corresponding author
          </h3>
          <p className="mt-1 text-[12.5px] text-ink-600">
            All correspondence about this manuscript goes to this address.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={state.fieldErrors?.correspondingAuthorName}>
              <input
                type="text"
                name="correspondingAuthorName"
                defaultValue={draft.correspondingAuthorName}
                onChange={onFieldChange}
                className={inputClass}
              />
            </Field>
            <Field label="Email" required error={state.fieldErrors?.correspondingAuthorEmail}>
              <input
                type="email"
                name="correspondingAuthorEmail"
                defaultValue={draft.correspondingAuthorEmail}
                onChange={onFieldChange}
                className={inputClass}
              />
            </Field>
            <Field
              label="Institutional affiliation"
              required
              error={state.fieldErrors?.correspondingAffiliation}
            >
              <input
                type="text"
                name="correspondingAffiliation"
                defaultValue={draft.correspondingAffiliation}
                onChange={onFieldChange}
                className={inputClass}
              />
            </Field>
            <Field label="Telephone">
              <input
                type="tel"
                name="correspondingAuthorPhone"
                defaultValue={draft.correspondingAuthorPhone}
                onChange={onFieldChange}
                className={inputClass}
              />
            </Field>
            <Field label="ORCID" hint="Recommended — it is required by many indexing services.">
              <input
                type="text"
                name="correspondingOrcid"
                placeholder="0000-0002-1825-0097"
                defaultValue={draft.correspondingOrcid}
                onChange={onFieldChange}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="font-serif text-[1.05rem] font-semibold text-ink-900">Co-authors</h3>
            <button
              type="button"
              onClick={() => {
                const next = [...coAuthors, { fullName: '', email: '', affiliation: '', orcid: '' }]
                setCoAuthors(next)
                persist(draft, next)
              }}
              className="inline-flex items-center gap-1.5 rounded-sm border border-ink-300 px-3 py-1.5 text-[13px] font-medium text-ink-800 hover:bg-paper-shade"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add co-author
            </button>
          </div>

          {coAuthors.length === 0 && (
            <p className="rounded-sm border border-dashed border-paper-line px-4 py-6 text-center text-[13px] text-ink-500">
              No co-authors added. If you are the sole author, continue to the next step.
            </p>
          )}

          <div className="space-y-3">
            {coAuthors.map((a, i) => (
              <div key={i} className="rounded-sm border border-paper-line bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">
                    Author {i + 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = coAuthors.filter((_, j) => j !== i)
                      setCoAuthors(next)
                      persist(draft, next)
                    }}
                    aria-label={`Remove author ${i + 2}`}
                    className="rounded-sm p-1 text-ink-400 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ['fullName', 'Full name'],
                      ['email', 'Email'],
                      ['affiliation', 'Affiliation'],
                      ['orcid', 'ORCID'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[12.5px] font-medium text-ink-700">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={a[key]}
                        onChange={(e) => {
                          const next = coAuthors.map((x, j) =>
                            j === i ? { ...x, [key]: e.target.value } : x,
                          )
                          setCoAuthors(next)
                          persist(draft, next)
                        }}
                        className="mt-1 w-full rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ 3. Files */}
      <div className={step === 2 ? 'space-y-5' : 'hidden'}>
        <Field
          label="Manuscript file"
          required
          hint="PDF or Word, up to 25 MB. Because review is double blind, remove author names from this file."
          error={state.fieldErrors?.manuscriptFile}
        >
          <input
            type="file"
            name="manuscriptFile"
            accept=".pdf,.doc,.docx"
            className="block w-full rounded-sm border border-dashed border-ink-300 bg-paper-shade px-4 py-6 text-[13.5px] file:mr-4 file:rounded-sm file:border-0 file:bg-ink-900 file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-white hover:file:bg-ink-800"
          />
        </Field>

        <Field label="Cover letter" hint="Optional but strongly encouraged. PDF or Word.">
          <input
            type="file"
            name="coverLetterFile"
            accept=".pdf,.doc,.docx"
            className="block w-full rounded-sm border border-dashed border-paper-line bg-white px-4 py-4 text-[13.5px] file:mr-4 file:rounded-sm file:border-0 file:bg-paper-shade file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink-800"
          />
        </Field>

        <Field label="Supplementary material" hint="Optional. Data, appendices or figures.">
          <input
            type="file"
            name="supplementaryFile"
            className="block w-full rounded-sm border border-dashed border-paper-line bg-white px-4 py-4 text-[13.5px] file:mr-4 file:rounded-sm file:border-0 file:bg-paper-shade file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink-800"
          />
        </Field>

        <p className="flex items-start gap-2 rounded-sm bg-paper-shade px-4 py-3 text-[12.5px] leading-relaxed text-ink-600">
          <Upload className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Files are uploaded when you submit at the end. Large files may take a moment.
        </p>
      </div>

      {/* ----------------------------------------------- 4. Declarations */}
      <div className={step === 3 ? 'space-y-4' : 'hidden'}>
        <p className="text-[14px] leading-relaxed text-ink-700">
          All four declarations must be accepted before a manuscript can be considered.
        </p>
        {DECLARATIONS.map((d) => (
          <label
            key={d.name}
            className="flex cursor-pointer items-start gap-3 rounded-sm border border-paper-line bg-white p-4 hover:bg-paper-shade"
          >
            <input
              type="checkbox"
              name={d.name}
              defaultChecked={draft[d.name] === 'on'}
              onChange={(e) => {
                const next = { ...draft, [d.name]: e.target.checked ? 'on' : '' }
                setDraft(next)
                persist(next, coAuthors)
              }}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="text-[13.5px] leading-relaxed text-ink-800">{d.label}</span>
          </label>
        ))}
        {state.fieldErrors?.declarationOriginal && (
          <p className="text-[12.5px] text-red-700">All declarations must be accepted.</p>
        )}
        <p className="rounded-sm bg-paper-shade px-4 py-3 text-[12.5px] leading-relaxed text-ink-600">
          <strong className="font-semibold text-ink-800">Article processing charges:</strong>{' '}
          {apcText}
        </p>
      </div>

      {/* ----------------------------------------------------- 5. Review */}
      <div className={step === 4 ? 'space-y-5' : 'hidden'}>
        <h3 className="font-serif text-[1.15rem] font-semibold text-ink-900">
          Check before submitting
        </h3>
        <dl className="divide-y divide-paper-line rounded-sm border border-paper-line bg-white">
          {[
            ['Journal', journalName],
            ['Article type', ARTICLE_TYPE_LABELS[draft.articleType ?? 'RESEARCH']],
            ['Title', draft.manuscriptTitle || '—'],
            ['Corresponding author', draft.correspondingAuthorName || '—'],
            ['Email', draft.correspondingAuthorEmail || '—'],
            ['Co-authors', coAuthors.length ? coAuthors.map((a) => a.fullName).join(', ') : 'None'],
            ['Keywords', draft.keywords || '—'],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-3">
              <dt className="text-[12.5px] text-ink-500">{label}</dt>
              <dd className="text-[13.5px] text-ink-900 sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[12.5px] leading-relaxed text-ink-600">
          Your file selections are shown on the Files step. Once you submit you will receive a
          tracking ID by email.
        </p>
        <SubmitButton />
      </div>

      {/* -------------------------------------------------- Step controls */}
      <div className="flex items-center justify-between border-t border-paper-line pt-5">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-sm border border-ink-300 px-4 py-2.5 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade disabled:invisible"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="inline-flex items-center gap-1.5 rounded-sm bg-ink-900 px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <p className="text-[12px] text-ink-500">
        Your progress is saved in this browser as you type, so you can close this page and come
        back to it.
      </p>
    </form>
  )
}
