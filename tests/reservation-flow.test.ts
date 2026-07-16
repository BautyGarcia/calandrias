import { describe, it, expect } from 'vitest'
import {
    buildPreferenceMetadata,
    metadataToReservationInput,
} from '@/lib/payments/metadata'
import { parsePublicReservationInput } from '@/lib/reservations/public-input'
import type { ReservationPaymentData } from '@/types/payment'

// ---------------------------------------------------------------
// buildPreferenceMetadata: datos de reserva -> metadata camelCase de MP.
// MercadoPago convierte estas claves camelCase a snake_case del lado del
// webhook, por eso el productor usa camelCase y el consumidor snake_case.
// ---------------------------------------------------------------
describe('buildPreferenceMetadata', () => {
    const data: ReservationPaymentData = {
        cabinId: 'refugio-intimo',
        cabinName: 'Refugio Íntimo',
        guestName: 'Juan Pérez',
        guestEmail: 'juan@example.com',
        guestPhone: '+5492494000000',
        checkIn: '2026-08-10',
        checkOut: '2026-08-13',
        guests: 2,
        pets: 1,
        totalAmount: 120000,
        specialRequests: 'Llego tarde',
        pricePerNight: 40000,
    }

    it('incluye pets, cabinId, checkIn, checkOut y totalAmount', () => {
        const md = buildPreferenceMetadata(data)
        expect(md.cabinId).toBe('refugio-intimo')
        expect(md.checkIn).toBe('2026-08-10')
        expect(md.checkOut).toBe('2026-08-13')
        expect(md.totalAmount).toBe('120000')
        // pets antes faltaba en el metadata y siempre aterrizaba como 0.
        expect(md.pets).toBe('1')
    })

    it('serializa números como strings y tolera pets = 0', () => {
        const md = buildPreferenceMetadata({ ...data, pets: 0 })
        expect(md.pets).toBe('0')
        expect(md.guests).toBe('2')
    })

    it('rellena opcionales ausentes con string vacío', () => {
        const md = buildPreferenceMetadata({
            cabinId: 'c',
            cabinName: 'C',
            guestName: 'X',
            guestEmail: 'x@y.com',
            checkIn: '2026-01-01',
            checkOut: '2026-01-02',
            guests: 1,
            pets: 0,
            totalAmount: 1000,
        })
        expect(md.guestPhone).toBe('')
        expect(md.specialRequests).toBe('')
        expect(md.pricePerNight).toBe('')
    })
})

// ---------------------------------------------------------------
// metadataToReservationInput: metadata snake_case (como llega de MP)
// -> ReservationInput confirmado/direct.
// ---------------------------------------------------------------
describe('metadataToReservationInput', () => {
    const md: Record<string, unknown> = {
        reservation_id: '',
        cabin_id: 'refugio-intimo',
        cabin_name: 'Refugio Íntimo',
        check_in: '2026-08-10',
        check_out: '2026-08-13',
        guests: '2',
        pets: '1',
        guest_name: 'Juan Pérez',
        guest_email: 'juan@example.com',
        guest_phone: '+5492494000000',
        special_requests: 'Llego tarde',
        total_amount: '120000',
        price_per_night: '40000',
    }

    it('mapea metadata snake_case a ReservationInput confirmado/direct', () => {
        const input = metadataToReservationInput(md)
        expect(input.state).toBe('confirmed')
        expect(input.source).toBe('direct')
        expect(input.cabinId).toBe('refugio-intimo')
        expect(input.checkIn).toBe('2026-08-10')
        expect(input.checkOut).toBe('2026-08-13')
        expect(input.guests).toBe(2)
        expect(input.pets).toBe(1)
        expect(input.guestName).toBe('Juan Pérez')
        expect(input.guestEmail).toBe('juan@example.com')
        expect(input.guestPhone).toBe('+5492494000000')
        expect(input.specialRequests).toBe('Llego tarde')
        expect(input.currency).toBe('ARS')
    })

    it('incorpora los datos de pago cuando se proveen', () => {
        const input = metadataToReservationInput(md, {
            paymentId: 'mp_123',
            transactionAmount: 120000,
            dateApproved: '2026-07-15T12:00:00.000Z',
            paymentMethodId: 'credit_card',
        })
        expect(input.mpPaymentId).toBe('mp_123')
        expect(input.paymentStatus).toBe('approved')
        expect(input.paidAmount).toBe(120000)
        expect(input.totalPrice).toBe(120000)
        expect(input.paymentDate).toBe('2026-07-15T12:00:00.000Z')
        expect(input.paymentMethod).toBe('credit_card')
    })

    it('deja paymentMethod undefined si el pago no trae payment_method_id', () => {
        const input = metadataToReservationInput(md, {
            paymentId: 'mp_123',
            transactionAmount: 120000,
        })
        expect(input.paymentMethod).toBeUndefined()
    })

    it('usa defaults seguros: guests >= 1 y pets = 0', () => {
        const input = metadataToReservationInput({
            cabin_id: 'c',
            check_in: '2026-01-01',
            check_out: '2026-01-02',
            guest_name: 'X',
            guest_email: 'x@y.com',
        })
        expect(input.guests).toBe(1)
        expect(input.pets).toBe(0)
    })
})

// ---------------------------------------------------------------
// parsePublicReservationInput: schema público endurecido (.strict()).
// Sólo acepta campos controlables por el huésped; el servidor decide
// state/source/currency/reservationCode/totalPrice.
// ---------------------------------------------------------------
describe('parsePublicReservationInput', () => {
    const validBody = {
        cabinId: 'refugio-intimo',
        checkIn: '2026-08-10',
        checkOut: '2026-08-13',
        guestName: 'Juan Pérez',
        guestEmail: 'juan@example.com',
        guestPhone: '+5492494000000',
        guests: 2,
        pets: 1,
        specialRequests: 'Llego tarde',
    }

    it('acepta un body mínimo válido', () => {
        const result = parsePublicReservationInput({
            cabinId: 'refugio-intimo',
            checkIn: '2026-08-10',
            checkOut: '2026-08-13',
            guestName: 'Juan Pérez',
            guestEmail: 'juan@example.com',
            guests: 1,
        })
        expect(result.success).toBe(true)
    })

    it('el output parseado sólo contiene los campos permitidos', () => {
        const result = parsePublicReservationInput(validBody)
        expect(result.success).toBe(true)
        if (!result.success) return
        expect(Object.keys(result.data).sort()).toEqual(
            [
                'cabinId',
                'checkIn',
                'checkOut',
                'guestEmail',
                'guestName',
                'guestPhone',
                'guests',
                'pets',
                'specialRequests',
            ].sort(),
        )
    })

    it('rechaza state (clave no permitida por .strict())', () => {
        const result = parsePublicReservationInput({ ...validBody, state: 'confirmed' })
        expect(result.success).toBe(false)
    })

    it('rechaza totalPrice (clave no permitida por .strict())', () => {
        const result = parsePublicReservationInput({ ...validBody, totalPrice: 0 })
        expect(result.success).toBe(false)
    })

    it('rechaza claves desconocidas arbitrarias', () => {
        const result = parsePublicReservationInput({ ...validBody, source: 'manual', currency: 'USD' })
        expect(result.success).toBe(false)
    })

    it('rechaza checkOut anterior o igual a checkIn', () => {
        const result = parsePublicReservationInput({ ...validBody, checkOut: '2026-08-10' })
        expect(result.success).toBe(false)
    })
})
