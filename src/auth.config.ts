import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe half of the auth config. The middleware runs on the edge runtime
 * where Prisma and bcrypt are unavailable, so the Credentials provider — which
 * needs both — lives in auth.ts instead.
 */
export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
  // Railway terminates TLS at its proxy and forwards the request, so Auth.js
  // sees a host it did not originate and rejects it with UntrustedHost unless
  // this is set. NEXTAUTH_URL pins what the callback URL is allowed to be.
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user)
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isOnLogin = nextUrl.pathname === '/admin/login'

      if (isOnLogin) return true
      if (isOnAdmin) return isLoggedIn
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.journalIds = (user as { journalIds?: string[] }).journalIds
        token.fullName = (user as { fullName?: string }).fullName
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.role = (token.role as string) ?? 'EDITOR'
        session.user.journalIds = (token.journalIds as string[]) ?? []
        session.user.name = (token.fullName as string) ?? session.user.name
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
