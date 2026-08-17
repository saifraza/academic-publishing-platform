'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateSubmissionStatus, type StatusState } from '../actions'
import { SUBMISSION_STATUS_LABELS } from '@/lib/labels'
import { Check, AlertCircle } from 'lucide-react'

function Save() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Update status'}
    </button>
  )
}

export function StatusForm({ id, current }: { id: string; current: string }) {
  const [state, action] = useActionState<StatusState, FormData>(updateSubmissionStatus, {
    status: 'idle',
  })

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />

      {state.status === 'success' && (
        <p className="flex items-start gap-2 rounded-sm border border-green-300 bg-green-50 px-3 py-2 text-[12.5px] text-green-900">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}
      {state.status === 'error' && (
        <p className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="status" className="block text-[13px] font-medium text-ink-900">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={current}
          className="mt-1.5 w-full rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
        >
          {Object.entries(SUBMISSION_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-sm bg-paper-shade px-3 py-2.5">
        <input type="checkbox" name="notifyAuthor" defaultChecked className="mt-0.5 h-4 w-4" />
        <span className="text-[12.5px] leading-relaxed text-ink-800">
          Email the corresponding author about this change
        </span>
      </label>

      <Save />
    </form>
  )
}
