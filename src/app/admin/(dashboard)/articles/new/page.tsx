import { db } from '@/lib/db'
import { ArticleForm } from '@/components/admin/article-form'

export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
  const [journals, issues] = await Promise.all([
    db.journal.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, doiPrefix: true },
    }),
    db.issue.findMany({
      orderBy: [{ volume: { number: 'desc' } }, { number: 'desc' }],
      include: { volume: true },
    }),
  ])

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">
          Publish an article
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
          Fill in what you have. You can save it as a draft now and come back to finish it —
          nothing goes live until you tick <strong>Publish this article</strong> at the bottom.
        </p>
      </header>

      <ArticleForm
        initial={{}}
        journals={journals}
        issues={issues.map((i) => ({
          id: i.id,
          journalId: i.volume.journalId,
          label: `Volume ${i.volume.number}, Issue ${i.number} (${i.volume.year})`,
        }))}
      />
    </div>
  )
}
