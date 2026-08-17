import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ journalSlug: string }> },
) {
  const { journalSlug } = await params

  const journal = await db.journal.findUnique({
    where: { slug: journalSlug },
    include: {
      articles: {
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 50,
        include: { authors: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!journal || !journal.isPublished) {
    return new Response('Not found', { status: 404 })
  }

  const items = journal.articles
    .map((a) => {
      const url = `${SITE}/journals/${journal.slug}/articles/${a.slug}`
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(a.abstract.slice(0, 600))}</description>
      <author>${esc(a.authors.map((x) => x.fullName).join(', '))}</author>
      ${a.publishedAt ? `<pubDate>${a.publishedAt.toUTCString()}</pubDate>` : ''}
      ${a.keywords.map((k) => `<category>${esc(k)}</category>`).join('\n      ')}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(journal.name)}</title>
    <link>${SITE}/journals/${journal.slug}</link>
    <description>${esc(journal.description)}</description>
    <language>en</language>
    <atom:link href="${SITE}/journals/${journal.slug}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
