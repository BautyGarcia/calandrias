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

// `rowToReservation` (lib/db/reservations.ts) construye checkIn/checkOut con
// `new Date(row.check_in)` a partir de un string `YYYY-MM-DD` proveniente de
// la base de datos. JS parsea ese string como medianoche UTC. Si el feed se
// genera en un servidor con TZ != UTC (ej. America/Argentina/Buenos_Aires,
// UTC-3), formatear esa fecha en hora LOCAL corre el día un día para atrás.
const utcMidnightReservation: LocalReservation = {
    id: 'res-2',
    documentId: 'res-2',
    cabinId: 'retiro-exclusivo',
    checkIn: new Date('2035-12-20'), // medianoche UTC (shape real de rowToReservation)
    checkOut: new Date('2035-12-25'),
    guestName: 'Ana Gómez',
    guestEmail: 'ana@example.com',
    guests: 3,
    pets: 0,
    state: 'confirmed',
    source: 'direct',
    reservationCode: 'CAL-UTC1',
    totalPrice: 123456,
    createdAt: new Date(),
    updatedAt: new Date(),
} as unknown as LocalReservation

describe('generateICalForCabin (fechas UTC-medianoche, shape real de rowToReservation)', () => {
    const ical = generateICalForCabin([utcMidnightReservation], 'Las Calandrias de Tandil 1')

    it('NO corre el DTSTART un día para atrás por la zona horaria local', () => {
        expect(ical).toContain('DTSTART;VALUE=DATE:20351220')
        expect(ical).not.toContain('DTSTART;VALUE=DATE:20351219')
    })

    it('NO corre el DTEND un día para atrás por la zona horaria local', () => {
        expect(ical).toContain('DTEND;VALUE=DATE:20351225')
        expect(ical).not.toContain('DTEND;VALUE=DATE:20351224')
    })
})
