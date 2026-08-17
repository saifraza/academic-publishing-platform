'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveReviewer, type ReviewerFormState } from '@/app/admin/(dashboard)/reviewers/actions'
import { AlertCircle, Check, Plus, X } from 'lucide-react'

export type ReviewerInitial = {
  id?: string
  fullName?: string
  email?: string
  affiliation?: string
  country?: string
  orcid?: string | null
  expertise?: string[]
  isActive?: boolean
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

function SaveBar({ isActive, isNew }: { isActive: boolean; isNew: boolean }) {
  const { pending } = useFormStatus()
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper-line bg-white px-6 py-3.5 lg:-mx-8 lg:px-8">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input type="checkbox" name="isActive" defaultChecked={isActive} className="h-4 w-4" />
        <span className="text-[13.5px] text-ink-800">
          <span className="font-medium">Available to review</span>
          <span className="block text-[12px] text-ink-500">
            Untick if they have asked for a break — their past reviews are kept either way.
          </span>
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink-900 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : isNew ? 'Add reviewer' : 'Save changes'}
      </button>
    </div>
  )
}

export function ReviewerForm({ initial }: { initial: ReviewerInitial }) {
  const router = useRouter()
  const [state, action] = useActionState<ReviewerFormState, FormData>(saveReviewer, {
    status: 'idle',
  })

  const isNew = !initial.id
  const [tags, setTags] = useState<string[]>(initial.expertise ?? [])
  const [draft, setDraft] = useState('')

  // After adding someone, move to their own page so a second save updates the
  // same reviewer instead of tripping the duplicate-email check.
  useEffect(() => {
    if (isNew && state.status === 'success' && state.reviewerId) {
      router.replace(`/admin/reviewers/${state.reviewerId}`)
    }
  }, [isNew, state.status, state.reviewerId, router])

  // After a rejected save the browser clears the form, so put back whatever the
  // publisher had typed rather than making them start again.
  const kept = state.status === 'error' ? state.values : undefined
  const keep = (name: string, fallback?: string | null) => kept?.[name] ?? fallback ?? ''

  function addTag(raw: string) {
    const value = raw.replace(/,/g, ' ').trim()
    if (!value) return
    setTags((prev) =>
      prev.some((t) => t.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value],
    )
    setDraft('')
  }

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="expertise" value={JSON.stringify(tags)} />

      {state.status === 'success' && (
        <div className="flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      {state.status === 'error' && state.message && (
        <div className="flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      {/* --------------------------------------------------------- Who they are */}
      <Section
        title="Who they are"
        hint="These details are only ever seen by the editorial office, never by authors."
      >
        <Field label="Full name" required error={state.fieldErrors?.fullName}>
          <input
            name="fullName"
            defaultValue={keep('fullName', initial.fullName)}
            placeholder="Dr Anand Verma"
            className={input}
          />
        </Field>

        <Field
          label="Email"
          required
          hint="Review invitations are sent here. Each reviewer must have their own address — it is what tells one reviewer from another."
          error={state.fieldErrors?.email}
        >
          <input
            name="email"
            type="email"
            defaultValue={keep('email', initial.email)}
            placeholder="a.verma@university.edu"
            className={input}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Affiliation" hint="Their department and institution.">
            <input
              name="affiliation"
              defaultValue={keep('affiliation', initial.affiliation)}
              placeholder="Department of Oral Pathology, …"
              className={input}
            />
          </Field>

          <Field
            label="Country"
            hint="Helpful when you need reviewers from outside the authors' own country."
          >
            <input
              name="country"
              defaultValue={keep('country', initial.country)}
              placeholder="India"
              className={input}
            />
          </Field>
        </div>

        <Field
          label="ORCID"
          hint="A researcher's permanent ID, e.g. 0000-0002-1825-0097. Optional, but it makes it easy to check their published work."
          error={state.fieldErrors?.orcid}
        >
          <input
            name="orcid"
            defaultValue={keep('orcid', initial.orcid)}
            placeholder="0000-0002-1825-0097"
            className={input}
          />
        </Field>
      </Section>

      {/* ------------------------------------------------------------ Expertise */}
      <Section
        title="Subjects they can review"
        hint="Add one subject at a time. These are what you search by when you are looking for the right reviewer for a manuscript."
      >
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <li
                key={`${tag}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-paper-line bg-paper-shade py-1 pl-2.5 pr-1.5 text-[12.5px] text-ink-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove ${tag}`}
                  className="rounded-sm p-0.5 text-ink-500 hover:bg-white hover:text-red-700"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag(draft)
              } else if (e.key === 'Backspace' && draft === '') {
                setTags((prev) => prev.slice(0, -1))
              }
            }}
            onBlur={() => addTag(draft)}
            placeholder="Periodontics"
            aria-label="Add a subject"
            className="min-w-48 flex-1 rounded-sm border border-paper-line bg-white px-3 py-2 text-[13.5px] placeholder:text-ink-400 focus:border-ink-500"
          />
          <button
            type="button"
            onClick={() => addTag(draft)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-ink-300 px-3 py-2 text-[13px] font-medium text-ink-800 hover:bg-paper-shade"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add subject
          </button>
        </div>

        <p className="text-[12px] text-ink-500">
          Type a subject and press Enter, or use the button. Click the small cross on a subject to
          take it off the list.
        </p>
      </Section>

      <SaveBar
        isActive={kept ? kept.isActive === 'on' : (initial.isActive ?? true)}
        isNew={isNew}
      />

      <p className="text-center text-[12.5px] text-ink-500">
        <Link href="/admin/reviewers" className="underline underline-offset-2 hover:text-ink-800">
          Back to all reviewers
        </Link>
      </p>
    </form>
  )
}
