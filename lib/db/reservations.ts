import 'server-only'
import { and, asc, eq, gt, inArray, lt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { reservations } from '@/lib/schema'
import { errorMessage, pgErrorCode } from '@/lib/db/errors'
import type {
    Reservation,
    ReservationInput,
    ReservationState,
    ReservationSource,
    AvailabilityRange,
} from '@/types/db'
import type { PaymentStatus } from '@/types/payment'

// Fila tal como vive en Postgres (snake_case).
export interface ReservationRow {
    id: string
    cabin_slug: string
    check_in: string
    check_out: string
    guest_name: string
    guest_email: string
    guest_phone: string | null
    guests: number
    pets: number
    state: ReservationState
    source: ReservationSource
    external_id: string | null
    reservation_code: string | null
    total_price: number | null
    currency: string
    special_requests: string | null
    mp_payment_id: string | null
    mp_preference_id: string | null
    payment_status: string | null
    payment_method: string | null
    paid_amount: number | null
    payment_date: string | null
    created_at: string
    updated_at: string
}

// Fila lista para INSERT/UPDATE (sin columnas gestionadas por la DB).
export type ReservationWriteRow = Omit<ReservationRow, 'id' | 'created_at' | 'updated_at'>

const OVERLAP_STATES: ReservationState[] = ['confirmed', 'blocked', 'pending']

// ---------------------------------------------------------------
// Mappers puros (testeables sin DB)
// ---------------------------------------------------------------

export function rowToReservation(row: ReservationRow): Reservation {
    return {
        id: row.id,
        cabinId: row.cabin_slug,
        checkIn: new Date(row.check_in),
        checkOut: new Date(row.check_out),
        guestName: row.guest_name,
        guestEmail: row.guest_email,
        guestPhone: row.guest_phone ?? undefined,
        guests: row.guests,
        pets: row.pets,
        state: row.state,
        source: row.source,
        externalId: row.external_id ?? undefined,
        reservationCode: row.reservation_code ?? undefined,
        totalPrice: row.total_price ?? undefined,
        currency: row.currency ?? undefined,
        specialRequests: row.special_requests ?? undefined,
        mpPaymentId: row.mp_payment_id ?? undefined,
        mpPreferenceId: row.mp_preference_id ?? undefined,
        paymentStatus: (row.payment_status as PaymentStatus | null) ?? undefined,
        paymentMethod: row.payment_method ?? undefined,
        paidAmount: row.paid_amount ?? undefined,
        paymentDate: row.payment_date ? new Date(row.payment_date) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    }
}

export function reservationToRow(input: ReservationInput): ReservationWriteRow {
    return {
        cabin_slug: input.cabinId,
        check_in: input.checkIn,
        check_out: input.checkOut,
        guest_name: input.guestName,
        guest_email: input.guestEmail,
        guest_phone: input.guestPhone ?? null,
        guests: input.guests,
        pets: input.pets,
        state: input.state,
        source: input.source,
        external_id: input.externalId ?? null,
        reservation_code: input.reservationCode ?? null,
        total_price: input.totalPrice ?? null,
        currency: input.currency ?? 'ARS',
        special_requests: input.specialRequests ?? null,
        mp_payment_id: input.mpPaymentId ?? null,
        mp_preference_id: input.mpPreferenceId ?? null,
        payment_status: input.paymentStatus ?? null,
        payment_method: input.paymentMethod ?? null,
        paid_amount: input.paidAmount ?? null,
        payment_date: input.paymentDate ?? null,
    }
}

// Mapea sólo las claves presentes de un patch parcial (para UPDATE).
function reservationPatchToRow(patch: Partial<ReservationInput>): Partial<ReservationWriteRow> {
    const row: Partial<ReservationWriteRow> = {}
    if (patch.cabinId !== undefined) row.cabin_slug = patch.cabinId
    if (patch.checkIn !== undefined) row.check_in = patch.checkIn
    if (patch.checkOut !== undefined) row.check_out = patch.checkOut
    if (patch.guestName !== undefined) row.guest_name = patch.guestName
    if (patch.guestEmail !== undefined) row.guest_email = patch.guestEmail
    if (patch.guestPhone !== undefined) row.guest_phone = patch.guestPhone ?? null
    if (patch.guests !== undefined) row.guests = patch.guests
    if (patch.pets !== undefined) row.pets = patch.pets
    if (patch.state !== undefined) row.state = patch.state
    if (patch.source !== undefined) row.source = patch.source
    if (patch.externalId !== undefined) row.external_id = patch.externalId ?? null
    if (patch.reservationCode !== undefined) row.reservation_code = patch.reservationCode ?? null
    if (patch.totalPrice !== undefined) row.total_price = patch.totalPrice ?? null
    if (patch.currency !== undefined) row.currency = patch.currency ?? 'ARS'
    if (patch.specialRequests !== undefined) row.special_requests = patch.specialRequests ?? null
    if (patch.mpPaymentId !== undefined) row.mp_payment_id = patch.mpPaymentId ?? null
    if (patch.mpPreferenceId !== undefined) row.mp_preference_id = patch.mpPreferenceId ?? null
    if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus ?? null
    if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod ?? null
    if (patch.paidAmount !== undefined) row.paid_amount = patch.paidAmount ?? null
    if (patch.paymentDate !== undefined) row.payment_date = patch.paymentDate ?? null
    return row
}

function rowToAvailabilityRange(row: Pick<ReservationRow, 'check_in' | 'check_out' | 'state'>): AvailabilityRange {
    return {
        checkIn: row.check_in,
        checkOut: row.check_out,
        state: row.state as AvailabilityRange['state'],
    }
}

// ---------------------------------------------------------------
// Acceso a datos (todo en el server; sin RLS)
// ---------------------------------------------------------------

const availabilityColumns = {
    check_in: reservations.check_in,
    check_out: reservations.check_out,
    state: reservations.state,
}

// (admin) Todas las reservas, opcionalmente filtradas por cabaña y/o estado.
export async function getReservations(filters?: {
    cabinSlug?: string
    state?: string
}): Promise<Reservation[]> {
    const conditions = []
    if (filters?.cabinSlug) conditions.push(eq(reservations.cabin_slug, filters.cabinSlug))
    if (filters?.state) conditions.push(eq(reservations.state, filters.state as ReservationState))

    try {
        const rows = await db
            .select()
            .from(reservations)
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(asc(reservations.check_in))
        return rows.map(rowToReservation)
    } catch (e) {
        throw new Error(`Error obteniendo reservas: ${errorMessage(e)}`)
    }
}

// Rangos ocupados públicos (confirmadas, bloqueadas y pendientes). Sin datos personales.
export async function getPublicAvailability(cabinSlug: string): Promise<AvailabilityRange[]> {
    try {
        const rows = await db
            .select(availabilityColumns)
            .from(reservations)
            .where(and(eq(reservations.cabin_slug, cabinSlug), inArray(reservations.state, OVERLAP_STATES)))
            .orderBy(asc(reservations.check_in))
        return rows.map(rowToAvailabilityRange)
    } catch (e) {
        throw new Error(`Error obteniendo disponibilidad: ${errorMessage(e)}`)
    }
}

// Chequeo de solapamiento: check_in < :checkOut AND check_out > :checkIn
// AND state IN (confirmed, blocked, pending). Se incluye `pending` para no
// ofrecer fechas con un pago en curso.
export async function checkDateAvailability(
    cabinSlug: string,
    checkIn: string,
    checkOut: string,
): Promise<{ isAvailable: boolean; conflictingReservations: AvailabilityRange[] }> {
    try {
        const rows = await db
            .select(availabilityColumns)
            .from(reservations)
            .where(
                and(
                    eq(reservations.cabin_slug, cabinSlug),
                    inArray(reservations.state, OVERLAP_STATES),
                    lt(reservations.check_in, checkOut),
                    gt(reservations.check_out, checkIn),
                ),
            )
        const conflicts = rows.map(rowToAvailabilityRange)
        return { isAvailable: conflicts.length === 0, conflictingReservations: conflicts }
    } catch (e) {
        throw new Error(`Error verificando disponibilidad: ${errorMessage(e)}`)
    }
}

// Busca una reserva por el id de pago de MercadoPago. Sirve de guard de
// idempotencia en el webhook: MP entrega múltiples notificaciones por pago.
export async function getReservationByMpPaymentId(mpPaymentId: string): Promise<Reservation | null> {
    try {
        const [row] = await db.select().from(reservations).where(eq(reservations.mp_payment_id, mpPaymentId)).limit(1)
        return row ? rowToReservation(row) : null
    } catch (e) {
        throw new Error(`Error obteniendo reserva por pago: ${errorMessage(e)}`)
    }
}

// Crea una reserva. La constraint `no_overlap` (código Postgres 23P01) se
// traduce a Error('DATE_CONFLICT') para que las rutas respondan 409. La
// violación del índice único parcial sobre `mp_payment_id` (código Postgres
// 23505, unique_violation) se traduce a Error('DUPLICATE_MP_PAYMENT'): es el
// backstop de idempotencia del webhook (dos notificaciones aprobadas del mismo
// pago no pueden generar dos reservas), y el webhook lo trata como "ya procesado".
export async function createReservation(input: ReservationInput): Promise<Reservation> {
    try {
        const [row] = await db.insert(reservations).values(reservationToRow(input)).returning()
        return rowToReservation(row)
    } catch (e) {
        const code = pgErrorCode(e)
        if (code === '23P01') throw new Error('DATE_CONFLICT')
        if (code === '23505') throw new Error('DUPLICATE_MP_PAYMENT')
        throw new Error(`Error creando reserva: ${errorMessage(e)}`)
    }
}

export async function updateReservation(id: string, patch: Partial<ReservationInput>): Promise<void> {
    const row = reservationPatchToRow(patch)
    if (Object.keys(row).length === 0) return
    try {
        await db.update(reservations).set(row).where(eq(reservations.id, id))
    } catch (e) {
        if (pgErrorCode(e) === '23P01') throw new Error('DATE_CONFLICT')
        throw new Error(`Error actualizando reserva: ${errorMessage(e)}`)
    }
}

export async function confirmReservation(id: string): Promise<void> {
    try {
        await db.update(reservations).set({ state: 'confirmed' }).where(eq(reservations.id, id))
    } catch (e) {
        if (pgErrorCode(e) === '23P01') throw new Error('DATE_CONFLICT')
        throw new Error(`Error confirmando reserva: ${errorMessage(e)}`)
    }
}

export async function cancelReservation(id: string): Promise<void> {
    try {
        await db.update(reservations).set({ state: 'cancelled' }).where(eq(reservations.id, id))
    } catch (e) {
        throw new Error(`Error cancelando reserva: ${errorMessage(e)}`)
    }
}

// 'CAL-' + 8 caracteres alfanuméricos en mayúsculas (misma semántica que la ruta previa).
export function generateReservationCode(): string {
    return 'CAL-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}
