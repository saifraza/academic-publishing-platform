import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Catch-all for journal pages created from the admin. Static routes such as
 * /archives and /editorial-board take precedence over this segment, so adding
 * a page in the admin can never shadow a built-in one.
 */
async function getPage(journalSlug: string, pageSlug: string) {
  const journal = await db.journal.findUnique({ where: { slug: journalSlug } })
  if (!journal) return null
  const page = await db.page.findUnique({
    where: { journalId_slug: { journalId: journal.id, slug: pageSlug } },
  })
  if (!page || !page.isPublished) return null
  return { journal, page }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ journalSlug: string; pageSlug: string }>
}): Promise<Metadata> {
  const { journalSlug, pageSlug } = await params
  const data = await getPage(journalSlug, pageSlug)
  if (!data) return {}
  return { title: `${data.page.title} — ${data.journal.name}` }
}

export default async function JournalContentPage({
  params,
}: {
  params: Promise<{ journalSlug: string; pageSlug: string }>
}) {
  const { journalSlug, pageSlug } = await params
  const data = await getPage(journalSlug, pageSlug)
  if (!data) notFound()

  return (
    <div className="shell py-12">
      <article className="max-w-prose">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          {data.page.navGroup}
        </p>
        <h1 className="font-serif text-[2rem] font-semibold leading-tight text-ink-900">
          {data.page.title}
        </h1>
        <div
          className="prose-doc mt-7"
          dangerouslySetInnerHTML={{ __html: data.page.body }}
        />
      </article>
    </div>
  )
}
