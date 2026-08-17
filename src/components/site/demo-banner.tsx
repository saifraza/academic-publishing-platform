import { isDemo } from '@/lib/demo'
import { AlertTriangle } from 'lucide-react'

export function DemoBanner() {
  if (!isDemo) return null

  return (
    <div className="no-print border-b border-amber-300 bg-amber-100 text-amber-950">
      <div className="shell flex items-start gap-2.5 py-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[12.5px] leading-relaxed">
          <strong className="font-semibold">Demonstration site.</strong> This is a working
          preview of a publishing platform. The publisher, the journals, the articles, the
          authors, the ISSNs and the DOIs shown here are all invented sample data — nothing on
          this site is a real publication, and it is not indexed by search engines.
        </p>
      </div>
    </div>
  )
}
