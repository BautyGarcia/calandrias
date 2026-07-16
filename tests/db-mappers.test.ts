import { describe, it, expect } from 'vitest'
import { rowToReservation, reservationToRow } from '@/lib/db/reservations'
import { rowToCabin } from '@/lib/db/cabins'
import { getPrecioParaMes } from '@/types/cabin'
import type { ReservationInput } from '@/types/db'

const fullRow = {
    id: 'res-uuid-1',
    cabin_slug: 'el-roble',
    check_in: '2026-01-10',
    check_out: '2026-01-15',
    guest_name: 'Ada Lovelace',
    guest_email: 'ada@example.com',
    guest_phone: '+5492494027920',
    guests: 3,
    pets: 1,
    state: 'confirmed' as const,
    source: 'direct' as const,
    external_id: 'evt-airbnb-1',
    reservation_code: 'CAL-ABCD1234',
    total_price: 50000,
    currency: 'ARS',
    special_requests: 'llegada tarde',
    mp_payment_id: 'mp-999',
    mp_preference_id: 'pref-888',
    payment_status: 'approved',
    payment_method: 'credit_card',
    paid_amount: 50000,
    payment_date: '2026-01-05T12:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
}

describe('rowToReservation', () => {
    it('mapea una fila completa a Reservation en camelCase con Dates', () => {
        const r = rowToReservation(fullRow)
        expect(r.id).toBe('res-uuid-1')
        expect(r.cabinId).toBe('el-roble')
        expect(r.checkIn).toBeInstanceOf(Date)
        expect(r.checkIn.toISOString()).toContain('2026-01-10')
        expect(r.checkOut.toISOString()).toContain('2026-01-15')
        expect(r.guestName).toBe('Ada Lovelace')
        expect(r.guestEmail).toBe('ada@example.com')
        expect(r.guestPhone).toBe('+5492494027920')
        expect(r.guests).toBe(3)
        expect(r.pets).toBe(1)
        expect(r.state).toBe('confirmed')
        expect(r.source).toBe('direct')
        expect(r.externalId).toBe('evt-airbnb-1')
        expect(r.reservationCode).toBe('CAL-ABCD1234')
        expect(r.totalPrice).toBe(50000)
        expect(r.currency).toBe('ARS')
        expect(r.specialRequests).toBe('llegada tarde')
        expect(r.mpPaymentId).toBe('mp-999')
        expect(r.mpPreferenceId).toBe('pref-888')
        expect(r.paymentStatus).toBe('approved')
        expect(r.paymentMethod).toBe('credit_card')
        expect(r.paidAmount).toBe(50000)
        expect(r.paymentDate).toBeInstanceOf(Date)
        expect(r.paymentDate!.toISOString()).toBe('2026-01-05T12:00:00.000Z')
        expect(r.createdAt).toBeInstanceOf(Date)
        expect(r.updatedAt).toBeInstanceOf(Date)
    })

    it('convierte columnas null en opcionales undefined', () => {
        const nullRow = {
            id: 'res-uuid-2',
            cabin_slug: 'el-ombu',
            check_in: '2026-02-01',
            check_out: '2026-02-03',
            guest_name: '',
            guest_email: '',
            guest_phone: null,
            guests: 1,
            pets: 0,
            state: 'pending' as const,
            source: 'manual' as const,
            external_id: null,
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
        }
        const r = rowToReservation(nullRow)
        expect(r.guestPhone).toBeUndefined()
        expect(r.externalId).toBeUndefined()
        expect(r.reservationCode).toBeUndefined()
        expect(r.totalPrice).toBeUndefined()
        expect(r.specialRequests).toBeUndefined()
        expect(r.mpPaymentId).toBeUndefined()
        expect(r.mpPreferenceId).toBeUndefined()
        expect(r.paymentStatus).toBeUndefined()
        expect(r.paymentMethod).toBeUndefined()
        expect(r.paidAmount).toBeUndefined()
        expect(r.paymentDate).toBeUndefined()
    })
})

describe('reservationToRow', () => {
    it('mapea un ReservationInput completo a fila snake_case', () => {
        const input: ReservationInput = {
            cabinId: 'el-roble',
            checkIn: '2026-01-10',
            checkOut: '2026-01-15',
            guestName: 'Ada Lovelace',
            guestEmail: 'ada@example.com',
            guestPhone: '+5492494027920',
            guests: 3,
            pets: 1,
            state: 'confirmed',
            source: 'direct',
            externalId: 'evt-airbnb-1',
            reservationCode: 'CAL-ABCD1234',
            totalPrice: 50000,
            currency: 'ARS',
            specialRequests: 'llegada tarde',
            mpPaymentId: 'mp-999',
            mpPreferenceId: 'pref-888',
            paymentStatus: 'approved',
            paymentMethod: 'credit_card',
            paidAmount: 50000,
            paymentDate: '2026-01-05T12:00:00.000Z',
        }
        const row = reservationToRow(input)
        expect(row.cabin_slug).toBe('el-roble')
        expect(row.check_in).toBe('2026-01-10')
        expect(row.check_out).toBe('2026-01-15')
        expect(row.guest_name).toBe('Ada Lovelace')
        expect(row.guest_email).toBe('ada@example.com')
        expect(row.guest_phone).toBe('+5492494027920')
        expect(row.guests).toBe(3)
        expect(row.pets).toBe(1)
        expect(row.state).toBe('confirmed')
        expect(row.source).toBe('direct')
        expect(row.external_id).toBe('evt-airbnb-1')
        expect(row.reservation_code).toBe('CAL-ABCD1234')
        expect(row.total_price).toBe(50000)
        expect(row.currency).toBe('ARS')
        expect(row.special_requests).toBe('llegada tarde')
        expect(row.mp_payment_id).toBe('mp-999')
        expect(row.mp_preference_id).toBe('pref-888')
        expect(row.payment_status).toBe('approved')
        expect(row.payment_method).toBe('credit_card')
        expect(row.paid_amount).toBe(50000)
        expect(row.payment_date).toBe('2026-01-05T12:00:00.000Z')
        expect('id' in row).toBe(false)
        expect('created_at' in row).toBe(false)
        expect('updated_at' in row).toBe(false)
    })

    it('convierte opcionales undefined en null', () => {
        const input: ReservationInput = {
            cabinId: 'el-ombu',
            checkIn: '2026-02-01',
            checkOut: '2026-02-03',
            guestName: '',
            guestEmail: '',
            guests: 1,
            pets: 0,
            state: 'pending',
            source: 'manual',
        }
        const row = reservationToRow(input)
        expect(row.guest_phone).toBeNull()
        expect(row.external_id).toBeNull()
        expect(row.reservation_code).toBeNull()
        expect(row.total_price).toBeNull()
        expect(row.special_requests).toBeNull()
        expect(row.mp_payment_id).toBeNull()
        expect(row.mp_preference_id).toBeNull()
        expect(row.payment_status).toBeNull()
        expect(row.payment_method).toBeNull()
        expect(row.paid_amount).toBeNull()
        expect(row.payment_date).toBeNull()
    })
})

