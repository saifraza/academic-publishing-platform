import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      journalIds: string[]
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    journalIds?: string[]
    fullName?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    journalIds?: string[]
    fullName?: string
  }
}
