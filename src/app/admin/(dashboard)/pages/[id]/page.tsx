import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PageForm } from '@/components/admin/page-form'
import { formatDate } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [page, journals, existing] = await Promise.all([
    db.page.findUnique({
      where: { id },
      include: { journal: { select: { slug: true, name: true } } },
    }),
    db.journal.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    db.page.findMany({ select: { navGroup: true }, distinct: ['navGroup'] }),
  ])

  if (!page) notFound()

  const publicUrl = page.journal
    ? `/journals/${page.journal.slug}/${page.slug}`
    : `/policies/${page.slug}`

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-[1.6rem] font-semibold leading-snug text-ink-900">
              Edit page
            </h1>
            <p className="mt-1 line-clamp-2 text-[14px] text-ink-600">{page.title}</p>
          </div>
          {page.isPublished && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-paper-line bg-white px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-paper-shade"
            >
              Preview live page
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
        <p className="mt-3 rounded-sm bg-paper-shade px-3.5 py-2 text-[12.5px] text-ink-600">
          {page.isPublished
            ? `This page is live. Changes appear on the site as soon as you save. Last updated ${formatDate(page.updatedAt)}.`
            : 'This page is not on the site. Nobody can see it until you tick “Show this page on the site”.'}
        </p>
      </header>

      <PageForm
        initial={{
          id: page.id,
          journalId: page.journalId,
          slug: page.slug,
          title: page.title,
          body: page.body,
          navGroup: page.navGroup,
          sortOrder: page.sortOrder,
          showInNav: page.showInNav,
          isPublished: page.isPublished,
        }}
        journals={journals}
        navGroups={existing.map((p) => p.navGroup).filter(Boolean).sort()}
      />

      <p className="mt-8 text-center text-[12.5px] text-ink-500">
        <Link href="/admin/pages" className="underline underline-offset-2">
          Back to all pages
        </Link>
      </p>
    </div>
  )
}
