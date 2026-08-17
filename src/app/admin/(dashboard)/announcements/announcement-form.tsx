'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import {
  saveAnnouncement,
  type AnnouncementFormState,
} from '@/app/admin/(dashboard)/announcements/actions'
import { AlertCircle, Check, ExternalLink } from 'lucide-react'

type JournalOption = { id: string; name: string }

export type AnnouncementInitial = {
  id?: string
  journalId?: string | null
  title?: string
  body?: string
  publishedAt?: string
  expiresAt?: string
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

function SaveBar({ isPublished }: { isPublished: boolean }) {
  const { pending } = useFormStatus()
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper-line bg-white px-6 py-3.5 lg:-mx-8 lg:px-8">
      <label className="flex cursor-pointer items-center gap-2.5">
        <input type="checkbox" name="isPublished" defaultChecked={isPublished} className="h-4 w-4" />
        <span className="text-[13.5px] text-ink-800">
          <span className="font-medium">Show this announcement</span>
          <span className="block text-[12px] text-ink-500">
            Untick to take it off the site without deleting it.
          </span>
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink-900 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save announcement'}
      </button>
    </div>
  )
}

export function AnnouncementForm({
  initial,
  journals,
}: {
  initial: AnnouncementInitial
  journals: JournalOption[]
}) {
  const [state, action] = useActionState<AnnouncementFormState, FormData>(saveAnnouncement, {
    status: 'idle',
  })

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {state.status === 'success' && (
        <div className="flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {state.message}{' '}
            <a
              href="/announcements"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
            >
              See the announcements page <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </span>
        </div>
      )}

      {state.status === 'error' && state.message && (
        <div className="flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      <Section title="The announcement">
        <Field
          label="Which journal is this about?"
          hint="Leave as “All journals” for news from the publisher as a whole — it then appears on the home page rather than on one journal."
        >
          <select name="journalId" defaultValue={initial.journalId ?? ''} className={input}>
            <option value="">All journals (from the publisher)</option>
            {journals.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title" required error={state.fieldErrors?.title}>
          <input
            name="title"
            defaultValue={initial.title}
            placeholder="Call for papers: special issue on…"
            className={input}
          />
        </Field>

        <Field
          label="Announcement"
          required
          error={state.fieldErrors?.body}
          hint="Plain text — it appears exactly as you type it. Include any deadline and who to contact."
        >
          <textarea name="body" rows={8} defaultValue={initial.body} className={input} />
        </Field>
      </Section>

      <Section title="Dates">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Date on the announcement"
            error={state.fieldErrors?.publishedAt}
            hint="Shown next to the title, and used to order the list. Leave blank for today."
          >
            <input
              type="date"
              name="publishedAt"
              defaultValue={initial.publishedAt}
              className={input}
            />
          </Field>

          <Field
            label="Relevant until"
            error={state.fieldErrors?.expiresAt}
            hint="Optional. A reminder of when this stops being current — to take it off the site, untick “Show this announcement” below."
          >
            <input
              type="date"
              name="expiresAt"
              defaultValue={initial.expiresAt}
              className={input}
            />
          </Field>
        </div>
      </Section>

      <SaveBar isPublished={initial.isPublished ?? true} />

      <p className="text-center text-[12.5px] text-ink-500">
        <Link
          href="/admin/announcements"
          className="underline underline-offset-2 hover:text-ink-800"
        >
          Back to all announcements
        </Link>
      </p>
    </form>
  )
}
