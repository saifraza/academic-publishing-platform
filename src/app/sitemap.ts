import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [journals, articles, issues, pages] = await Promise.all([
    db.journal.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, journal: { select: { slug: true } } },
    }),
    db.issue.findMany({
      where: { isPublished: true },
      select: {
        number: true,
        updatedAt: true,
        volume: { select: { number: true, journal: { select: { slug: true } } } },
      },
    }),
    db.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, journal: { select: { slug: true } } },
    }),
  ])

  const staticRoutes = ['', '/journals', '/about', '/policies', '/contact', '/search', '/announcements', '/track']

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE}${path}`,
      lastModified: new Date(),
      priority: path === '' ? 1 : 0.7,
    })),
    ...journals.flatMap((j) => [
      { url: `${SITE}/journals/${j.slug}`, lastModified: j.updatedAt, priority: 0.9 },
      { url: `${SITE}/journals/${j.slug}/aims-and-scope`, lastModified: j.updatedAt, priority: 0.6 },
      { url: `${SITE}/journals/${j.slug}/editorial-board`, lastModified: j.updatedAt, priority: 0.6 },
      { url: `${SITE}/journals/${j.slug}/archives`, lastModified: j.updatedAt, priority: 0.6 },
      { url: `${SITE}/journals/${j.slug}/submit`, lastModified: j.updatedAt, priority: 0.6 },
    ]),
    ...issues.map((i) => ({
      url: `${SITE}/journals/${i.volume.journal.slug}/archives/${i.volume.number}/${i.number}`,
      lastModified: i.updatedAt,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${SITE}/journals/${a.journal.slug}/articles/${a.slug}`,
      lastModified: a.updatedAt,
      priority: 0.8,
    })),
    ...pages.map((p) => ({
      url: p.journal
        ? `${SITE}/journals/${p.journal.slug}/${p.slug}`
        : `${SITE}/policies/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.5,
    })),
  ]
}
