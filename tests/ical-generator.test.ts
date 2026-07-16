import { describe, it, expect } from 'vitest'
import { generateICalForCabin } from '@/utils/ical-generator'
import type { LocalReservation } from '@/types/reservation'

// El feed .ics es PÚBLICO y no autenticado (lo importa un OTA como Airbnb para
// bloquear fechas). Debe exponer SÓLO ocupación por rango de fechas, nunca PII
// del huésped, ni el código de reserva, ni el precio.
const reservation: LocalReservation = {
    id: 'res-1',
    documentId: 'res-1',
    cabinId: 'retiro-exclusivo',
    checkIn: new Date(2026, 7, 10), // 2026-08-10 local
    checkOut: new Date(2026, 7, 13), // 2026-08-13 local
    guestName: 'Juan Pérez Secreto',
    guestEmail: 'juan.secreto@example.com',
    guests: 2,
    pets: 1,
    state: 'confirmed',
    source: 'direct',
    reservationCode: 'CAL-SECRET1',
    totalPrice: 987654,
    createdAt: new Date(),
    updatedAt: new Date(),
} as unknown as LocalReservation

describe('generateICalForCabin (feed público redactado)', () => {
    const ical = generateICalForCabin([reservation], 'Las Calandrias de Tandil 1')

    it('NO filtra el nombre del huésped', () => {
        expect(ical).not.toContain('Juan')
        expect(ical).not.toContain('Pérez')
        expect(ical).not.toContain('Secreto')
        expect(ical).not.toContain('juan.secreto@example.com')
    })

    it('NO filtra el código de reserva', () => {
        expect(ical).not.toContain('CAL-SECRET1')
        expect(ical).not.toContain('Código')
    })

    it('NO filtra el precio', () => {
        expect(ical).not.toContain('987654')
        expect(ical).not.toContain('Precio')
    })

    it('mantiene las fechas de ocupación (DTSTART/DTEND) para que el OTA las importe', () => {
        expect(ical).toContain('DTSTART;VALUE=DATE:20260810')
        expect(ical).toContain('DTEND;VALUE=DATE:20260813')
        expect(ical).toContain('BEGIN:VEVENT')
        expect(ical).toContain('STATUS:CONFIRMED')
    })

    it('usa un SUMMARY genérico', () => {
        expect(ical).toContain('SUMMARY:No disponible')
    })
})
