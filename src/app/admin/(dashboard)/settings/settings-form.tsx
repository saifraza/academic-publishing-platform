'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveSettings, type SettingsFormState } from '@/app/admin/(dashboard)/settings/actions'
import { AlertCircle, Check } from 'lucide-react'

export type SettingsInitial = {
  name: string
  shortName: string
  tagline: string
  about: string
  mission: string
  vision: string
  primaryColor: string
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
  email: string
  phone: string
  linkedin: string
  twitter: string
  facebook: string
  registeredName: string
  gstin: string
}

const input =
  'w-full rounded-sm border border-paper-line bg-white px-3 py-2 text-[13.5px] text-ink-900 placeholder:text-ink-400 focus:border-ink-500'

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-sm border border-paper-line bg-white p-5">
      <h2 className="font-serif text-[1.1rem] font-semibold text-ink-900">{title}</h2>
      {hint && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink-900">
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

function SaveBar() {
  const { pending } = useFormStatus()
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper-line bg-white px-6 py-3.5 lg:-mx-8 lg:px-8">
      <p className="text-[12.5px] text-ink-500">
        These details appear across the whole site, on every journal.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink-900 px-6 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  )
}

export function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const [state, action] = useActionState<SettingsFormState, FormData>(saveSettings, {
    status: 'idle',
  })
  const [colour, setColour] = useState(initial.primaryColor)

  const validColour = /^#[0-9a-fA-F]{6}$/.test(colour)

  return (
    <form action={action} className="space-y-5">
      {state.status === 'success' && (
        <div className="flex items-start gap-2.5 rounded-sm border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      {state.status === 'error' && state.message && (
        <div className="flex items-start gap-2.5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      {/* ------------------------------------------------------------ Name */}
      <Section
        title="Name and description"
        hint="What the publisher is called, and how it describes itself. These appear in the header, the footer and in search results."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Publisher name" required error={state.fieldErrors?.name}>
            <input name="name" defaultValue={initial.name} className={input} />
          </Field>

          <Field
            label="Short name"
            hint="The abbreviation used where there is little room, such as the logo."
          >
            <input
              name="shortName"
              defaultValue={initial.shortName}
              placeholder="MAP"
              className={input}
            />
          </Field>
        </div>

        <Field
          label="Tagline"
          hint="One line under the name. Keep it to a few words."
        >
          <input
            name="tagline"
            defaultValue={initial.tagline}
            placeholder="Open access research, peer reviewed."
            className={input}
          />
        </Field>

        <Field
          label="About the publisher"
          hint="A few paragraphs for the About page. Plain text — leave a blank line between paragraphs."
        >
          <textarea name="about" rows={7} defaultValue={initial.about} className={input} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mission" hint="What the publisher sets out to do.">
            <textarea name="mission" rows={4} defaultValue={initial.mission} className={input} />
          </Field>
          <Field label="Vision" hint="Where the publisher wants to be.">
            <textarea name="vision" rows={4} defaultValue={initial.vision} className={input} />
          </Field>
        </div>
      </Section>

      {/* ---------------------------------------------------------- Colour */}
      <Section
        title="Colour"
        hint="Used for headings, buttons and links across the site. Individual journals can have their own colour."
      >
        <Field
          label="Main colour"
          error={state.fieldErrors?.primaryColor}
          hint="Pick it with the swatch, or paste a colour code your designer gave you."
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              aria-label="Choose the main colour"
              value={validColour ? colour : '#0a2540'}
              onChange={(e) => setColour(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-sm border border-paper-line bg-white p-1"
            />
            <input
              name="primaryColor"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              spellCheck={false}
              placeholder="#0a2540"
              className={input + ' max-w-40 font-mono'}
            />
            <span
              className="inline-flex items-center rounded-sm px-3 py-2 text-[12.5px] font-medium text-white"
              style={{ backgroundColor: validColour ? colour : '#0a2540' }}
            >
              Preview
            </span>
          </div>
        </Field>
      </Section>

      {/* --------------------------------------------------------- Contact */}
      <Section
        title="Address and contact"
        hint="Shown in the footer and on the contact page. Indexing services and readers both use it, so keep it current."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line 1">
            <input name="addressLine1" defaultValue={initial.addressLine1} className={input} />
          </Field>
          <Field label="Address line 2" hint="Optional — a building or floor.">
            <input name="addressLine2" defaultValue={initial.addressLine2} className={input} />
          </Field>
          <Field label="Town or city">
            <input name="city" defaultValue={initial.city} className={input} />
          </Field>
          <Field label="State">
            <input name="state" defaultValue={initial.state} className={input} />
          </Field>
          <Field label="Postal code">
            <input name="postalCode" defaultValue={initial.postalCode} className={input} />
          </Field>
          <Field label="Country">
            <input name="country" defaultValue={initial.country} className={input} />
          </Field>
        </div>
      </Section>

      {/* --------------------------------------------------- Branch office */}
      <Section
        title="Branch office"
        hint="A second address, shown under the head office wherever your contact details appear. Leave it blank if you only have one office."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="What to call it" hint="For example “Branch Office” or “Canada Office”.">
            <input name="branchLabel" defaultValue={initial.branchLabel} placeholder="Branch Office" className={input} />
          </Field>
          <Field label="Address line 1">
            <input name="branchAddressLine1" defaultValue={initial.branchAddressLine1} className={input} />
          </Field>
          <Field label="Address line 2" hint="Optional.">
            <input name="branchAddressLine2" defaultValue={initial.branchAddressLine2} className={input} />
          </Field>
          <Field label="Town or city">
            <input name="branchCity" defaultValue={initial.branchCity} className={input} />
          </Field>
          <Field label="State or province">
            <input name="branchState" defaultValue={initial.branchState} className={input} />
          </Field>
          <Field label="Postal code">
            <input name="branchPostalCode" defaultValue={initial.branchPostalCode} className={input} />
          </Field>
          <Field label="Country">
            <input name="branchCountry" defaultValue={initial.branchCountry} className={input} />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------- Reach us */}
      <Section title="How people reach you" hint="Shown on the contact page and in the footer.">
        <div className="grid gap-4 sm:grid-cols-2">

          <Field
            label="Email"
            error={state.fieldErrors?.email}
            hint="The editorial office address readers and authors should write to."
          >
            <input
              name="email"
              type="email"
              defaultValue={initial.email}
              placeholder="editorial@example.org"
              className={input}
            />
          </Field>
          <Field label="Telephone" hint="Include the country code.">
            <input
              name="phone"
              defaultValue={initial.phone}
              placeholder="+91 22 0000 0000"
              className={input}
            />
          </Field>
        </div>
      </Section>

      {/* --------------------------------------------------------- Socials */}
      <Section
        title="Social accounts"
        hint="Leave any of these blank if you do not have one. Paste the full web address of the profile."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" error={state.fieldErrors?.linkedin}>
            <input
              name="linkedin"
              defaultValue={initial.linkedin}
              placeholder="https://www.linkedin.com/company/…"
              className={input}
            />
          </Field>
          <Field label="X (formerly Twitter)" error={state.fieldErrors?.twitter}>
            <input
              name="twitter"
              defaultValue={initial.twitter}
              placeholder="https://x.com/…"
              className={input}
            />
          </Field>
          <Field label="Facebook" error={state.fieldErrors?.facebook}>
            <input
              name="facebook"
              defaultValue={initial.facebook}
              placeholder="https://www.facebook.com/…"
              className={input}
            />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------------ Legal */}
      <Section
        title="Legal and tax"
        hint="Used on invoices and receipts for article processing charges. Not shown to readers."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Registered name"
            hint="The name the business is registered under, if it differs from the publisher name above."
          >
            <input name="registeredName" defaultValue={initial.registeredName} className={input} />
          </Field>
          <Field
            label="GSTIN"
            error={state.fieldErrors?.gstin}
            hint="The 15-character GST number. Leave blank if you are not registered."
          >
            <input
              name="gstin"
              defaultValue={initial.gstin}
              placeholder="27AAAAA0000A1Z5"
              className={input + ' font-mono uppercase'}
            />
          </Field>
        </div>
      </Section>

      <SaveBar />
    </form>
  )
}
