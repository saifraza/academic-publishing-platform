import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM ?? 'Publisher <noreply@example.com>'

const resend = apiKey ? new Resend(apiKey) : null

type SendArgs = {
  to: string | string[]
  subject: string
  html: string
}

/**
 * Sends mail through Resend when a key is configured. With no key — which is
 * the normal local-development case — it logs instead of throwing, so nothing
 * in the submission flow depends on email being set up.
 */
export async function sendMail({ to, subject, html }: SendArgs): Promise<{ ok: boolean }> {
  if (!resend) {
    console.log('\n[mail] RESEND_API_KEY not set — email not sent')
    console.log(`[mail] to:      ${Array.isArray(to) ? to.join(', ') : to}`)
    console.log(`[mail] subject: ${subject}\n`)
    return { ok: true }
  }

  try {
    await resend.emails.send({ from, to, subject, html })
    return { ok: true }
  } catch (err) {
    console.error('[mail] send failed:', err)
    return { ok: false }
  }
}

export function submissionReceivedEmail(args: {
  authorName: string
  trackingId: string
  title: string
  journalName: string
  siteUrl: string
}) {
  return `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; color: #0a2540; line-height: 1.6; max-width: 560px;">
      <p>Dear ${args.authorName},</p>
      <p>Thank you for submitting your manuscript to <strong>${args.journalName}</strong>. We have received it and it has entered our editorial screening process.</p>
      <table style="border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr><td style="padding: 6px 16px 6px 0; color: #47739f;">Tracking ID</td><td style="padding: 6px 0;"><strong>${args.trackingId}</strong></td></tr>
        <tr><td style="padding: 6px 16px 6px 0; color: #47739f;">Title</td><td style="padding: 6px 0;">${args.title}</td></tr>
      </table>
      <p>Please keep your tracking ID. You can check the status of your submission at any time at <a href="${args.siteUrl}/track">${args.siteUrl}/track</a> using the tracking ID and the email address you submitted with.</p>
      <p>We aim to return a first decision within eight weeks. We will write to you if your manuscript is delayed beyond that.</p>
      <p>Kind regards,<br>The Editorial Office</p>
    </div>`
}

export function editorNotificationEmail(args: {
  trackingId: string
  title: string
  journalName: string
  authorName: string
  authorEmail: string
  siteUrl: string
}) {
  return `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; color: #0a2540; line-height: 1.6; max-width: 560px;">
      <p><strong>New submission received</strong></p>
      <table style="border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding: 6px 16px 6px 0; color: #47739f;">Journal</td><td style="padding: 6px 0;">${args.journalName}</td></tr>
        <tr><td style="padding: 6px 16px 6px 0; color: #47739f;">Tracking ID</td><td style="padding: 6px 0;"><strong>${args.trackingId}</strong></td></tr>
        <tr><td style="padding: 6px 16px 6px 0; color: #47739f;">Title</td><td style="padding: 6px 0;">${args.title}</td></tr>
        <tr><td style="padding: 6px 16px 6px 0; color: #47739f;">Author</td><td style="padding: 6px 0;">${args.authorName} &lt;${args.authorEmail}&gt;</td></tr>
      </table>
      <p><a href="${args.siteUrl}/admin/submissions">Open in the admin panel</a></p>
    </div>`
}
