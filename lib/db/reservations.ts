import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
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
// Acceso a datos
// ---------------------------------------------------------------

// (admin) Todas las reservas, opcionalmente filtradas por cabaña y/o estado.
export async function getReservations(filters?: {
    cabinSlug?: string
    state?: string
}): Promise<Reservation[]> {
    const supabase = createAdminClient()
    let query = supabase.from('reservations').select('*').order('check_in', { ascending: true })

    if (filters?.cabinSlug) query = query.eq('cabin_slug', filters.cabinSlug)
    if (filters?.state) query = query.eq('state', filters.state)

    const { data, error } = await query
    if (error) throw new Error(`Error obteniendo reservas: ${error.message}`)
    return (data as ReservationRow[]).map(rowToReservation)
}

// Rangos ocupados públicos (confirmadas, bloqueadas y pendientes). Sin datos personales.
export async function getPublicAvailability(cabinSlug: string): Promise<AvailabilityRange[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('reservations')
        .select('check_in, check_out, state')
        .eq('cabin_slug', cabinSlug)
        .in('state', OVERLAP_STATES)
        .order('check_in', { ascending: true })

    if (error) throw new Error(`Error obteniendo disponibilidad: ${error.message}`)
    return (data as Pick<ReservationRow, 'check_in' | 'check_out' | 'state'>[]).map(rowToAvailabilityRange)
}

// Chequeo de solapamiento: check_in < :checkOut AND check_out > :checkIn
// AND state IN (confirmed, blocked, pending). Se incluye `pending` para no
// ofrecer fechas con un pago en curso.
export async function checkDateAvailability(
    cabinSlug: string,
    checkIn: string,
    checkOut: string,
): Promise<{ isAvailable: boolean; conflictingReservations: AvailabilityRange[] }> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('reservations')
        .select('check_in, check_out, state')
        .eq('cabin_slug', cabinSlug)
        .in('state', OVERLAP_STATES)
        .lt('check_in', checkOut)
        .gt('check_out', checkIn)

    if (error) throw new Error(`Error verificando disponibilidad: ${error.message}`)
    const conflicts = (data as Pick<ReservationRow, 'check_in' | 'check_out' | 'state'>[]).map(rowToAvailabilityRange)
    return { isAvailable: conflicts.length === 0, conflictingReservations: conflicts }
}

// Busca una reserva por el id de pago de MercadoPago. Sirve de guard de
// idempotencia en el webhook: MP entrega múltiples notificaciones por pago.
export async function getReservationByMpPaymentId(mpPaymentId: string): Promise<Reservation | null> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('mp_payment_id', mpPaymentId)
        .limit(1)

    if (error) throw new Error(`Error obteniendo reserva por pago: ${error.message}`)
    const rows = data as ReservationRow[]
    return rows.length > 0 ? rowToReservation(rows[0]) : null
}

// Crea una reserva. La constraint `no_overlap` (código Postgres 23P01) se
// traduce a Error('DATE_CONFLICT') para que las rutas respondan 409. La
// violación del índice único parcial sobre `mp_payment_id` (código Postgres
// 23505, unique_violation) se traduce a Error('DUPLICATE_MP_PAYMENT'): es el
// backstop de idempotencia del webhook (dos notificaciones aprobadas del mismo
// pago no pueden generar dos reservas), y el webhook lo trata como "ya procesado".
export async function createReservation(input: ReservationInput): Promise<Reservation> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('reservations')
        .insert(reservationToRow(input))
        .select('*')
        .single()

    if (error) {
        if (error.code === '23P01') throw new Error('DATE_CONFLICT')
        if (error.code === '23505') throw new Error('DUPLICATE_MP_PAYMENT')
        throw new Error(`Error creando reserva: ${error.message}`)
    }
    return rowToReservation(data as ReservationRow)
}

export async function updateReservation(id: string, patch: Partial<ReservationInput>): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('reservations')
        .update(reservationPatchToRow(patch))
        .eq('id', id)

    if (error) {
        if (error.code === '23P01') throw new Error('DATE_CONFLICT')
        throw new Error(`Error actualizando reserva: ${error.message}`)
    }
}

export async function confirmReservation(id: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('reservations')
        .update({ state: 'confirmed' })
        .eq('id', id)

    if (error) {
        if (error.code === '23P01') throw new Error('DATE_CONFLICT')
        throw new Error(`Error confirmando reserva: ${error.message}`)
    }
}

export async function cancelReservation(id: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('reservations')
        .update({ state: 'cancelled' })
        .eq('id', id)

    if (error) throw new Error(`Error cancelando reserva: ${error.message}`)
}

// 'CAL-' + 8 caracteres alfanuméricos en mayúsculas (misma semántica que la ruta previa).
export function generateReservationCode(): string {
    return 'CAL-' + Math.random().toString(36).substring(2, 10).toUpperCase()
}
