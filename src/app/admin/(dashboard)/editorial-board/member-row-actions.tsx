'use client'

import { useState, useTransition } from 'react'
import {
  reorderEditorialMember,
  setMemberActive,
  deleteEditorialMember,
} from './actions'
import { ChevronUp, ChevronDown, Trash2, X } from 'lucide-react'

/** Up and down arrows that move one person within their own role group. */
export function MoveButtons({
  id,
  fullName,
  canMoveUp,
  canMoveDown,
}: {
  id: string
  fullName: string
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const [pending, startTransition] = useTransition()

  const move = (direction: 'up' | 'down') =>
    startTransition(async () => {
      await reorderEditorialMember(id, direction)
    })

  const style =
    'rounded-sm border border-paper-line p-1 text-ink-600 hover:bg-paper-shade disabled:opacity-25 disabled:hover:bg-transparent'

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => move('up')}
        disabled={!canMoveUp || pending}
        aria-label={`Move ${fullName} higher up this group`}
        className={style}
      >
        <ChevronUp className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => move('down')}
        disabled={!canMoveDown || pending}
        aria-label={`Move ${fullName} further down this group`}
        className={style}
      >
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}

export function ActiveToggle({
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
          await setMemberActive(id, !isActive)
        })
      }
      aria-label={
        isActive
          ? `Hide ${fullName} from the public page`
          : `Put ${fullName} back on the public page`
      }
      title={
        isActive
          ? 'Keeps their details but removes them from the public page'
          : 'Puts them back on the public page'
      }
      className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade disabled:opacity-50"
    >
      {pending
        ? 'Working…'
        : isActive
          ? `Hide ${fullName.split(' ')[0]}`
          : 'Put back on the page'}
    </button>
  )
}

/**
 * Removing someone is permanent, so the publisher has to type their name first —
 * the same guard used when deleting an article.
 */
export function DeleteMember({ id, fullName }: { id: string; fullName: string }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [pending, startTransition] = useTransition()

  const matches = typed.trim() === fullName.trim()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Remove ${fullName} from the board`}
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
          This removes {fullName} for good. If they have simply stepped down, hide them instead —
          that keeps the record.
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
              await deleteEditorialMember(id, typed)
            })
          }
          className="rounded-sm bg-red-700 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-red-800 disabled:opacity-40"
        >
          {pending ? 'Removing…' : 'Remove permanently'}
        </button>
      </div>
    </div>
  )
}
