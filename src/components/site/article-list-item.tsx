import Link from 'next/link'
import { ARTICLE_TYPE_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'
import { FileDown } from 'lucide-react'

type Props = {
  journalSlug: string
  article: {
    slug: string
    title: string
    abstract: string
    articleType: string
    pageStart: number | null
    pageEnd: number | null
    doi: string | null
    publishedAt: Date | null
    downloadCount: number
    authors: { fullName: string; isCorresponding: boolean }[]
  }
  showAbstract?: boolean
}

export function ArticleListItem({ journalSlug, article: a, showAbstract = true }: Props) {
  return (
    <article className="py-6">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
        <span className="rounded-sm bg-paper-shade px-2 py-0.5 font-medium text-ink-700">
          {ARTICLE_TYPE_LABELS[a.articleType] ?? a.articleType}
        </span>
        {a.pageStart && (
          <span className="text-ink-500">
            Pages {a.pageStart}
            {a.pageEnd ? `–${a.pageEnd}` : ''}
          </span>
        )}
        {a.publishedAt && <span className="text-ink-500">{formatDate(a.publishedAt)}</span>}
      </div>

      <h3 className="font-serif text-[1.15rem] font-semibold leading-snug">
        <Link
          href={`/journals/${journalSlug}/articles/${a.slug}`}
          className="text-ink-900 hover:underline hover:underline-offset-4"
        >
          {a.title}
        </Link>
      </h3>

      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">
        {a.authors.map((au, i) => (
          <span key={au.fullName}>
            {i > 0 && ', '}
            {au.fullName}
            {au.isCorresponding && (
              <span title="Corresponding author" className="accent-text">
                {' '}
                ✉
              </span>
            )}
          </span>
        ))}
      </p>

      {showAbstract && (
        <p className="mt-3 line-clamp-3 max-w-prose text-[14px] leading-relaxed text-ink-700">
          {a.abstract}
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-500">
        {a.doi && (
          <a
            href={`https://doi.org/${a.doi}`}
            className="hover:text-ink-800 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI {a.doi}
          </a>
        )}
        <Link
          href={`/journals/${journalSlug}/articles/${a.slug}`}
          className="inline-flex items-center gap-1 font-medium accent-text hover:underline"
        >
          <FileDown className="h-3.5 w-3.5" />
          Full text
        </Link>
        <span>{a.downloadCount} downloads</span>
      </div>
    </article>
  )
}