describe('round-trip reservationToRow -> rowToReservation', () => {
    it('preserva los campos completos', () => {
        const input: ReservationInput = {
            cabinId: 'el-roble',
            checkIn: '2026-01-10',
            checkOut: '2026-01-15',
            guestName: 'Ada Lovelace',
            guestEmail: 'ada@example.com',
            guestPhone: '+5492494027920',
            guests: 3,
            pets: 1,
            state: 'confirmed',
            source: 'direct',
            externalId: 'evt-airbnb-1',
            reservationCode: 'CAL-ABCD1234',
            totalPrice: 50000,
            currency: 'ARS',
            specialRequests: 'llegada tarde',
            mpPaymentId: 'mp-999',
            mpPreferenceId: 'pref-888',
            paymentStatus: 'approved',
            paymentMethod: 'credit_card',
            paidAmount: 50000,
        }
        const dbRow = {
            ...reservationToRow(input),
            id: 'res-uuid-9',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
        }
        const r = rowToReservation(dbRow)
        expect(r.cabinId).toBe(input.cabinId)
        expect(r.checkIn.toISOString()).toContain('2026-01-10')
        expect(r.guestName).toBe(input.guestName)
        expect(r.guests).toBe(input.guests)
        expect(r.state).toBe(input.state)
        expect(r.reservationCode).toBe(input.reservationCode)
        expect(r.totalPrice).toBe(input.totalPrice)
        expect(r.mpPaymentId).toBe(input.mpPaymentId)
        expect(r.mpPreferenceId).toBe(input.mpPreferenceId)
        expect(r.paymentMethod).toBe(input.paymentMethod)
    })
})

describe('rowToCabin', () => {
    const cabinRow = {
        id: 'cab-uuid-1',
        slug: 'el-roble',
        name: 'El Roble',
        subtitle: 'Cabaña serrana',
        description: 'Una cabaña con vista.',
        setting: 'Entre sierras',
        capacity: '4 personas',
        bedrooms: '2',
        bathrooms: '1',
        image_url: 'https://img/roble.jpg',
        thumbnail_url: 'https://img/roble-thumb.jpg',
        features: [{ icon: 'Mountain', label: 'Vista' }],
        highlights: ['Chimenea', 'Jacuzzi'],
        amenities: { kitchen: true, air_conditioning: 'frio-calor', pool_shared: true },
        nearby_attractions: ['Lago', 'Cascada'],
        rating_score: 4.8,
        rating_review_count: 12,
        precio_base_noche: 40000,
        descuento_dia_semana_default: 10,
        overrides_mensuales: [
            { mes: 'enero', precio_override: 60000, descuento_dia_semana_override: 0 },
        ],
        is_published: true,
        sort_order: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
    }

    it('produce image/thumbnail como objetos { url } y overrides_mensuales como array', () => {
        const cabin = rowToCabin(cabinRow)
        expect(cabin.slug).toBe('el-roble')
        expect(cabin.image.url).toBe('https://img/roble.jpg')
        expect(cabin.thumbnail.url).toBe('https://img/roble-thumb.jpg')
        expect(Array.isArray(cabin.overrides_mensuales)).toBe(true)
        expect(cabin.overrides_mensuales).toHaveLength(1)
        expect(cabin.rating.score).toBe(4.8)
        expect(cabin.rating.review_count).toBe(12)
        expect(cabin.amenities.air_conditioning).toBe('frio-calor')
        expect(cabin.highlights).toEqual(['Chimenea', 'Jacuzzi'])
        expect(cabin.nearby_attractions).toEqual(['Lago', 'Cascada'])
    })

    it('getPrecioParaMes funciona sobre el resultado del mapper', () => {
        const cabin = rowToCabin(cabinRow)
        const enero = getPrecioParaMes(cabin, 'enero')
        expect(enero.precio).toBe(60000)
        expect(enero.descuento_dia_semana).toBe(0)
        const marzo = getPrecioParaMes(cabin, 'marzo')
        expect(marzo.precio).toBe(40000)
        expect(marzo.descuento_dia_semana).toBe(10)
    })

    it('usa arrays vacíos por defecto cuando las columnas jsonb vienen vacías', () => {
        const cabin = rowToCabin({
            ...cabinRow,
            image_url: null,
            thumbnail_url: null,
            overrides_mensuales: [],
        })
        expect(cabin.overrides_mensuales).toEqual([])
        expect(cabin.image.url).toBe('')
    })
})
