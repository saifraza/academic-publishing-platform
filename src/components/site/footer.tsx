import Link from 'next/link'
import { db } from '@/lib/db'

export async function SiteFooter() {
  const [publisher, journals, policyPages] = await Promise.all([
    db.publisher.findFirst(),
    db.journal.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true, issnOnline: true },
    }),
    db.page.findMany({
      where: { journalId: null, isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, title: true },
    }),
  ])

  return (
    <footer className="no-print mt-20 border-t border-paper-line bg-ink-950 text-ink-200">
      <div className="shell py-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="font-serif text-lg font-semibold text-white">{publisher?.name}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-300">{publisher?.tagline}</p>
            <address className="mt-4 not-italic text-[13px] leading-relaxed text-ink-300">
              {publisher?.addressLine2}
              <br />
              {publisher?.city}, {publisher?.state}
              <br />
              {publisher?.country} {publisher?.postalCode}
              <br />
              <a href={`mailto:${publisher?.email}`} className="underline underline-offset-2 hover:text-white">
                {publisher?.email}
              </a>
            </address>
            {publisher?.branchAddressLine1 && (
              <address className="mt-4 not-italic text-[13px] leading-relaxed text-ink-300">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  {publisher.branchLabel || 'Branch Office'}
                </span>
                {publisher.branchAddressLine1}
                <br />
                {[publisher.branchCity, publisher.branchState].filter(Boolean).join(', ')}
                <br />
                {[publisher.branchCountry, publisher.branchPostalCode].filter(Boolean).join(' ')}
              </address>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Journals
            </h2>
            <ul className="space-y-2.5 text-[13px]">
              {journals.map((j) => (
                <li key={j.slug}>
                  <Link href={`/journals/${j.slug}`} className="hover:text-white">
                    {j.name}
                  </Link>
                  {j.issnOnline && (
                    <span className="mt-0.5 block text-[11.5px] text-ink-500">
                      ISSN {j.issnOnline}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Policies
            </h2>
            <ul className="space-y-2 text-[13px]">
              {policyPages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/policies/${p.slug}`} className="hover:text-white">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              For authors and readers
            </h2>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/journals" className="hover:text-white">Submit a manuscript</Link></li>
              <li><Link href="/track" className="hover:text-white">Track a submission</Link></li>
              <li><Link href="/search" className="hover:text-white">Search articles</Link></li>
              <li><Link href="/announcements" className="hover:text-white">Announcements</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact the editorial office</Link></li>
              <li>
                <a href="/api/oai?verb=Identify" className="hover:text-white">
                  OAI-PMH interface
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-800 pt-6 text-[12.5px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {publisher?.name}. Articles are published open access
            under Creative Commons licences.
          </p>
          <p>
            Content is archived and available for harvesting via{' '}
            <a href="/api/oai?verb=Identify" className="underline underline-offset-2 hover:text-white">
              OAI-PMH
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
