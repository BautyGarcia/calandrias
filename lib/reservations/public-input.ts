import { z } from 'zod'

// Formato de fecha aceptado en el body público (YYYY-MM-DD).
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Schema público endurecido de creación de reserva.
//
// Sólo acepta los campos que el huésped controla legítimamente. Con `.strict()`
// cualquier clave desconocida (state, source, totalPrice, currency,
// reservationCode, externalId, ...) hace fallar la validación con 400. El
// servidor es la única fuente de verdad para state/source/currency/
// reservationCode y el precio total (que se recalcula, no se acepta del cliente).
export const PublicReservationSchema = z
    .object({
        cabinId: z.string().min(1, 'cabinId requerido'),
        checkIn: z.string().regex(DATE_RE, 'checkIn debe tener formato YYYY-MM-DD'),
        checkOut: z.string().regex(DATE_RE, 'checkOut debe tener formato YYYY-MM-DD'),
        guestName: z.string().min(2, 'Nombre requerido'),
        guestEmail: z.string().email('Email inválido'),
        guestPhone: z.string().optional(),
        guests: z.number().int().min(1, 'Mínimo 1 huésped'),
        pets: z.number().int().min(0, 'pets no puede ser negativo').default(0),
        specialRequests: z.string().optional(),
    })
    .strict()
    .refine((data) => data.checkOut > data.checkIn, {
        message: 'checkOut debe ser posterior a checkIn',
        path: ['checkOut'],
    })

export type PublicReservationInput = z.infer<typeof PublicReservationSchema>

// Parseo puro (sin red ni DB) para poder testear el schema sin servidor.
export function parsePublicReservationInput(input: unknown) {
    return PublicReservationSchema.safeParse(input)
}
