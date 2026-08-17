'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  saveEditorialMember,
  type MemberFormState,
} from '@/app/admin/(dashboard)/editorial-board/actions'
import { DESIGNATION_LABELS, DESIGNATION_ORDER } from '@/lib/labels'
import { AlertCircle, Check, ExternalLink } from 'lucide-react'

type JournalOption = { id: string; name: string; slug: string }

export type MemberInitial = {
  id?: string
  journalId?: string | null
  fullName?: string
  designation?: string
  affiliation?: string
  country?: string
  email?: string | null
  orcid?: string | null
  profileUrl?: string | null
  bio?: string
  photoUrl?: string | null
  sortOrder?: number
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
          <span className="font-medium">Currently serving</span>
          <span className="block text-[12px] text-ink-500">
            Untick to take them off the public page without deleting their details.
          </span>
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink-900 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : isNew ? 'Add to the board' : 'Save changes'}
      </button>
    </div>
  )
}

export function EditorialMemberForm({
  initial,
  journals,
  canManagePublisherLevel,
}: {
  initial: MemberInitial
  /** Only the journals this person is allowed to edit. */
  journals: JournalOption[]
  canManagePublisherLevel: boolean
}) {
  const router = useRouter()
  const [state, action] = useActionState<MemberFormState, FormData>(saveEditorialMember, {
    status: 'idle',
  })

  const isNew = !initial.id
  const [journalId, setJournalId] = useState(
    initial.journalId ?? (canManagePublisherLevel ? '' : (journals[0]?.id ?? '')),
  )

  const selectedJournal = journals.find((j) => j.id === journalId)

  // After a rejected save the browser clears the form, so put back whatever the
  // publisher had typed rather than making them start again.
  const kept = state.status === 'error' ? state.values : undefined
  const keep = (name: string, fallback?: string | null) => kept?.[name] ?? fallback ?? ''

  // After adding someone, move to their edit page so a second save updates
  // the same person instead of creating a duplicate.
  useEffect(() => {
    if (isNew && state.status === 'success' && state.memberId) {
      router.replace(`/admin/editorial-board/${state.memberId}`)
    }
  }, [isNew, state.status, state.memberId, router])

  return (
    <form action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {state.status === 'success' && (
        <div className="flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {state.message}
            {selectedJournal && (
              <>
                {' '}
                <a
                  href={`/journals/${selectedJournal.slug}/editorial-board`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  See the public board <ExternalLink className="h-3 w-3" aria-hidden />
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

      {/* ------------------------------------------------------ Where they sit */}
      <Section
        title="Where this person is listed"
        hint="Most people sit on the board of one journal. Choose “all journals” only for someone who works across the whole publishing house, such as a managing editor."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Journal" required error={state.fieldErrors?.journalId}>
            {/*
              The browser wipes the form after a rejected save, and a dropdown
              only honours a new default when it is remounted — hence the key.
              Without it the journal would silently snap back to the first
              option while the publisher believed their choice had stuck.
            */}
            <select
              key={`journal-${keep('journalId', initial.journalId)}`}
              name="journalId"
              defaultValue={keep('journalId', initial.journalId)}
              onChange={(e) => setJournalId(e.target.value)}
              className={input}
            >
              {canManagePublisherLevel && (
                <option value="">All journals (publisher-wide)</option>
              )}
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Role on the board"
            required
            hint="This decides which heading they appear under on the public page."
            error={state.fieldErrors?.designation}
          >
            <select
              key={`designation-${keep('designation', initial.designation) || 'BOARD_MEMBER'}`}
              name="designation"
              defaultValue={keep('designation', initial.designation) || 'BOARD_MEMBER'}
              className={input}
            >
              {DESIGNATION_ORDER.map((value) => (
                <option key={value} value={value}>
                  {DESIGNATION_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {!canManagePublisherLevel && (
          <p className="rounded-sm bg-paper-shade px-3.5 py-2.5 text-[12.5px] text-ink-600">
            You can only add people to the journals you look after. An administrator handles
            publisher-wide appointments.
          </p>
        )}
      </Section>

      {/* --------------------------------------------------------- Who they are */}
      <Section title="Who they are">
        <Field
          label="Full name"
          required
          hint="Exactly as it should read in print, including any title such as Prof. or Dr."
          error={state.fieldErrors?.fullName}
        >
          <input
            name="fullName"
            defaultValue={keep('fullName', initial.fullName)}
            placeholder="Prof. Priya Ramaswamy"
            className={input}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Affiliation"
            hint="Their department and institution, as they would like it shown."
          >
            <input
              name="affiliation"
              defaultValue={keep('affiliation', initial.affiliation)}
              placeholder="Department of Prosthodontics, King George's Medical University"
              className={input}
            />
          </Field>

          <Field label="Country" hint="Where that institution is based.">
            <input
              name="country"
              defaultValue={keep('country', initial.country)}
              placeholder="India"
              className={input}
            />
          </Field>
        </div>

        <Field
          label="Short biography"
          hint="Two or three sentences at most — it is shown under their name on the public page. Leave blank if you would rather list only the affiliation."
        >
          <textarea
            name="bio"
            rows={4}
            defaultValue={keep('bio', initial.bio)}
            className={input}
          />
        </Field>
      </Section>

      {/* ------------------------------------------------------------- Contact */}
      <Section
        title="Contact and links"
        hint="All optional. Anything you fill in here appears on the public board page, so only add what the person is happy to make public."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            hint="Used by the editorial office. It is not shown as a clickable link on the public page."
            error={state.fieldErrors?.email}
          >
            <input
              name="email"
              type="email"
              defaultValue={keep('email', initial.email)}
              className={input}
            />
          </Field>

          <Field
            label="ORCID"
            hint="A researcher's permanent ID, e.g. 0000-0002-1825-0097. Ask them for it — it links their profile to their published work."
            error={state.fieldErrors?.orcid}
          >
            <input
              name="orcid"
              defaultValue={keep('orcid', initial.orcid)}
              placeholder="0000-0002-1825-0097"
              className={input}
            />
          </Field>

          <Field
            label="Personal or university page"
            hint="A link readers can follow to find out more. Paste the whole address, starting with https://"
            error={state.fieldErrors?.profileUrl}
          >
            <input
              name="profileUrl"
              defaultValue={keep('profileUrl', initial.profileUrl)}
              placeholder="https://university.edu/staff/ramaswamy"
              className={input}
            />
          </Field>

          <Field
            label="Photograph"
            hint="A web address for their photo. Leave blank if you do not have one."
            error={state.fieldErrors?.photoUrl}
          >
            <input
              name="photoUrl"
              defaultValue={keep('photoUrl', initial.photoUrl)}
              placeholder="https://…/photo.jpg"
              className={input}
            />
          </Field>
        </div>
      </Section>

      {/* --------------------------------------------------------------- Order */}
      <Section title="Position in the list">
        <Field
          label="Order within their role"
          hint="Lower numbers appear first, among the people holding the same role on the same journal. Leave blank to put them at the end — you can move them up or down from the board list afterwards."
        >
          <input
            name="sortOrder"
            type="number"
            defaultValue={keep('sortOrder', initial.sortOrder?.toString())}
            placeholder="Leave blank for last"
            className={input}
          />
        </Field>
      </Section>

      <SaveBar
        isActive={kept ? kept.isActive === 'on' : (initial.isActive ?? true)}
        isNew={isNew}
      />

      <p className="text-center text-[12.5px] text-ink-500">
        <Link
          href="/admin/editorial-board"
          className="underline underline-offset-2 hover:text-ink-800"
        >
          Back to the editorial board
        </Link>
      </p>
    </form>
  )
}
