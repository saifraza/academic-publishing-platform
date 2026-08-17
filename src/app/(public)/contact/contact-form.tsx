'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { sendContactMessage, type ContactState } from './actions'
import { Check, AlertCircle } from 'lucide-react'

const inputClass =
  'mt-1.5 w-full rounded-sm border border-paper-line bg-white px-3 py-2.5 text-[14px] focus:border-ink-500'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-ink-900 px-6 py-3 text-[14px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? 'Sending…' : 'Send message'}
    </button>
  )
}

export function ContactForm() {
  const [state, action] = useActionState<ContactState, FormData>(sendContactMessage, {
    status: 'idle',
  })

  if (state.status === 'success') {
    return (
      <div className="rounded-sm border border-paper-line bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-900">
          <Check className="h-6 w-6 text-white" aria-hidden />
        </div>
        <h2 className="font-serif text-[1.3rem] font-semibold text-ink-900">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-ink-600">
          Thank you. The editorial office aims to respond within five working days.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4 rounded-sm border border-paper-line bg-white p-6">
      {state.status === 'error' && state.message && (
        <p className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-[13.5px] font-medium text-ink-900">
            Your name
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="text-[13.5px] font-medium text-ink-900">
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="text-[13.5px] font-medium text-ink-900">
          Subject
        </label>
        <input id="subject" name="subject" className={inputClass} />
      </div>

      <div>
        <label htmlFor="message" className="text-[13.5px] font-medium text-ink-900">
          Message
        </label>
        <textarea id="message" name="message" rows={7} required className={inputClass} />
      </div>

      {/* Honeypot — bots fill it, humans never see it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <Submit />
    </form>
  )
}
