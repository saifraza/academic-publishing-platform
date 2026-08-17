'use client'

import { useActionState, useEffect, useId, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import {
  createVolume,
  createIssue,
  updateIssue,
  setIssuePublished,
  deleteIssue,
  type IssueFormState,
} from '@/app/admin/(dashboard)/issues/actions'
import { AlertCircle, Check, Plus, Trash2, X } from 'lucide-react'

// ----------------------------------------------------------------- the shapes

export type JournalChoice = { id: string; name: string }

export type VolumeChoice = {
  id: string
  journalName: string
  /** e.g. "Volume 12 (2026)" */
  label: string
}

export type IssueValues = {
  id: string
  volumeId: string
  number: number
  title: string
  /** yyyy-mm-dd, or '' when no date has been set */
  publishedAt: string
  isSpecialIssue: boolean
  specialIssueTitle: string
  isPublished: boolean
}

// ------------------------------------------------------------ shared styling

const input =
  'w-full rounded-sm border border-paper-line bg-white px-3 py-2 text-[13.5px] text-ink-900 placeholder:text-ink-400 focus:border-ink-500'

const primaryButton =
  'inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60'

const rowButton =
  'inline-flex items-center gap-1.5 rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade disabled:opacity-60'

const quietButton =
  'inline-flex items-center gap-1.5 rounded-sm border border-ink-300 px-4 py-2.5 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade disabled:opacity-60'

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
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

function Modal({
  title,
  hint,
  onClose,
  children,
}: {
  title: string
  hint?: string
  onClose: () => void
  children: React.ReactNode
}) {
  const headingId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink-950/50 p-4 sm:p-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="mx-auto w-full max-w-xl rounded-sm border border-paper-line bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-paper-line px-5 py-4">
          <div>
            <h2 id={headingId} className="font-serif text-[1.15rem] font-semibold text-ink-900">
              {title}
            </h2>
            {hint && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{hint}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-ink-500 hover:bg-paper-shade hover:text-ink-900"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

function Alert({ tone, children }: { tone: 'good' | 'bad'; children: React.ReactNode }) {
  const Icon = tone === 'good' ? Check : AlertCircle
  return (
    <p
      className={
        tone === 'good'
          ? 'flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13px] leading-relaxed text-green-900'
          : 'flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-800'
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

function FormFooter({ submitLabel, onClose }: { submitLabel: string; onClose: () => void }) {
  const { pending } = useFormStatus()
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-paper-line pt-4">
      <button type="button" onClick={onClose} disabled={pending} className={quietButton}>
        Cancel
      </button>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}

/** Shown in place of the form once the save has gone through. */
function Saved({
  message,
  againLabel,
  onAgain,
  onClose,
}: {
  message?: string
  againLabel?: string
  onAgain?: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-4">
      <Alert tone="good">{message}</Alert>
      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-paper-line pt-4">
        {againLabel && onAgain && (
          <button type="button" onClick={onAgain} className={quietButton}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {againLabel}
          </button>
        )}
        <button type="button" onClick={onClose} className={primaryButton}>
          Done
        </button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------- add a volume

function VolumeForm({
  journals,
  defaultJournalId,
  nextVolumeNumber,
  onAgain,
  onClose,
}: {
  journals: JournalChoice[]
  defaultJournalId?: string
  nextVolumeNumber: Record<string, number>
  onAgain: () => void
  onClose: () => void
}) {
  const [state, action] = useActionState<IssueFormState, FormData>(createVolume, {
    status: 'idle',
  })
  const [journalId, setJournalId] = useState(defaultJournalId ?? journals[0]?.id ?? '')

  if (state.status === 'success') {
    return (
      <Saved
        message={state.message}
        againLabel="Add another volume"
        onAgain={onAgain}
        onClose={onClose}
      />
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state.status === 'error' && state.message && <Alert tone="bad">{state.message}</Alert>}

      <Field
        label="Journal"
        required
        hint="The journal this volume belongs to."
        error={state.fieldErrors?.journalId}
      >
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Volume number"
          required
          hint="Volumes count up from 1 — Volume 12 follows Volume 11."
          error={state.fieldErrors?.number}
        >
          <input
            // Reset the suggestion when the publisher picks a different journal
            key={journalId}
            name="number"
            inputMode="numeric"
            defaultValue={nextVolumeNumber[journalId] ?? 1}
            className={input}
          />
        </Field>

        <Field
          label="Year"
          required
          hint="The year printed on the volume. Most journals run one volume per year."
          error={state.fieldErrors?.year}
        >
          <input
            name="year"
            inputMode="numeric"
            defaultValue={new Date().getFullYear()}
            className={input}
          />
        </Field>
      </div>

      <FormFooter submitLabel="Add volume" onClose={onClose} />
    </form>
  )
}

export function AddVolumeButton({
  journals,
  nextVolumeNumber,
  defaultJournalId,
  label = 'Add a volume',
  tone = 'primary',
}: {
  journals: JournalChoice[]
  nextVolumeNumber: Record<string, number>
  defaultJournalId?: string
  label?: string
  tone?: 'primary' | 'quiet'
}) {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={tone === 'primary' ? primaryButton : quietButton}
      >
        <Plus className="h-4 w-4" aria-hidden />
        {label}
      </button>

      {open && (
        <Modal
          title="Add a volume"
          hint="A volume is the yearly container for a journal's issues. Add the volume first, then add issues inside it."
          onClose={() => setOpen(false)}
        >
          <VolumeForm
            key={formKey}
            journals={journals}
            defaultJournalId={defaultJournalId}
            nextVolumeNumber={nextVolumeNumber}
            onAgain={() => setFormKey((k) => k + 1)}
            onClose={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  )
}

// ------------------------------------------------------- add / edit an issue

function IssueForm({
  volumes,
  nextIssueNumber,
  initial,
  defaultVolumeId,
  onAgain,
  onClose,
}: {
  volumes: VolumeChoice[]
  nextIssueNumber: Record<string, number>
  initial?: IssueValues
  defaultVolumeId?: string
  onAgain: () => void
  onClose: () => void
}) {
  const editing = Boolean(initial)
  const [state, action] = useActionState<IssueFormState, FormData>(
    editing ? updateIssue : createIssue,
    { status: 'idle' },
  )
  const [volumeId, setVolumeId] = useState(
    initial?.volumeId ?? defaultVolumeId ?? volumes[0]?.id ?? '',
  )
  const [special, setSpecial] = useState(initial?.isSpecialIssue ?? false)

  // Volumes are shown journal by journal, so the choice is never ambiguous
  const journalNames = Array.from(new Set(volumes.map((v) => v.journalName)))

  if (state.status === 'success') {
    return (
      <Saved
        message={state.message}
        againLabel={editing ? undefined : 'Add another issue'}
        onAgain={editing ? undefined : onAgain}
        onClose={onClose}
      />
    )
  }

  return (
    <form action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {state.status === 'error' && state.message && <Alert tone="bad">{state.message}</Alert>}

      <Field
        label="Volume"
        required
        hint="The volume this issue sits inside."
        error={state.fieldErrors?.volumeId}
      >
        <select
          name="volumeId"
          value={volumeId}
          onChange={(e) => setVolumeId(e.target.value)}
          className={input}
        >
          {journalNames.map((name) => (
            <optgroup key={name} label={name}>
              {volumes
                .filter((v) => v.journalName === name)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Issue number"
          required
          hint="Issues are numbered from 1 again in every new volume."
          error={state.fieldErrors?.number}
        >
          <input
            // Reset the suggestion when the publisher picks a different volume
            key={editing ? 'edit' : volumeId}
            name="number"
            inputMode="numeric"
            defaultValue={initial?.number ?? nextIssueNumber[volumeId] ?? 1}
            className={input}
          />
        </Field>

        <Field
          label="Publication date"
          hint="The date printed on the issue. Readers see it on the issue page."
          error={state.fieldErrors?.publishedAt}
        >
          <input
            type="date"
            name="publishedAt"
            defaultValue={initial?.publishedAt ?? ''}
            className={input}
          />
        </Field>
      </div>

      <Field
        label="Issue title"
        hint="Optional. Most issues need no title — leave this blank unless this one has a name of its own."
        error={state.fieldErrors?.title}
      >
        <input
          name="title"
          defaultValue={initial?.title ?? ''}
          placeholder="Usually left blank"
          className={input}
        />
      </Field>

      <div className="rounded-sm bg-paper-shade px-3.5 py-3">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            name="isSpecialIssue"
            checked={special}
            onChange={(e) => setSpecial(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-[13px] text-ink-800">
            <span className="font-medium">This is a special issue</span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500">
              Tick this when the whole issue is devoted to one theme, such as a conference or a
              guest-edited collection.
            </span>
          </span>
        </label>

        {special && (
          <div className="mt-3.5 border-t border-paper-line pt-3.5">
            <Field
              label="Special issue theme"
              required
              hint="Shown to readers above the article list, exactly as you type it."
              error={state.fieldErrors?.specialIssueTitle}
            >
              <input
                name="specialIssueTitle"
                defaultValue={initial?.specialIssueTitle ?? ''}
                placeholder="Advances in Regenerative Endodontics"
                className={input}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="rounded-sm border border-paper-line px-3.5 py-3">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={initial?.isPublished ?? false}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-[13px] text-ink-800">
            <span className="font-medium">Show this issue on the public site</span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500">
              This box controls the issue page only. Each article keeps its own published or draft
              setting. To put an issue live together with every article in it, close this window and
              use <strong>Publish issue</strong> on the issue’s row instead.
            </span>
          </span>
        </label>
      </div>

      <FormFooter submitLabel={editing ? 'Save issue' : 'Add issue'} onClose={onClose} />
    </form>
  )
}

export function AddIssueButton({
  volumes,
  nextIssueNumber,
  defaultVolumeId,
  label = 'Add an issue',
  tone = 'quiet',
}: {
  volumes: VolumeChoice[]
  nextIssueNumber: Record<string, number>
  defaultVolumeId?: string
  label?: string
  tone?: 'primary' | 'quiet'
}) {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={tone === 'primary' ? primaryButton : quietButton}
      >
        <Plus className="h-4 w-4" aria-hidden />
        {label}
      </button>

      {open && (
        <Modal
          title="Add an issue"
          hint="Issues hold the articles. Nothing here goes on the public site until you say so."
          onClose={() => setOpen(false)}
        >
          <IssueForm
            key={formKey}
            volumes={volumes}
            nextIssueNumber={nextIssueNumber}
            defaultVolumeId={defaultVolumeId}
            onAgain={() => setFormKey((k) => k + 1)}
            onClose={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  )
}

export function EditIssueButton({
  issue,
  volumes,
  nextIssueNumber,
}: {
  issue: IssueValues
  volumes: VolumeChoice[]
  nextIssueNumber: Record<string, number>
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={rowButton}>
        Edit
      </button>

      {open && (
        <Modal
          title="Edit this issue"
          hint="Changes here affect the issue itself. The articles inside it are not touched."
          onClose={() => setOpen(false)}
        >
          <IssueForm
            volumes={volumes}
            nextIssueNumber={nextIssueNumber}
            initial={issue}
            onAgain={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  )
}

// ------------------------------------------------- publish / unpublish / bin

export function PublishIssueButton({
  id,
  label,
  isPublished,
  articleCount,
  draftArticleCount,
}: {
  id: string
  /** e.g. "Volume 12, Issue 3" */
  label: string
  isPublished: boolean
  articleCount: number
  draftArticleCount: number
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function confirm() {
    setError('')
    startTransition(async () => {
      const result = await setIssuePublished(id, !isPublished)
      if (result.ok) setOpen(false)
      else setError(result.message)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          isPublished
            ? rowButton
            : 'inline-flex items-center gap-1.5 rounded-sm bg-ink-900 px-2.5 py-1 text-[12.5px] font-medium text-white hover:bg-ink-800'
        }
      >
        {isPublished ? 'Take offline' : 'Publish issue'}
      </button>

      {open && (
        <Modal
          title={isPublished ? `Take ${label} off the public site?` : `Publish ${label}?`}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            {isPublished ? (
              <>
                <p className="text-[13.5px] leading-relaxed text-ink-800">
                  The issue page will disappear from the public site straight away.
                </p>
                <p className="rounded-sm bg-paper-shade px-3.5 py-3 text-[13px] leading-relaxed text-ink-700">
                  <strong>The articles in it stay published.</strong> Taking an issue offline never
                  unpublishes its articles — all{' '}
                  {articleCount === 0 ? 'of them' : plural(articleCount, 'article')} keep their own
                  web address and stay readable. To take an article down, do that on the{' '}
                  <Link href="/admin/articles" className="underline underline-offset-2">
                    Articles
                  </Link>{' '}
                  screen, one article at a time.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13.5px] leading-relaxed text-ink-800">
                  This publishes the issue <strong>and every article in it</strong>, in one step.
                </p>
                <p className="rounded-sm bg-paper-shade px-3.5 py-3 text-[13px] leading-relaxed text-ink-700">
                  {articleCount === 0 ? (
                    <>
                      This issue has no articles in it yet, so only the issue page itself will
                      appear. You can add articles to it afterwards.
                    </>
                  ) : (
                    <>
                      All {plural(articleCount, 'article')} in this issue will go live at the same
                      moment
                      {draftArticleCount > 0 ? (
                        <>
                          {' '}
                          — including the {draftArticleCount} still marked as{' '}
                          {draftArticleCount === 1 ? 'a draft' : 'drafts'}
                        </>
                      ) : null}
                      . Anything not ready should be moved out of the issue first.
                    </>
                  )}
                </p>
              </>
            )}

            {error && <Alert tone="bad">{error}</Alert>}

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-paper-line pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className={quietButton}
              >
                Cancel
              </button>
              <button type="button" onClick={confirm} disabled={pending} className={primaryButton}>
                {pending
                  ? 'Working…'
                  : isPublished
                    ? 'Take the issue offline'
                    : 'Publish the issue and its articles'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export function DeleteIssueButton({
  id,
  label,
  articleCount,
}: {
  id: string
  label: string
  articleCount: number
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const blocked = articleCount > 0

  function confirm() {
    setError('')
    startTransition(async () => {
      const result = await deleteIssue(id)
      if (result.ok) setOpen(false)
      else setError(result.message)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${label}`}
        className="rounded-sm border border-paper-line px-2 py-1 text-ink-500 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open && (
        <Modal
          title={blocked ? `${label} cannot be deleted yet` : `Delete ${label}?`}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            {blocked ? (
              <>
                <p className="text-[13.5px] leading-relaxed text-ink-800">
                  This issue still holds {plural(articleCount, 'article')}. Deleting it would leave
                  those articles without a home, so it is not allowed.
                </p>
                <p className="rounded-sm bg-paper-shade px-3.5 py-3 text-[13px] leading-relaxed text-ink-700">
                  Move the articles first: open each one on the{' '}
                  <Link href="/admin/articles" className="underline underline-offset-2">
                    Articles
                  </Link>{' '}
                  screen and either choose a different issue or set it to{' '}
                  <strong>Not in an issue</strong>. Once this issue is empty, come back and delete
                  it.
                </p>
              </>
            ) : (
              <p className="text-[13.5px] leading-relaxed text-ink-800">
                This issue is empty, so no articles will be affected. Deleting it cannot be undone.
              </p>
            )}

            {error && <Alert tone="bad">{error}</Alert>}

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-paper-line pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className={blocked ? primaryButton : quietButton}
              >
                {blocked ? 'Close' : 'Cancel'}
              </button>
              {!blocked && (
                <button
                  type="button"
                  onClick={confirm}
                  disabled={pending}
                  className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-red-700 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-red-800 disabled:opacity-60"
                >
                  {pending ? 'Deleting…' : 'Delete this issue'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
