import type { MetadataRoute } from 'next'
import { isDemo } from '@/lib/demo'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  // While the site carries fabricated sample data, nothing may be crawled —
  // the article pages emit Google Scholar citation tags, and indexing invented
  // papers under real-sounding author names is not a harmless mistake.
  if (isDemo) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/files/', '/track'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
