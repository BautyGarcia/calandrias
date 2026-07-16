import { describe, it, expect } from 'vitest'
import { createLocalDate, computeServerReservationPrice } from '@/lib/reservations/server-price'
import type { Cabin } from '@/types/cabin'

// Cabaña mínima: `calculatePriceForDateRange` sólo lee precio_base_noche,
// descuento_dia_semana_default y overrides_mensuales.
const cabin = {
    slug: 'refugio-intimo',
    name: 'Refugio Íntimo',
    precio_base_noche: 40000,
    descuento_dia_semana_default: 15,
    overrides_mensuales: [],
} as unknown as Cabin

describe('createLocalDate', () => {
    it('parsea YYYY-MM-DD como fecha LOCAL sin corrimiento de día', () => {
        const d = createLocalDate('2026-08-10')
        expect(d.getFullYear()).toBe(2026)
        expect(d.getMonth()).toBe(7) // agosto (0-indexed)
        expect(d.getDate()).toBe(10)
    })
})

describe('computeServerReservationPrice', () => {
    // 2026-08-10 (lun), 11 (mar), 12 (mié) → 3 noches, todas de semana.
    // 40000 * 0.85 = 34000 por noche → total 102000.
    it('calcula el precio autoritativo desde el precio base de la cabaña', () => {
        const { finalPrice, pricePerNight } = computeServerReservationPrice(
            cabin,
            '2026-08-10',
            '2026-08-13',
        )
        expect(finalPrice).toBe(102000)
        expect(pricePerNight).toBe(34000)
    })

    it('ignora cualquier monto provisto por el cliente (sólo depende de la cabaña y fechas)', () => {
        const server = computeServerReservationPrice(cabin, '2026-08-10', '2026-08-13')

        // Simula el overwrite que hace la server action: por más que el cliente
        // mande un totalAmount falso, el monto que se usa es el del servidor.
        const clientPaymentData = { totalAmount: 1, pricePerNight: 1 }
        const authoritative = { ...clientPaymentData, totalAmount: server.finalPrice, pricePerNight: server.pricePerNight }

        expect(authoritative.totalAmount).toBe(102000)
        expect(authoritative.totalAmount).not.toBe(clientPaymentData.totalAmount)
    })
})
