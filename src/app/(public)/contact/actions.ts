'use server'

import { z } from 'zod'
import { db } from '@/lib/db'
import { sendMail } from '@/lib/mail'

export type ContactState = { status: 'idle' | 'error' | 'success'; message?: string }

const schema = z.object({
  name: z.string().min(2, 'Please give your name.'),
  email: z.string().email('Please give a valid email address.'),
  subject: z.string().max(200).optional().default(''),
  message: z.string().min(20, 'Please write at least a couple of sentences.').max(5000),
  website: z.string().max(0).optional().default(''), // honeypot
})

// Crude in-process rate limit — enough to stop casual form spam. A multi-instance
// deployment should move this to the database or a shared cache.
const recent = new Map<string, number[]>()
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5

function rateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(key, hits)
    return true
  }
  hits.push(now)
  recent.set(key, hits)
  return false
}

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()))

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  }

  // Honeypot filled — accept silently so the bot does not learn anything
  if (parsed.data.website) return { status: 'success' }

  if (rateLimited(parsed.data.email.toLowerCase())) {
    return {
      status: 'error',
      message: 'You have sent several messages recently. Please try again later.',
    }
  }

  await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  })

  const to = process.env.EDITOR_NOTIFICATION_EMAIL
  if (to) {
    await sendMail({
      to,
      subject: `Contact form: ${parsed.data.subject || 'No subject'}`,
      html: `<div style="font-family: sans-serif; line-height: 1.6;">
        <p><strong>From:</strong> ${parsed.data.name} &lt;${parsed.data.email}&gt;</p>
        <p><strong>Subject:</strong> ${parsed.data.subject || '—'}</p>
        <hr>
        <p style="white-space: pre-wrap;">${parsed.data.message}</p>
      </div>`,
    })
  }

  return { status: 'success' }
}
