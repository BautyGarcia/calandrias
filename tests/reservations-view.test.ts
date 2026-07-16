import { describe, it, expect } from 'vitest'
import {
    toISODate,
    toReservationView,
    formatShortDate,
    formatDateRange,
    reservationStats,
    sortByCheckIn,
    summarizeSync,
    type ReservationView,
} from '@/lib/reservations-view'
import type { Reservation } from '@/types/db'

// Construye un ReservationView mínimo para tests de stats/orden.
function view(partial: Partial<ReservationView>): ReservationView {
    return {
        id: 'id',
        cabinId: 'cabin',
        checkIn: '2026-03-12',
        checkOut: '2026-03-15',
        guestName: 'Test',
        guests: 2,
        pets: 0,
        state: 'confirmed',
        source: 'manual',
        ...partial,
    }
}

describe('toISODate', () => {
    it('formatea una fecha UTC a YYYY-MM-DD sin corrimiento de día', () => {
        // rowToReservation construye Date con new Date('YYYY-MM-DD') = medianoche UTC.
        expect(toISODate(new Date('2026-03-12'))).toBe('2026-03-12')
    })
})

describe('formatShortDate', () => {
    it('formatea "12 mar" a partir de un YYYY-MM-DD (sin problemas de zona horaria)', () => {
        expect(formatShortDate('2026-03-12')).toBe('12 mar')
        expect(formatShortDate('2026-01-01')).toBe('1 ene')
        expect(formatShortDate('2026-12-31')).toBe('31 dic')
    })
})

describe('formatDateRange', () => {
    it('formatea el rango con flecha', () => {
        expect(formatDateRange('2026-03-12', '2026-03-15')).toBe('12 mar → 15 mar')
    })
})

describe('toReservationView', () => {
    it('mapea una Reservation (Date) a un view serializable (strings YYYY-MM-DD)', () => {
        const r = {
            id: 'uuid-1',
            cabinId: 'ceibo',
            checkIn: new Date('2026-03-12'),
            checkOut: new Date('2026-03-15'),
            guestName: 'Ana',
            guestEmail: 'ana@x.com',
            guests: 2,
            pets: 1,
            state: 'confirmed',
            source: 'manual',
            totalPrice: 50000,
            reservationCode: 'CAL-ABC',
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
        } as Reservation

        const v = toReservationView(r)
        expect(v).toMatchObject({
            id: 'uuid-1',
            cabinId: 'ceibo',
            checkIn: '2026-03-12',
            checkOut: '2026-03-15',
            guestName: 'Ana',
            guests: 2,
            pets: 1,
            state: 'confirmed',
            source: 'manual',
            totalPrice: 50000,
            reservationCode: 'CAL-ABC',
        })
    })
})

describe('reservationStats', () => {
    it('cuenta confirmadas, pendientes y las de check-in del mes dado', () => {
        const views = [
            view({ state: 'confirmed', checkIn: '2026-03-05' }),
            view({ state: 'confirmed', checkIn: '2026-04-05' }),
            view({ state: 'pending', checkIn: '2026-03-20' }),
            view({ state: 'cancelled', checkIn: '2026-03-25' }),
            view({ state: 'blocked', checkIn: '2026-03-28' }),
        ]
        const stats = reservationStats(views, '2026-03')
        expect(stats.confirmed).toBe(2)
        expect(stats.pending).toBe(1)
        expect(stats.thisMonth).toBe(4) // 4 con check-in en 2026-03
    })
})

describe('sortByCheckIn', () => {
    it('ordena por checkIn ascendente (próximas primero)', () => {
        const views = [
            view({ id: 'b', checkIn: '2026-05-01' }),
            view({ id: 'a', checkIn: '2026-03-01' }),
            view({ id: 'c', checkIn: '2026-06-01' }),
        ]
        expect(sortByCheckIn(views).map((v) => v.id)).toEqual(['a', 'b', 'c'])
    })
})

describe('summarizeSync', () => {
    it('resume conteos en español con pluralización correcta', () => {
        expect(summarizeSync([{ created: 2, updated: 1, cancelled: 0 }])).toBe(
            '2 nuevas, 1 actualizada, 0 canceladas'
        )
    })

    it('usa singular para 1 y suma varias cabañas', () => {
        expect(
            summarizeSync([
                { created: 1, updated: 0, cancelled: 1 },
                { created: 0, updated: 0, cancelled: 0 },
            ])
        ).toBe('1 nueva, 0 actualizadas, 1 cancelada')
    })

    it('reporta cuando no hay cabañas configuradas', () => {
        expect(summarizeSync([])).toBe('No hay cabañas configuradas para sincronizar')
    })

    it('anexa la cantidad de cabañas con error', () => {
        expect(
            summarizeSync([
                { created: 1, updated: 0, cancelled: 0 },
                { created: 0, updated: 0, cancelled: 0, error: 'timeout' },
            ])
        ).toBe('1 nueva, 0 actualizadas, 0 canceladas · 1 cabaña con error')
    })
})
