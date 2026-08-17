'use client'

import { useState, useTransition } from 'react'
import { saveInternalNotes } from '../actions'
import { Check } from 'lucide-react'

export function NotesForm({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-sm border border-paper-line bg-white p-5">
      <h2 className="font-serif text-[1.05rem] font-semibold text-ink-900">Internal notes</h2>
      <p className="mt-1 text-[12.5px] text-ink-500">
        Only editors see these. Authors never do.
      </p>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value)
          setSaved(false)
        }}
        rows={5}
        placeholder="Reviewer invitations sent, decisions taken, anything the next editor should know…"
        className="mt-3 w-full rounded-sm border border-paper-line px-3 py-2.5 text-[13.5px]"
      />
      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveInternalNotes(id, notes)
              setSaved(true)
            })
          }
          className="rounded-sm border border-ink-300 px-4 py-2 text-[13px] font-medium text-ink-800 hover:bg-paper-shade disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save notes'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-green-800">
            <Check className="h-3.5 w-3.5" aria-hidden />
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
