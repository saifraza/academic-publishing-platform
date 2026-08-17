import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { ARTICLE_TYPE_LABELS, FREQUENCY_LABELS } from '@/lib/labels'
import { ArrowRight, BookOpen, FileText, Users, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [publisher, journals, featured, recent, announcements, stats] = await Promise.all([
    db.publisher.findFirst(),
    db.journal.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { articles: true } } },
    }),
    db.article.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { publishedAt: 'desc' },
      take: 4,
      include: {
        authors: { orderBy: { order: 'asc' } },
        journal: { select: { name: true, shortName: true, slug: true, primaryColor: true } },
      },
    }),
    db.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      include: {
        authors: { orderBy: { order: 'asc' } },
        journal: { select: { name: true, shortName: true, slug: true, primaryColor: true } },
      },
    }),
    db.announcement.findMany({
      where: {
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 2,
      include: { journal: { select: { name: true, slug: true } } },
    }),
    (async () => {
      const [articles, authors, countries] = await Promise.all([
        db.article.count({ where: { isPublished: true } }),
        db.author.count(),
        db.author.findMany({ select: { country: true }, distinct: ['country'] }),
      ])
      return { articles, authors, countries: countries.filter((c) => c.country).length }
    })(),
  ])

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-paper-line bg-white">
        <div className="shell py-12 md:py-16">
          <div className="grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Independent academic publisher
              </p>
              <h1 className="font-serif text-[2.6rem] font-semibold leading-[1.12] tracking-tight text-ink-900 md:text-[3.4rem]">
                Research that stays open,
                <br />
                reviewed with care.
              </h1>
              <p className="mt-6 max-w-prose text-[16.5px] leading-relaxed text-ink-700">
                {publisher?.mission}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/journals"
                  className="inline-flex items-center gap-2 rounded-sm bg-ink-900 px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-ink-800"
                >
                  Browse our journals
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/policies/peer-review-policy"
                  className="inline-flex items-center gap-2 rounded-sm border border-ink-300 px-5 py-3 text-[14px] font-medium text-ink-800 transition-colors hover:border-ink-900 hover:bg-paper-shade"
                >
                  How peer review works here
                </Link>
              </div>
            </div>

            {/* Metrics — computed live, never hardcoded */}
            <div className="md:col-span-5">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-paper-line bg-paper-line">
                {[
                  { icon: BookOpen, value: journals.length, label: 'Journals' },
                  { icon: FileText, value: stats.articles, label: 'Articles published' },
                  { icon: Users, value: stats.authors, label: 'Contributing authors' },
                  { icon: Globe, value: stats.countries, label: 'Countries represented' },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="bg-paper-shade p-6">
                    <Icon className="mb-3 h-[18px] w-[18px] text-ink-400" aria-hidden />
                    <p className="font-serif text-[2rem] font-semibold leading-none text-ink-900">
                      {value}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-snug text-ink-600">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                Figures are counted directly from the published record and update as we publish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Journals */}
      <section className="border-b border-paper-line bg-paper">
        <div className="shell py-12">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-serif text-[1.75rem] font-semibold text-ink-900">Our journals</h2>
              <p className="mt-1.5 text-[14.5px] text-ink-600">
                Each journal has its own editorial board, scope and review process.
              </p>
            </div>
            <Link
              href="/journals"
              className="hidden shrink-0 items-center gap-1.5 text-[13.5px] font-medium text-ink-700 hover:text-ink-900 sm:inline-flex"
            >
              All journals <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {journals.map((j) => (
              <Link
                key={j.id}
                href={`/journals/${j.slug}`}
                className="group flex flex-col rounded-sm border border-paper-line bg-white transition-shadow hover:shadow-[0_2px_16px_rgba(10,37,64,0.07)]"
              >
                <div className="h-1" style={{ backgroundColor: j.primaryColor }} aria-hidden />
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-serif text-[1.3rem] font-semibold leading-snug text-ink-900">
                    {j.name}
                  </h3>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                    {j.issnOnline && <span>ISSN {j.issnOnline}</span>}
                    <span aria-hidden>·</span>
                    <span>{FREQUENCY_LABELS[j.frequency]}</span>
                    <span aria-hidden>·</span>
                    <span>{j._count.articles} articles</span>
                  </div>
                  <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-ink-700">
                    {j.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {j.subjectAreas.slice(0, 5).map((s) => (
                      <span
                        key={s}
                        className="rounded-sm bg-paper-shade px-2 py-1 text-[11.5px] text-ink-600"
                      >
                        {s}
                      </span>
                    ))}
                    {j.subjectAreas.length > 5 && (
                      <span className="px-1 py-1 text-[11.5px] text-ink-400">
                        +{j.subjectAreas.length - 5} more
                      </span>
                    )}
                  </div>
                  <span
                    className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium"
                    style={{ color: j.primaryColor }}
                  >
                    Visit journal
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Featured */}
      {featured.length > 0 && (
        <section className="border-b border-paper-line bg-white">
          <div className="shell py-12">
            <h2 className="mb-8 font-serif text-[1.75rem] font-semibold text-ink-900">
              Featured research
            </h2>
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              {featured.map((a) => (
                <article key={a.id} className="border-l-2 pl-5" style={{ borderColor: a.journal.primaryColor }}>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11.5px]">
                    <span
                      className="rounded-sm px-1.5 py-0.5 font-medium text-white"
                      style={{ backgroundColor: a.journal.primaryColor }}
                    >
                      {ARTICLE_TYPE_LABELS[a.articleType]}
                    </span>
                    <Link
                      href={`/journals/${a.journal.slug}`}
                      className="text-ink-500 hover:text-ink-800"
                    >
                      {a.journal.shortName || a.journal.name}
                    </Link>
                  </div>
                  <h3 className="font-serif text-[1.15rem] font-semibold leading-snug">
                    <Link
                      href={`/journals/${a.journal.slug}/articles/${a.slug}`}
                      className="text-ink-900 hover:underline hover:underline-offset-4"
                    >
                      {a.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-[13px] text-ink-600">
                    {a.authors.map((au) => au.fullName).join(', ')}
                  </p>
                  <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-ink-700">
                    {a.abstract}
                  </p>
                  <p className="mt-3 text-[12px] text-ink-500">
                    {formatDate(a.publishedAt)}
                    {a.doi && <> · DOI {a.doi}</>}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------- Recent + announcements */}
      <section className="bg-paper">
        <div className="shell py-12">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="mb-6 font-serif text-[1.5rem] font-semibold text-ink-900">
                Recently published
              </h2>
              <ul className="divide-y divide-paper-line border-y border-paper-line">
                {recent.map((a) => (
                  <li key={a.id} className="py-4">
                    <Link
                      href={`/journals/${a.journal.slug}/articles/${a.slug}`}
                      className="group block"
                    >
                      <h3 className="font-serif text-[15.5px] font-medium leading-snug text-ink-900 group-hover:underline group-hover:underline-offset-4">
                        {a.title}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] text-ink-600">
                        {a.authors.map((au) => au.fullName).join(', ')}
                      </p>
                      <p className="mt-1 text-[12px] text-ink-500">
                        <span style={{ color: a.journal.primaryColor }} className="font-medium">
                          {a.journal.shortName || a.journal.name}
                        </span>
                        {' · '}
                        {formatDate(a.publishedAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/search"
                className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-700 hover:text-ink-900"
              >
                Search all articles <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div>
              <h2 className="mb-6 font-serif text-[1.5rem] font-semibold text-ink-900">
                Announcements
              </h2>
              <div className="space-y-5">
                {announcements.map((n) => (
                  <article key={n.id} className="rounded-sm border border-paper-line bg-white p-5">
                    <p className="mb-2 text-[11.5px] uppercase tracking-wide text-ink-500">
                      {formatDate(n.publishedAt)}
                    </p>
                    <h3 className="font-serif text-[15px] font-semibold leading-snug text-ink-900">
                      {n.title}
                    </h3>
                    <p className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed text-ink-700">
                      {n.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
