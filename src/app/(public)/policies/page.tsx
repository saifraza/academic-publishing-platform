import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Editorial policies',
  description: 'Publication ethics, peer review, open access, copyright and archiving policies.',
}

export default async function PoliciesPage() {
  const pages = await db.page.findMany({
    where: { journalId: null, isPublished: true },
    orderBy: [{ navGroup: 'asc' }, { sortOrder: 'asc' }],
    select: { slug: true, title: true, navGroup: true, body: true },
  })

  const groups = pages.reduce<Record<string, typeof pages>>((acc, p) => {
    ;(acc[p.navGroup] ??= []).push(p)
    return acc
  }, {})

  function excerpt(html: string) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)
  }

  return (
    <div className="shell py-12">
      <header className="mb-10 max-w-prose">
        <h1 className="font-serif text-[2.25rem] font-semibold leading-tight text-ink-900">
          Editorial policies
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-700">
          These policies apply to every journal we publish. Journal-specific policies — author
          guidelines, charges and review procedure — are on each journal&rsquo;s own pages.
        </p>
      </header>

      <div className="space-y-10">
        {Object.entries(groups).map(([group, items]) => (
          <section key={group}>
            <h2 className="mb-4 border-b-2 border-ink-900 pb-2 font-serif text-[1.3rem] font-semibold text-ink-900">
              {group}
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {items.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/policies/${p.slug}`}
                    className="group block h-full rounded-sm border border-paper-line bg-white p-6 transition-shadow hover:shadow-[0_2px_14px_rgba(10,37,64,0.07)]"
                  >
                    <h3 className="font-serif text-[1.1rem] font-semibold leading-snug text-ink-900">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">
                      {excerpt(p.body)}…
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-700">
                      Read policy
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
