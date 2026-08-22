import { db } from '@/lib/db'
import { requireUser } from '@/auth'
import { SettingsForm } from './settings-form'
import { Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

/** socials is stored as JSON; read one link out of it without trusting its shape. */
function socialLink(socials: unknown, key: string): string {
  if (socials && typeof socials === 'object' && !Array.isArray(socials)) {
    const value = (socials as Record<string, unknown>)[key]
    if (typeof value === 'string') return value
  }
  return ''
}

export default async function SiteSettingsPage() {
  const user = await requireUser()

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-sm border border-paper-line bg-white px-6 py-14 text-center">
          <Lock className="mx-auto h-6 w-6 text-ink-300" aria-hidden />
          <h1 className="mt-3 font-serif text-[1.3rem] font-semibold text-ink-900">
            Site settings are for administrators
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            These details apply to every journal, so only an administrator can change them. Ask
            whoever administers the site if something here needs updating.
          </p>
        </div>
      </div>
    )
  }

  // There is exactly one publisher record. If the database has not been seeded
  // yet, fall back to empty values rather than failing.
  const publisher = await db.publisher.findUnique({ where: { id: 'default' } })

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Site settings</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-600">
          The publisher&rsquo;s own details — the name, the description, the address readers write
          to, and the colour used across the site.
        </p>
      </header>

      <SettingsForm
        initial={{
          name: publisher?.name ?? '',
          shortName: publisher?.shortName ?? '',
          tagline: publisher?.tagline ?? '',
          about: publisher?.about ?? '',
          mission: publisher?.mission ?? '',
          vision: publisher?.vision ?? '',
          primaryColor: publisher?.primaryColor ?? '#0a2540',
          addressLine1: publisher?.addressLine1 ?? '',
          addressLine2: publisher?.addressLine2 ?? '',
          city: publisher?.city ?? '',
          state: publisher?.state ?? '',
          country: publisher?.country ?? 'India',
          postalCode: publisher?.postalCode ?? '',
          branchLabel: publisher?.branchLabel ?? '',
          branchAddressLine1: publisher?.branchAddressLine1 ?? '',
          branchAddressLine2: publisher?.branchAddressLine2 ?? '',
          branchCity: publisher?.branchCity ?? '',
          branchState: publisher?.branchState ?? '',
          branchCountry: publisher?.branchCountry ?? '',
          branchPostalCode: publisher?.branchPostalCode ?? '',
          email: publisher?.email ?? '',
          phone: publisher?.phone ?? '',
          linkedin: socialLink(publisher?.socials, 'linkedin'),
          twitter: socialLink(publisher?.socials, 'twitter'),
          facebook: socialLink(publisher?.socials, 'facebook'),
          registeredName: publisher?.registeredName ?? '',
          gstin: publisher?.gstin ?? '',
        }}
      />
    </div>
  )
}
