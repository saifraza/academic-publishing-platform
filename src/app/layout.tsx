import type { Metadata } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { isDemo } from '@/lib/demo'
import { db } from '@/lib/db'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const publisher = await db.publisher.findFirst({
    select: { name: true, tagline: true },
  })
  const name = publisher?.name ?? 'Academic Publishing House'

  return {
  title: {
    default: name,
    template: `%s | ${name}`,
  },
  description: publisher?.tagline ?? 'Open access research, peer reviewed.',
  // Belt and braces alongside robots.txt: while the sample data is fabricated,
  // no page may be indexed. Article pages carry Google Scholar citation tags.
  ...(isDemo
    ? { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } }
    : {}),
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
