'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, type LoginState } from './actions'
import { AlertCircle } from 'lucide-react'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm bg-ink-900 px-4 py-3 text-[14px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={action} className="space-y-4 rounded-sm border border-paper-line bg-white p-6">
      {state.error && (
        <p className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="text-[13.5px] font-medium text-ink-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-sm border border-paper-line px-3 py-2.5 text-[14px] focus:border-ink-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-[13.5px] font-medium text-ink-900">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-sm border border-paper-line px-3 py-2.5 text-[14px] focus:border-ink-500"
        />
      </div>

      <Submit />
    </form>
  )
}
