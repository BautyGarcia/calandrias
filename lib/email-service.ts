import { render } from '@react-email/render'
import { resend, DEFAULT_FROM_EMAIL } from './resend'
import ReservationConfirmation, { ReservationConfirmationData } from '../emails/templates/ReservationConfirmation'

interface SendEmailOptions {
  to: string
  subject: string
  from?: string
  replyTo?: string
}

// Sanitize tag values to only contain ASCII letters, numbers, underscores, or dashes
function sanitizeTagValue(value: string): string {
  return value
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-') // Replace invalid chars with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
}

export class EmailService {
  static async sendReservationConfirmation(
    data: ReservationConfirmationData,
    options: Omit<SendEmailOptions, 'subject'>
  ) {
    try {
      const emailHtml = await render(ReservationConfirmation({ data }))
      
      const result = await resend.emails.send({
        from: options.from || DEFAULT_FROM_EMAIL,
        to: options.to,
        subject: `Confirmación de Reserva - ${data.cabinName}`,
        html: emailHtml,
        tags: [
          { name: 'category', value: 'reservation-confirmation' },
          { name: 'cabin', value: sanitizeTagValue(data.cabinName) },
          { name: 'reservation-code', value: sanitizeTagValue(data.reservationCode) },
        ],
      })

      if (result.error) {
        throw new Error(`Failed to send email: ${result.error.message}`)
      }

      return result.data
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error)
      throw error
    }
  }

  // Método utilitario para testing en desarrollo
  static async sendTestEmail(to: string) {
    const testData: ReservationConfirmationData = {
      guestName: 'Juan Pérez',
      guestEmail: to,
      cabinName: 'Refugio Íntimo',
      checkIn: new Date('2025-03-15'),
      checkOut: new Date('2025-03-17'),
      totalPrice: 45000,
      reservationCode: 'CAL-2025-001',
      paymentId: 'mp_test_123456',
    }

    return this.sendReservationConfirmation(testData, { to })
  }
} 