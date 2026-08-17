import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Publisher-level pages have journalId = null, and Prisma cannot use a compound
// unique index when part of it is null — so these are looked up with findFirst.
async function getPage(slug: string) {
  return db.page.findFirst({ where: { journalId: null, slug, isPublished: true } })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200),
  }
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  const siblings = await db.page.findMany({
    where: { journalId: null, isPublished: true },
    orderBy: [{ navGroup: 'asc' }, { sortOrder: 'asc' }],
    select: { slug: true, title: true },
  })

  return (
    <div className="shell py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-[12.5px] text-ink-500">
        <Link href="/policies" className="hover:text-ink-800">
          Editorial policies
        </Link>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <article className="lg:col-span-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            {page.navGroup}
          </p>
          <h1 className="font-serif text-[2.1rem] font-semibold leading-tight text-ink-900">
            {page.title}
          </h1>
          <p className="mt-3 text-[12.5px] text-ink-500">
            Last updated {formatDate(page.updatedAt)}
          </p>
          <div className="prose-doc mt-8" dangerouslySetInnerHTML={{ __html: page.body }} />
        </article>

        <aside className="lg:col-span-4">
          <div className="sticky top-20 rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              All policies
            </h2>
            <ul className="space-y-2.5">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/policies/${s.slug}`}
                    aria-current={s.slug === slug ? 'page' : undefined}
                    className={
                      s.slug === slug
                        ? 'text-[13.5px] font-semibold text-ink-900'
                        : 'text-[13.5px] text-ink-600 hover:text-ink-900 hover:underline'
                    }
                  >
                    {s.title}
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
