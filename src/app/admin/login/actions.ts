'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? '').toLowerCase(),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/admin',
    })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'That email and password combination was not recognised.' }
    }
    // signIn throws a redirect on success — let it through
    throw error
  }
}
