// Helpers PUROS de presentación para el módulo de Reservas del backoffice.
// Sin acceso a DB ni a `server-only`: se importan tanto desde Server Components
// (page/actions) como desde Client Components (tabla/dialog), y son testeables.
import type { Reservation, ReservationState, ReservationSource } from '@/types/db'

// Vista serializable de una reserva para pasar de Server → Client Components.
// Las fechas viajan como 'YYYY-MM-DD' (strings) para evitar tanto la
// (de)serialización de Date como el bug de corrimiento por zona horaria.
export interface ReservationView {
    id: string
    cabinId: string
    checkIn: string // YYYY-MM-DD
    checkOut: string // YYYY-MM-DD
    guestName: string
    guests: number
    pets: number
    state: ReservationState
    source: ReservationSource
    totalPrice?: number
    currency?: string
    reservationCode?: string
}

// Meses abreviados en español (índice 0 = enero).
const MESES_CORTOS = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const

// Date → 'YYYY-MM-DD' usando getters UTC. `rowToReservation` construye las fechas
// con `new Date('YYYY-MM-DD')` (medianoche UTC), así que UTC evita el corrimiento.
export function toISODate(date: Date): string {
    return date.toISOString().slice(0, 10)
}

export function toReservationView(r: Reservation): ReservationView {
    return {
        id: r.id,
        cabinId: r.cabinId,
        checkIn: toISODate(r.checkIn),
        checkOut: toISODate(r.checkOut),
        guestName: r.guestName,
        guests: r.guests,
        pets: r.pets,
        state: r.state,
        source: r.source,
        totalPrice: r.totalPrice,
        currency: r.currency,
        reservationCode: r.reservationCode,
    }
}

// 'YYYY-MM-DD' → '12 mar'. Parseamos los componentes a mano (sin `new Date`)
// para que el formateo sea 100% independiente de la zona horaria del runtime.
export function formatShortDate(iso: string): string {
    const [, month, day] = iso.split('-').map(Number)
    return `${day} ${MESES_CORTOS[month - 1]}`
}

export function formatDateRange(checkIn: string, checkOut: string): string {
    return `${formatShortDate(checkIn)} → ${formatShortDate(checkOut)}`
}

export interface ReservationStats {
    confirmed: number
    pending: number
    thisMonth: number
}

// `monthKey`: 'YYYY-MM' del mes en curso. "Este mes" = reservas cuyo check-in
// cae en ese mes (cualquier estado).
export function reservationStats(views: ReservationView[], monthKey: string): ReservationStats {
    return {
        confirmed: views.filter((v) => v.state === 'confirmed').length,
        pending: views.filter((v) => v.state === 'pending').length,
        thisMonth: views.filter((v) => v.checkIn.slice(0, 7) === monthKey).length,
    }
}

// Orden ascendente por check-in (las próximas primero). Las fechas son
// 'YYYY-MM-DD', comparables lexicográficamente. No muta el array de entrada.
export function sortByCheckIn(views: ReservationView[]): ReservationView[] {
    return [...views].sort((a, b) => a.checkIn.localeCompare(b.checkIn))
}

// Conteos de una corrida de sync por cabaña (estructura de CabinSyncResult).
export interface SyncCount {
    created: number
    updated: number
    cancelled: number
    error?: string
}

// "2 nuevas, 1 actualizada, 0 canceladas" (+ "· N cabaña(s) con error").
export function summarizeSync(results: SyncCount[]): string {
    if (results.length === 0) return 'No hay cabañas configuradas para sincronizar'

    const created = results.reduce((n, r) => n + r.created, 0)
    const updated = results.reduce((n, r) => n + r.updated, 0)
    const cancelled = results.reduce((n, r) => n + r.cancelled, 0)
    const errors = results.filter((r) => r.error).length

    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
    let summary = [
        plural(created, 'nueva', 'nuevas'),
        plural(updated, 'actualizada', 'actualizadas'),
        plural(cancelled, 'cancelada', 'canceladas'),
    ].join(', ')

    if (errors > 0) {
        summary += ` · ${plural(errors, 'cabaña con error', 'cabañas con error')}`
    }
    return summary
}
