import type { ReservationPaymentData } from '@/types/payment'
import type { ReservationInput } from '@/types/db'

// ---------------------------------------------------------------
// Metadata de MercadoPago (funciones puras, testeables sin red ni DB)
// ---------------------------------------------------------------
//
// MercadoPago convierte las claves del `metadata` de camelCase a snake_case:
// lo que enviamos como `cabinId` se lee luego como `cabin_id`. Por eso el
// productor (`buildPreferenceMetadata`) usa camelCase y el consumidor
// (`metadataToReservationInput`) lee snake_case.
//
// `cabinId`/`cabin_id` transporta el SLUG de la cabaña.

/** Metadata camelCase que viaja en la preferencia de MP. */
export function buildPreferenceMetadata(
    data: ReservationPaymentData,
): Record<string, string> {
    return {
        reservationId: data.reservationId ?? '',
        cabinId: data.cabinId,
        cabinName: data.cabinName,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests.toString(),
        pets: data.pets.toString(),
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone ?? '',
        specialRequests: data.specialRequests ?? '',
        totalAmount: data.totalAmount.toString(),
        pricePerNight: data.pricePerNight?.toString() ?? '',
    }
}

/** Datos del pago aprobado con los que enriquecer la reserva. */
export interface WebhookPaymentInfo {
    paymentId: string
    transactionAmount: number
    dateApproved?: string
}

function asString(value: unknown): string {
    return value === undefined || value === null ? '' : String(value)
}

function asInt(value: unknown, fallback: number): number {
    const parsed = parseInt(asString(value), 10)
    return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Traduce el metadata snake_case de MP a un `ReservationInput`.
 * La reserva nace `confirmed`/`direct`. Si se provee `payment`, se
 * completan los campos de pago y `totalPrice` con el monto realmente cobrado.
 */
export function metadataToReservationInput(
    md: Record<string, unknown>,
    payment?: WebhookPaymentInfo,
): ReservationInput {
    const specialRequests = asString(md.special_requests)
    const metadataAmount = md.total_amount !== undefined ? Number(md.total_amount) : undefined

    const input: ReservationInput = {
        cabinId: asString(md.cabin_id),
        checkIn: asString(md.check_in),
        checkOut: asString(md.check_out),
        guestName: asString(md.guest_name),
        guestEmail: asString(md.guest_email),
        guestPhone: asString(md.guest_phone) || undefined,
        guests: asInt(md.guests, 1) || 1,
        pets: asInt(md.pets, 0),
        state: 'confirmed',
        source: 'direct',
        currency: 'ARS',
        specialRequests: specialRequests || undefined,
        totalPrice: metadataAmount !== undefined && Number.isFinite(metadataAmount) ? metadataAmount : undefined,
    }

    if (payment) {
        input.mpPaymentId = payment.paymentId
        input.paymentStatus = 'approved'
        input.paidAmount = payment.transactionAmount
        input.totalPrice = payment.transactionAmount
        input.paymentDate = payment.dateApproved
    }

    return input
}
