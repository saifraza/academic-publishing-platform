'use client'

import { useState, useTransition } from 'react'
import { setReviewerActive, deleteReviewer } from './actions'
import { Trash2, X } from 'lucide-react'

export function AvailabilityToggle({
  id,
  fullName,
  isActive,
}: {
  id: string
  fullName: string
  isActive: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setReviewerActive(id, !isActive)
        })
      }
      aria-label={
        isActive
          ? `Mark ${fullName} as unavailable for new reviews`
          : `Mark ${fullName} as available for new reviews`
      }
      title={
        isActive
          ? 'Keeps their record but stops them being suggested for new reviews'
          : 'Makes them available for new reviews again'
      }
      className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade disabled:opacity-50"
    >
      {pending ? 'Working…' : isActive ? 'Mark unavailable' : 'Mark available'}
    </button>
  )
}

/**
 * Deleting is permanent and also removes the reviewer's past review records, so
 * the publisher has to type the name first — the same guard used for articles.
 */
export function DeleteReviewer({
  id,
  fullName,
  assignmentCount,
}: {
  id: string
  fullName: string
  assignmentCount: number
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [pending, startTransition] = useTransition()

  const matches = typed.trim() === fullName.trim()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${fullName}`}
        className="rounded-sm border border-paper-line px-2 py-1 text-ink-500 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    )
  }

  return (
    <div className="w-full rounded-sm border border-red-200 bg-red-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] leading-relaxed text-red-900">
          {assignmentCount > 0 ? (
            <>
              Deleting {fullName} also erases {assignmentCount}{' '}
              {assignmentCount === 1 ? 'review record' : 'review records'}, including the comments
              they wrote. If they have simply stopped reviewing, mark them unavailable instead.
            </>
          ) : (
            <>This deletes {fullName} for good. There is no undo.</>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setTyped('')
          }}
          aria-label="Cancel"
          className="shrink-0 rounded-sm p-1 text-red-700 hover:bg-red-100"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <label className="mt-2.5 block text-[12px] font-medium text-red-900">
        Type <span className="font-semibold">{fullName}</span> to confirm
      </label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={fullName}
          className="min-w-48 flex-1 rounded-sm border border-red-300 bg-white px-2.5 py-1.5 text-[13px]"
        />
        <button
          type="button"
          disabled={!matches || pending}
          onClick={() =>
            startTransition(async () => {
              await deleteReviewer(id, typed)
            })
          }
          className="rounded-sm bg-red-700 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-red-800 disabled:opacity-40"
        >
          {pending ? 'Deleting…' : 'Delete permanently'}
        </button>
      </div>
    </div>
  )
}
