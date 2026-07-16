import { render } from '@react-email/render'
import { resend, DEFAULT_FROM_EMAIL } from './resend'
import ReservationConfirmation, { ReservationConfirmationData } from '../emails/templates/ReservationConfirmation'
import { getSiteSettings } from './db/content'

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
      // Inyecta los datos de contacto editables (site_settings) con fallback
      // a los defaults del template si la consulta falla.
      const settings = await getSiteSettings().catch(() => null)
      const enrichedData: ReservationConfirmationData = {
        ...data,
        whatsapp: data.whatsapp ?? settings?.whatsapp,
        email: data.email ?? settings?.email,
        address: data.address ?? settings?.address,
        checkinTime: data.checkinTime ?? settings?.checkinTime,
        checkoutTime: data.checkoutTime ?? settings?.checkoutTime,
      }

      const emailHtml = await render(ReservationConfirmation({ data: enrichedData }))

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
      pricePerNight: 25000, // Para testing de descuentos
    }

    return this.sendReservationConfirmation(testData, { to })
  }
} 