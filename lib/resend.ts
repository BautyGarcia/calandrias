import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'reservas@las-calandrias.com'
export const DEFAULT_REPLY_TO = process.env.RESEND_REPLY_TO || 'info@las-calandrias.com' 