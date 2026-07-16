import 'server-only'
import {
    getReservations,
    createReservation,
    updateReservation,
    cancelReservation,
} from '@/lib/db/reservations'
import { getAirbnbSyncConfigs } from '@/lib/db/cabins'
import { parseAirbnbICalEvents, airbnbEventToReservation } from '@/utils/ical-generator'
import type { Reservation, ReservationInput } from '@/types/db'

// Timeout de fetch del iCal de Airbnb (ms).
const ICAL_FETCH_TIMEOUT_MS = 10_000

// ---------------------------------------------------------------
// Utilidades puras
// ---------------------------------------------------------------

// Formatea un Date a 'YYYY-MM-DD' de forma consistente con el origen de los datos.
// `rowToReservation` construye checkIn/checkOut con `new Date('YYYY-MM-DD')`, que
// interpreta la fecha como medianoche UTC. Usamos los getters UTC (NO `format` de
// date-fns, que es local-time) para que una reserva sin cambios jamás derive en
// una fecha distinta por el offset de la zona horaria.
export function toDateString(date: Date): string {
    return date.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------
// Diff puro (testeable sin DB)
// ---------------------------------------------------------------

export interface AirbnbDiff {
    toCreate: ReservationInput[]
    toUpdate: { id: string; input: ReservationInput }[]
    toCancel: string[] // ids de reservas a cancelar
}

/**
 * Calcula el diff entre las reservas de Airbnb ya persistidas (`existing`) y las
 * entrantes del feed iCal (`incoming`). La clave de matcheo es `externalId`.
 *
 * - toCreate: incoming cuyo externalId no existe entre las reservas airbnb.
 * - toUpdate: incoming cuyo externalId existe y cambió checkIn/checkOut/guestName.
 * - toCancel: reservas airbnb (no canceladas) cuyo externalId desapareció del feed.
 *
 * Las reservas con source !== 'airbnb' JAMÁS entran en ningún bucket.
 */
export function diffAirbnbEvents(existing: Reservation[], incoming: ReservationInput[]): AirbnbDiff {
    const existingAirbnb = existing.filter((r) => r.source === 'airbnb')

    // Índice por externalId de las reservas airbnb existentes.
    const byExternalId = new Map<string, Reservation>()
    for (const r of existingAirbnb) {
        if (r.externalId) byExternalId.set(r.externalId, r)
    }

    const incomingExternalIds = new Set<string>()

    const toCreate: ReservationInput[] = []
    const toUpdate: { id: string; input: ReservationInput }[] = []

    for (const input of incoming) {
        if (!input.externalId) continue // sin clave de matcheo no es procesable
        incomingExternalIds.add(input.externalId)

        const match = byExternalId.get(input.externalId)
        if (!match) {
            toCreate.push(input)
            continue
        }

        const changed =
            toDateString(match.checkIn) !== input.checkIn ||
            toDateString(match.checkOut) !== input.checkOut ||
            match.guestName !== input.guestName

        if (changed) toUpdate.push({ id: match.id, input })
    }

    const toCancel = existingAirbnb
        .filter((r) => r.state !== 'cancelled' && (!r.externalId || !incomingExternalIds.has(r.externalId)))
        .map((r) => r.id)

    return { toCreate, toUpdate, toCancel }
}

// ---------------------------------------------------------------
// Orquestación (con acceso a DB)
// ---------------------------------------------------------------

export interface CabinSyncResult {
    cabin: string
    created: number
    updated: number
    cancelled: number
    error?: string
}

// Descarga el iCal de Airbnb con timeout de 10s (AbortController).
async function fetchIcal(url: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ICAL_FETCH_TIMEOUT_MS)
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Calandrias-Sync/1.0' },
            signal: controller.signal,
        })
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.text()
    } finally {
        clearTimeout(timeout)
    }
}

// Mapea el objeto que produce `airbnbEventToReservation` (fechas como Date) a
// ReservationInput (fechas como 'YYYY-MM-DD') para persistir vía lib/db.
function toReservationInput(cabinSlug: string, event: Parameters<typeof airbnbEventToReservation>[0]): ReservationInput {
    const mapped = airbnbEventToReservation(event, cabinSlug)
    return {
        cabinId: cabinSlug,
        checkIn: toDateString(mapped.checkIn),
        checkOut: toDateString(mapped.checkOut),
        guestName: mapped.guestName,
        guestEmail: mapped.guestEmail ?? '',
        guests: mapped.guests,
        pets: mapped.pets,
        state: 'confirmed',
        source: 'airbnb',
        externalId: mapped.externalId,
        reservationCode: mapped.reservationCode || undefined,
    }
}

/**
 * Sincroniza cada cabaña configurada con su feed iCal de Airbnb. Los errores por
 * cabaña se capturan y se reportan en el campo `error` de esa cabaña sin abortar
 * el resto. Un DATE_CONFLICT al crear (evento de Airbnb solapando una reserva
 * directa/manual) no rompe la sync: se cuenta y se continúa.
 */
export async function runAirbnbSync(): Promise<CabinSyncResult[]> {
    const configs = await getAirbnbSyncConfigs()
    const results: CabinSyncResult[] = []

    for (const config of configs) {
        const { cabinSlug, cabinName } = config
        let created = 0
        let updated = 0
        let cancelled = 0
        let conflicts = 0

        try {
            const icalContent = await fetchIcal(config.icalUrl)
            const events = parseAirbnbICalEvents(icalContent)
            const incoming = events.map((e) => toReservationInput(cabinSlug, e))

            const existing = (await getReservations({ cabinSlug })).filter((r) => r.source === 'airbnb')
            const { toCreate, toUpdate, toCancel } = diffAirbnbEvents(existing, incoming)

            for (const input of toCreate) {
                try {
                    await createReservation(input)
                    created++
                } catch (err) {
                    // Un evento de Airbnb puede solapar una reserva directa/manual ya cargada.
                    if (err instanceof Error && err.message === 'DATE_CONFLICT') {
                        conflicts++
                        continue
                    }
                    throw err
                }
            }

            for (const { id, input } of toUpdate) {
                await updateReservation(id, {
                    checkIn: input.checkIn,
                    checkOut: input.checkOut,
                    guestName: input.guestName,
                })
                updated++
            }

            for (const id of toCancel) {
                await cancelReservation(id)
                cancelled++
            }

            const result: CabinSyncResult = { cabin: cabinName || cabinSlug, created, updated, cancelled }
            if (conflicts > 0) {
                result.error = `${conflicts} evento(s) de Airbnb en conflicto con reservas existentes (omitidos)`
            }
            results.push(result)
        } catch (err) {
            results.push({
                cabin: cabinName || cabinSlug,
                created,
                updated,
                cancelled,
                error: err instanceof Error ? err.message : 'Error desconocido',
            })
        }
    }

    return results
}
