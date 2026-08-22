import { MapPin } from 'lucide-react'

type PublisherAddress = {
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
  branchLabel: string
  branchAddressLine1: string
  branchAddressLine2: string
  branchCity: string
  branchState: string
  branchCountry: string
  branchPostalCode: string
}

function hasBranch(p: Pick<PublisherAddress, 'branchAddressLine1' | 'branchCity'>) {
  return Boolean(p.branchAddressLine1.trim() || p.branchCity.trim())
}

function Address({
  label,
  line1,
  line2,
  city,
  state,
  country,
  postalCode,
}: {
  label: string
  line1: string
  line2: string
  city: string
  state: string
  country: string
  postalCode: string
}) {
  return (
    <div>
      {label && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          {label}
        </p>
      )}
      <address className="not-italic text-[13.5px] leading-relaxed text-ink-700">
        {line1 && (
          <>
            {line1}
            <br />
          </>
        )}
        {line2 && (
          <>
            {line2}
            <br />
          </>
        )}
        {[city, state].filter(Boolean).join(', ')}
        <br />
        {[country, postalCode].filter(Boolean).join(' ')}
      </address>
    </div>
  )
}

/** Head office, plus the branch office when one has been entered. */
export function OfficeAddresses({ publisher }: { publisher: PublisherAddress }) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
        <Address
          label={hasBranch(publisher) ? 'Head Office' : ''}
          line1={publisher.addressLine1}
          line2={publisher.addressLine2 === 'Head Office' ? '' : publisher.addressLine2}
          city={publisher.city}
          state={publisher.state}
          country={publisher.country}
          postalCode={publisher.postalCode}
        />
      </div>

      {hasBranch(publisher) && (
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          <Address
            label={publisher.branchLabel || 'Branch Office'}
            line1={publisher.branchAddressLine1}
            line2={publisher.branchAddressLine2}
            city={publisher.branchCity}
            state={publisher.branchState}
            country={publisher.branchCountry}
            postalCode={publisher.branchPostalCode}
          />
        </div>
      )}
    </div>
  )
}
