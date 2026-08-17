import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { ARTICLE_TYPE_LABELS } from '@/lib/labels'
import { Plus, ExternalLink, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ journal?: string; status?: string; q?: string }>
}) {
  const sp = await searchParams

  const journals = await db.journal.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, name: true, shortName: true },
  })

  const articles = await db.article.findMany({
    where: {
      ...(sp.journal ? { journal: { slug: sp.journal } } : {}),
      ...(sp.status === 'draft' ? { isPublished: false } : {}),
      ...(sp.status === 'published' ? { isPublished: true } : {}),
      ...(sp.q ? { title: { contains: sp.q, mode: 'insensitive' as const } } : {}),
    },
    orderBy: [{ isPublished: 'asc' }, { publishedAt: 'desc' }],
    include: {
      journal: { select: { slug: true, shortName: true, name: true, primaryColor: true } },
      issue: { include: { volume: true } },
      authors: { orderBy: { order: 'asc' }, take: 3 },
      _count: { select: { authors: true } },
    },
    take: 200,
  })

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[1.75rem] font-semibold text-ink-900">Articles</h1>
          <p className="mt-1.5 text-[14px] text-ink-600">
            Everything published or in draft, across all journals.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Publish an article
        </Link>
      </header>

      {/* Filters */}
      <form className="mb-5 flex flex-wrap gap-2.5 rounded-sm border border-paper-line bg-white p-4">
        <input
          type="search"
          name="q"
          defaultValue={sp.q}
          placeholder="Search titles"
          className="min-w-48 flex-1 rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
        />
        <select
          name="journal"
          defaultValue={sp.journal ?? ''}
          className="rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
        >
          <option value="">All journals</option>
          {journals.map((j) => (
            <option key={j.id} value={j.slug}>
              {j.shortName || j.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          className="rounded-sm border border-paper-line px-3 py-2 text-[13.5px]"
        >
          <option value="">Published and drafts</option>
          <option value="published">Published only</option>
          <option value="draft">Drafts only</option>
        </select>
        <button
          type="submit"
          className="rounded-sm border border-ink-300 px-4 py-2 text-[13.5px] font-medium text-ink-800 hover:bg-paper-shade"
        >
          Filter
        </button>
      </form>

      {articles.length === 0 ? (
        <div className="rounded-sm border border-dashed border-paper-line bg-white px-6 py-16 text-center">
          <p className="font-serif text-[1.15rem] font-semibold text-ink-900">
            No articles here yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-600">
            When you publish an article it will appear in this list, where you can edit it or take
            it offline again.
          </p>
          <Link
            href="/admin/articles/new"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Publish your first article
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-paper-line bg-white">
          <table className="w-full text-left">
            <thead className="border-b border-paper-line bg-paper-shade">
              <tr className="text-[11px] uppercase tracking-wider text-ink-500">
                <th className="px-4 py-2.5 font-semibold">Article</th>
                <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">Issue</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Status</th>
                <th className="px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {articles.map((a) => {
                const missing = [!a.doi && 'DOI', !a.pdfUrl && 'PDF'].filter(Boolean)
                return (
                  <tr key={a.id} className="align-top hover:bg-paper-shade/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="text-[13.5px] font-medium leading-snug text-ink-900 hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="mt-1 text-[12px] text-ink-500">
                        {a.authors.map((x) => x.fullName).join(', ')}
                        {a._count.authors > 3 && ` +${a._count.authors - 3}`}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px]">
                        <span
                          className="rounded-sm px-1.5 py-0.5 font-medium text-white"
                          style={{ backgroundColor: a.journal.primaryColor }}
                        >
                          {a.journal.shortName || a.journal.name}
                        </span>
                        <span className="text-ink-500">
                          {ARTICLE_TYPE_LABELS[a.articleType]}
                        </span>
                        {missing.length > 0 && a.isPublished && (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertCircle className="h-3 w-3" aria-hidden />
                            no {missing.join(', ')}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-[12.5px] text-ink-600 lg:table-cell">
                      {a.issue
                        ? `Vol ${a.issue.volume.number}, Iss ${a.issue.number}`
                        : 'Not in an issue'}
                      {a.pageStart && (
                        <span className="block text-ink-400">
                          pp. {a.pageStart}–{a.pageEnd ?? a.pageStart}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {a.isPublished ? (
                        <span className="inline-block rounded-sm bg-green-50 px-2 py-0.5 text-[11.5px] font-medium text-green-800">
                          Live
                        </span>
                      ) : (
                        <span className="inline-block rounded-sm bg-paper-shade px-2 py-0.5 text-[11.5px] font-medium text-ink-600">
                          Draft
                        </span>
                      )}
                      {a.publishedAt && (
                        <span className="mt-1 block text-[11.5px] text-ink-500">
                          {formatDate(a.publishedAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/articles/${a.id}`}
                          className="rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                        >
                          Edit
                        </Link>
                        {a.isPublished && (
                          <a
                            href={`/journals/${a.journal.slug}/articles/${a.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-sm border border-paper-line px-2.5 py-1 text-[12.5px] font-medium text-ink-700 hover:bg-paper-shade"
                          >
                            View
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
