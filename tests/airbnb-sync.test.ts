import { describe, it, expect } from 'vitest'
import { diffAirbnbEvents } from '@/lib/airbnb-sync'
import { rowToReservation, type ReservationRow } from '@/lib/db/reservations'
import type { ReservationInput } from '@/types/db'

// Helper: construye una Reservation existente igual que la DB (via rowToReservation),
// para probar la consistencia de zona horaria (check_in es un `date` de Postgres).
function existingAirbnb(overrides: Partial<ReservationRow> = {}) {
    const row: ReservationRow = {
        id: 'res-1',
        cabin_slug: 'el-roble',
        check_in: '2026-01-10',
        check_out: '2026-01-15',
        guest_name: 'Huésped de Airbnb',
        guest_email: '',
        guest_phone: null,
        guests: 1,
        pets: 0,
        state: 'confirmed',
        source: 'airbnb',
        external_id: 'evt-1',
        reservation_code: null,
        total_price: null,
        currency: 'ARS',
        special_requests: null,
        mp_payment_id: null,
        mp_preference_id: null,
        payment_status: null,
        payment_method: null,
        paid_amount: null,
        payment_date: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    }
    return rowToReservation(row)
}

function incoming(overrides: Partial<ReservationInput> = {}): ReservationInput {
    return {
        cabinId: 'el-roble',
        checkIn: '2026-01-10',
        checkOut: '2026-01-15',
        guestName: 'Huésped de Airbnb',
        guestEmail: '',
        guests: 1,
        pets: 0,
        state: 'confirmed',
        source: 'airbnb',
        externalId: 'evt-1',
        ...overrides,
    }
}

describe('diffAirbnbEvents', () => {
    it('evento nuevo (externalId no existente) → toCreate', () => {
        const diff = diffAirbnbEvents([], [incoming({ externalId: 'evt-new' })])
        expect(diff.toCreate).toHaveLength(1)
        expect(diff.toCreate[0].externalId).toBe('evt-new')
        expect(diff.toUpdate).toHaveLength(0)
        expect(diff.toCancel).toHaveLength(0)
    })

    it('mismo externalId con fechas cambiadas → toUpdate', () => {
        const existing = [existingAirbnb()]
        const diff = diffAirbnbEvents(existing, [incoming({ checkOut: '2026-01-16' })])
        expect(diff.toCreate).toHaveLength(0)
        expect(diff.toUpdate).toHaveLength(1)
        expect(diff.toUpdate[0].id).toBe('res-1')
        expect(diff.toUpdate[0].input.checkOut).toBe('2026-01-16')
        expect(diff.toCancel).toHaveLength(0)
    })

    it('mismo externalId con guestName cambiado → toUpdate', () => {
        const existing = [existingAirbnb()]
        const diff = diffAirbnbEvents(existing, [incoming({ guestName: 'Ada Lovelace' })])
        expect(diff.toUpdate).toHaveLength(1)
        expect(diff.toUpdate[0].input.guestName).toBe('Ada Lovelace')
    })

    it('mismo externalId sin cambios → NINGÚN bucket (consistencia de zona horaria)', () => {
        // La Reservation existente nace de rowToReservation (check_in como Date UTC-midnight);
        // el incoming trae el mismo YYYY-MM-DD. No debe aparecer como cambio espurio.
        const existing = [existingAirbnb()]
        const diff = diffAirbnbEvents(existing, [incoming()])
        expect(diff.toCreate).toHaveLength(0)
        expect(diff.toUpdate).toHaveLength(0)
        expect(diff.toCancel).toHaveLength(0)
    })

    it('reserva airbnb existente ausente del feed → toCancel', () => {
        const existing = [existingAirbnb({ id: 'res-gone', external_id: 'evt-gone' })]
        const diff = diffAirbnbEvents(existing, [])
        expect(diff.toCancel).toContain('res-gone')
        expect(diff.toCreate).toHaveLength(0)
        expect(diff.toUpdate).toHaveLength(0)
    })

    it('reserva airbnb ya cancelada ausente del feed → NO se re-cancela', () => {
        const existing = [existingAirbnb({ id: 'res-cancelled', state: 'cancelled' })]
        const diff = diffAirbnbEvents(existing, [])
        expect(diff.toCancel).toHaveLength(0)
    })

    it('reservas direct/manual NUNCA aparecen en ningún bucket', () => {
        const existing = [
            existingAirbnb({ id: 'direct-1', source: 'direct', external_id: null }),
            existingAirbnb({ id: 'manual-1', source: 'manual', external_id: 'evt-manual' }),
        ]
        // incoming vacío → si se filtrara mal, direct/manual caerían en toCancel
        const diff = diffAirbnbEvents(existing, [])
        expect(diff.toCancel).toHaveLength(0)
        expect(diff.toCreate).toHaveLength(0)
        expect(diff.toUpdate).toHaveLength(0)
    })

    it('idempotencia: mismo estado repetido → todos los buckets vacíos', () => {
        const existing = [existingAirbnb()]
        const diff = diffAirbnbEvents(existing, [incoming()])
        expect(diff.toCreate.length + diff.toUpdate.length + diff.toCancel.length).toBe(0)
    })
})
