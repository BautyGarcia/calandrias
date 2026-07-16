import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Cabin } from '@/types/cabin'
import type { ReservationPaymentData } from '@/types/payment'

// --- Mocks de dependencias con efectos (DB / red / redirect de Next) ---
// server-price se deja SIN mockear: es puro y es justo lo que queremos ejercitar.

const redirectMock = vi.fn((_url: string) => {
    // Next.js `redirect` lanza un error con message 'NEXT_REDIRECT'.
    throw new Error('NEXT_REDIRECT')
})
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirectMock(url) }))

const getSiteSettingsMock = vi.fn()
vi.mock('@/lib/db/content', () => ({ getSiteSettings: () => getSiteSettingsMock() }))

const getCabinBySlugMock = vi.fn()
vi.mock('@/lib/db/cabins', () => ({ getCabinBySlug: (slug: string) => getCabinBySlugMock(slug) }))

const checkDateAvailabilityMock = vi.fn()
vi.mock('@/lib/db/reservations', () => ({
    checkDateAvailability: (...args: unknown[]) => checkDateAvailabilityMock(...args),
}))

const createReservationPreferenceMock = vi.fn()
vi.mock('@/lib/mercadopago', () => ({
    paymentApi: { createReservationPreference: (d: unknown) => createReservationPreferenceMock(d) },
}))

import { processReservationPaymentDirect } from '@/lib/actions/payment-actions'

const cabin = {
    slug: 'refugio-intimo',
    name: 'Refugio Íntimo',
    precio_base_noche: 40000,
    descuento_dia_semana_default: 15,
    overrides_mensuales: [],
} as unknown as Cabin

// Cliente manda un totalAmount FALSO (1). El servidor debe ignorarlo.
const clientPaymentData: ReservationPaymentData = {
    cabinId: 'refugio-intimo',
    cabinName: 'Refugio Íntimo',
    guestName: 'Juan Pérez',
    guestEmail: 'juan@example.com',
    checkIn: '2026-08-10',
    checkOut: '2026-08-13',
    guests: 2,
    pets: 0,
    totalAmount: 1,
    pricePerNight: 1,
}

beforeEach(() => {
    vi.clearAllMocks()
    redirectMock.mockImplementation((_url: string) => {
        throw new Error('NEXT_REDIRECT')
    })
})

describe('processReservationPaymentDirect', () => {
    it('con bookingsEnabled=false: bloquea ANTES de resolver cabaña o crear preferencia', async () => {
        getSiteSettingsMock.mockResolvedValue({ bookingsEnabled: false })

        await expect(processReservationPaymentDirect(clientPaymentData)).rejects.toThrow('NEXT_REDIRECT')

        expect(redirectMock).toHaveBeenCalledWith('/reserva-fallida?error=bookings_disabled')
        expect(getCabinBySlugMock).not.toHaveBeenCalled()
        expect(createReservationPreferenceMock).not.toHaveBeenCalled()
    })

    it('con reservas habilitadas: usa el precio del servidor e IGNORA el monto del cliente', async () => {
        getSiteSettingsMock.mockResolvedValue({ bookingsEnabled: true })
        getCabinBySlugMock.mockResolvedValue(cabin)
        checkDateAvailabilityMock.mockResolvedValue({ isAvailable: true, conflictingReservations: [] })
        createReservationPreferenceMock.mockResolvedValue('https://checkout.mp/abc')

        await expect(processReservationPaymentDirect(clientPaymentData)).rejects.toThrow('NEXT_REDIRECT')

        // Se creó la preferencia con el monto server-side (102000), no con el falso (1).
        expect(createReservationPreferenceMock).toHaveBeenCalledTimes(1)
        const sent = createReservationPreferenceMock.mock.calls[0][0] as ReservationPaymentData
        expect(sent.totalAmount).toBe(102000)
        expect(sent.pricePerNight).toBe(34000)
        // Y finalmente se redirige al checkout devuelto.
        expect(redirectMock).toHaveBeenCalledWith('https://checkout.mp/abc')
    })
})
