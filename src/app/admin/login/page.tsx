import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Editor login' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-shade px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            aria-hidden
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-ink-900 font-serif text-xl font-semibold text-white"
          >
            M
          </span>
          <h1 className="font-serif text-[1.6rem] font-semibold text-ink-900">Editorial login</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-600">
            For editors and publishing staff only.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-ink-500">
          Authors do not need an account. To check a manuscript&rsquo;s progress, use{' '}
          <a href="/track" className="underline underline-offset-2 hover:text-ink-800">
            track a submission
          </a>
          .
        </p>
      </div>
    </div>
  )
}
