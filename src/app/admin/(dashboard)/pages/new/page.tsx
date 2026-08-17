import { db } from '@/lib/db'
import { PageForm } from '@/components/admin/page-form'

export const dynamic = 'force-dynamic'

export default async function NewPagePage() {
  const [journals, existing] = await Promise.all([
    db.journal.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    db.page.findMany({ select: { navGroup: true }, distinct: ['navGroup'] }),
  ])

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Write a new page</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
          Use this for anything readers need to read rather than download — policies, author
          guidelines, charges, an about page. Untick <strong>Show this page on the site</strong> at
          the bottom if you want to finish it later.
        </p>
      </header>

      <PageForm
        initial={{}}
        journals={journals}
        navGroups={existing.map((p) => p.navGroup).filter(Boolean).sort()}
      />
    </div>
  )
}
