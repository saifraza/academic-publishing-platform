import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { authConfig } from '@/auth.config'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        })
        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        // Editors and admins only — authors and reviewers have no admin access
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'EDITOR') return null

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          fullName: user.fullName,
          role: user.role,
          journalIds: user.journalIds,
        }
      },
    }),
  ],
})

/** Throws if there is no session — use at the top of every admin server action. */
export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'SUPER_ADMIN') throw new Error('Not authorised')
  return user
}

/** An editor may only touch journals they have been assigned to. */
export async function canEditJournal(journalId: string): Promise<boolean> {
  const user = await requireUser()
  if (user.role === 'SUPER_ADMIN') return true
  return (user.journalIds ?? []).includes(journalId)
}
