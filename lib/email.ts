import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const defaultFrom = process.env.EMAIL_FROM || "XP System <no-reply@example.com>"
const defaultTo = process.env.EMAIL_TO || "chinmaypisal1718@gmail.com"

export const emailEnabled = Boolean(resendApiKey)

export async function sendMail(opts: { to?: string; subject: string; html: string; from?: string }) {
  if (!resendApiKey) {
    return { success: false, error: "RESEND_API_KEY missing" }
  }

  const resend = new Resend(resendApiKey)
  const to = opts.to || defaultTo
  const from = opts.from || defaultFrom

  try {
    const { error } = await resend.emails.send({
      to,
      from,
      subject: opts.subject,
      html: opts.html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "unknown email error" }
  }
}
