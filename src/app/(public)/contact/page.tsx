import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { ContactForm } from './contact-form'
import { OfficeAddresses } from '@/components/site/office-addresses'
import { Mail, Phone } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const publisher = await db.publisher.findFirst()

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-serif text-[2.25rem] font-semibold leading-tight text-ink-900">
        Contact the editorial office
      </h1>
      <p className="mt-3 max-w-prose text-[15.5px] leading-relaxed text-ink-700">
        For questions about a submission, please quote your tracking ID. For anything relating
        to publication ethics or a complaint, see our{' '}
        <a href="/policies/complaints-and-appeals" className="font-medium underline underline-offset-2">
          complaints and appeals policy
        </a>
        .
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-3">
          <ContactForm />
        </div>

        <aside className="md:col-span-2">
          <div className="rounded-sm border border-paper-line bg-white p-6">
            <h2 className="mb-5 font-serif text-[1.05rem] font-semibold text-ink-900">
              {publisher?.name}
            </h2>
            {publisher && <OfficeAddresses publisher={publisher} />}

            <ul className="mt-5 space-y-4 border-t border-paper-line pt-5 text-[13.5px] leading-relaxed text-ink-700">
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                <a
                  href={`mailto:${publisher?.email}`}
                  className="underline underline-offset-2 hover:text-ink-900"
                >
                  {publisher?.email}
                </a>
              </li>
              {publisher?.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                  {publisher.phone}
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
