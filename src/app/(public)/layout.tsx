import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'
import { DemoBanner } from '@/components/site/demo-banner'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
