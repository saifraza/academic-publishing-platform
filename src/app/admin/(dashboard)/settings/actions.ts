'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/auth'

export type SettingsFormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
}

const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/

/** A social link must be a full https:// address, or blank. */
const socialLink = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), {
    message: 'Paste the full address, starting with https://',
  })

const settingsSchema = z.object({
  name: z.string().trim().min(2, 'The publisher needs a name.'),
  shortName: z.string().trim(),
  tagline: z.string().trim(),
  about: z.string(),
  mission: z.string(),
  vision: z.string(),
  primaryColor: z
    .string()
    .trim()
    .regex(HEX_COLOUR, 'Use a colour code like #0a2540 — six characters after the hash.'),
  addressLine1: z.string().trim(),
  addressLine2: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  country: z.string().trim(),
  postalCode: z.string().trim(),
  branchLabel: z.string().trim(),
  branchAddressLine1: z.string().trim(),
  branchAddressLine2: z.string().trim(),
  branchCity: z.string().trim(),
  branchState: z.string().trim(),
  branchCountry: z.string().trim(),
  branchPostalCode: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: 'That does not look like an email address.',
    }),
  phone: z.string().trim(),
  linkedin: socialLink,
  twitter: socialLink,
  facebook: socialLink,
  registeredName: z.string().trim(),
  gstin: z.string().trim().toUpperCase(),
})

/** 15 characters: 2 state digits, 10-character PAN, entity digit, Z, checksum. */
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export async function saveSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  // Site settings affect every journal, so administrators only.
  await requireAdmin()

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors }
  }

  const d = parsed.data

  if (d.gstin && !GSTIN.test(d.gstin)) {
    return {
      status: 'error',
      message: 'Please correct the highlighted fields.',
      fieldErrors: {
        gstin: 'A GSTIN is 15 characters, for example 27AAAAA0000A1Z5. Leave it blank if you do not have one.',
      },
    }
  }

  const socials: Record<string, string> = {}
  if (d.linkedin) socials.linkedin = d.linkedin
  if (d.twitter) socials.twitter = d.twitter
  if (d.facebook) socials.facebook = d.facebook

  const data = {
    name: d.name,
    shortName: d.shortName,
    tagline: d.tagline,
    about: d.about,
    mission: d.mission,
    vision: d.vision,
    primaryColor: d.primaryColor.toLowerCase(),
    addressLine1: d.addressLine1,
    addressLine2: d.addressLine2,
    city: d.city,
    state: d.state,
    country: d.country,
    postalCode: d.postalCode,
    branchLabel: d.branchLabel,
    branchAddressLine1: d.branchAddressLine1,
    branchAddressLine2: d.branchAddressLine2,
    branchCity: d.branchCity,
    branchState: d.branchState,
    branchCountry: d.branchCountry,
    branchPostalCode: d.branchPostalCode,
    email: d.email,
    phone: d.phone,
    socials,
    registeredName: d.registeredName,
    gstin: d.gstin,
  }

  // There is exactly one publisher record, with the fixed id "default".
  await db.publisher.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  })

  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')

  return { status: 'success', message: 'Saved. The site has been updated.' }
}
