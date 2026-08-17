import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About the publisher',
}

export default async function AboutPage() {
  const [publisher, journals] = await Promise.all([
    db.publisher.findFirst(),
    db.journal.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true, description: true, primaryColor: true },
    }),
  ])

  return (
    <div className="shell py-12">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          <h1 className="font-serif text-[2.25rem] font-semibold leading-tight text-ink-900">
            About {publisher?.name}
          </h1>

          <div className="prose-doc mt-7 max-w-prose">
            {publisher?.about.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="font-serif text-[1.4rem] font-semibold text-ink-900">Our mission</h2>
            <p className="mt-3 max-w-prose text-[15.5px] leading-relaxed text-ink-800">
              {publisher?.mission}
            </p>
          </section>

          <section className="mt-9">
            <h2 className="font-serif text-[1.4rem] font-semibold text-ink-900">Our vision</h2>
            <p className="mt-3 max-w-prose text-[15.5px] leading-relaxed text-ink-800">
              {publisher?.vision}
            </p>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-[1.4rem] font-semibold text-ink-900">
              What we commit to
            </h2>
            <ul className="mt-5 space-y-4">
              {[
                [
                  'Genuine peer review',
                  'Every research article is reviewed by at least two independent experts before a decision is made. We publish our review timelines and we do not guarantee acceptance to anyone.',
                ],
                [
                  'Transparent charges',
                  'Any article processing charge is published on the journal page before submission. We never invoice for a manuscript that was not accepted, and the ability to pay plays no part in editorial decisions.',
                ],
                [
                  'Honest indexing claims',
                  'We list an indexing service only once inclusion has actually been granted. We do not display logos of databases we have merely applied to.',
                ],
                [
                  'Permanent availability',
                  'Every article receives a DOI and remains available at its original address. Our full metadata is open for harvesting.',
                ],
                [
                  'Authors keep their copyright',
                  'Authors retain copyright and grant us only a licence to publish. You may deposit your article anywhere, at any time, without embargo.',
                ],
              ].map(([title, body]) => (
                <li key={title} className="border-l-2 border-ink-900 pl-5">
                  <h3 className="font-serif text-[1.05rem] font-semibold text-ink-900">{title}</h3>
                  <p className="mt-1.5 max-w-prose text-[14.5px] leading-relaxed text-ink-700">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
              Editorial office
            </h2>
            <address className="not-italic text-[13.5px] leading-relaxed text-ink-700">
              {publisher?.name}
              <br />
              {publisher?.addressLine2}
              <br />
              {publisher?.city}, {publisher?.state}
              <br />
              {publisher?.country} {publisher?.postalCode}
            </address>
            <p className="mt-4 text-[13.5px]">
              <a
                href={`mailto:${publisher?.email}`}
                className="font-medium text-ink-900 underline underline-offset-2"
              >
                {publisher?.email}
              </a>
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-700 hover:text-ink-900"
            >
              Contact form <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-4 font-serif text-[1.05rem] font-semibold text-ink-900">
              Journals we publish
            </h2>
            <ul className="space-y-4">
              {journals.map((j) => (
                <li key={j.slug} className="border-l-2 pl-3" style={{ borderColor: j.primaryColor }}>
                  <Link
                    href={`/journals/${j.slug}`}
                    className="text-[13.5px] font-medium text-ink-900 hover:underline"
                  >
                    {j.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
