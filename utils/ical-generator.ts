import { format } from 'date-fns'
import { LocalReservation, ICalEvent } from '@/types'

/**
 * Genera un archivo iCal (.ics) con las reservas de una cabaña
 * Este iCal puede ser importado por Airbnb para bloquear fechas
 */
export function generateICalForCabin(reservations: LocalReservation[], cabinName: string): string {
    const prodId = '-//Calandrias//Reservas//ES'

    let ical = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${prodId}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${cabinName} - Reservas`,
        `X-WR-CALDESC:Calendario de reservas para ${cabinName}`,
        'X-WR-TIMEZONE:America/Argentina/Buenos_Aires'
    ]

    reservations.forEach(reservation => {
        if (reservation.state === 'confirmed' || reservation.state === 'blocked' || reservation.state === 'pending') {
            const event = generateICalEvent(reservation)
            ical = ical.concat(event)
        }
    })

    ical.push('END:VCALENDAR')

    return ical.join('\r\n')
}

/**
 * Genera un evento individual en formato iCal
 */
function generateICalEvent(reservation: LocalReservation): string[] {
    const uid = `${reservation.id}@calandrias.com`
    const now = new Date()
    const dtstamp = formatICalDate(now)
    const dtstart = formatICalDate(reservation.checkIn, true)
    const dtend = formatICalDate(reservation.checkOut, true)

    // Summary basado en la fuente de la reserva
    let summary = ''
    if (reservation.source === 'airbnb') {
        summary = `Airbnb - ${reservation.guestName || 'Reserva'}`
    } else if (reservation.source === 'direct') {
        summary = `Reserva Directa - ${reservation.guestName}`
    } else {
        summary = `Bloqueado - ${reservation.guestName || 'No disponible'}`
    }

    let description = `Reserva para ${reservation.guests} huéspedes`
    if (reservation.pets > 0) description += `, ${reservation.pets} mascotas`
    if (reservation.reservationCode) description += `\nCódigo: ${reservation.reservationCode}`
    if (reservation.totalPrice) description += `\nPrecio: $${reservation.totalPrice}`

    return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `DTEND;VALUE=DATE:${dtend}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${escapeICalText(description)}`,
        `STATUS:${reservation.state === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'TRANSP:OPAQUE',
        'CATEGORIES:RESERVA',
        'END:VEVENT'
    ]
}

/**
 * Formatea una fecha para iCal
 */
function formatICalDate(date: Date, allDay: boolean = false): string {
    if (allDay) {
        return format(date, 'yyyyMMdd')
    }
    return format(date, "yyyyMMdd'T'HHmmss'Z'")
}

/**
 * Escapa texto para formato iCal
 */
function escapeICalText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
}

/**
 * Parsea eventos desde un iCal de Airbnb
 */
export function parseAirbnbICalEvents(icalContent: string): ICalEvent[] {
    const events: ICalEvent[] = []
    const lines = icalContent.split(/\r?\n/)

    let currentEvent: Partial<ICalEvent> = {}
    let inEvent = false

    for (let line of lines) {
        line = line.trim()

        if (line === 'BEGIN:VEVENT') {
            inEvent = true
            currentEvent = {}
        } else if (line === 'END:VEVENT' && inEvent) {
            if (currentEvent.summary && currentEvent.startDate && currentEvent.endDate) {
                events.push(currentEvent as ICalEvent)
            }
            inEvent = false
        } else if (inEvent) {
            const [key, ...valueParts] = line.split(':')
            const value = valueParts.join(':')

            switch (key.split(';')[0]) {
                case 'UID':
                    currentEvent.id = value
                    break
                case 'SUMMARY':
                    currentEvent.summary = unescapeICalText(value)
                    break
                case 'DESCRIPTION':
                    currentEvent.description = unescapeICalText(value)
                    break
                case 'DTSTART':
                    currentEvent.startDate = parseICalDate(value, key)
                    break
                case 'DTEND':
                    currentEvent.endDate = parseICalDate(value, key)
                    break
                case 'LOCATION':
                    currentEvent.location = unescapeICalText(value)
                    break
            }
        }
    }

    return events
}

/**
 * Convierte fecha iCal a Date object
 */
function parseICalDate(value: string, key: string): Date {
    if (key.includes('VALUE=DATE')) {
        return new Date(value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
    }

    if (value.endsWith('Z')) {
        return new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'))
    }

    return new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'))
}

/**
 * Des-escapa texto iCal
 */
function unescapeICalText(text: string): string {
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
}

/**
 * Convierte eventos de Airbnb a formato de reserva local
 */
export function airbnbEventToReservation(event: ICalEvent, cabinId: string): LocalReservation {
    return {
        id: `airbnb-${event.id}`,
        documentId: '', // Will be populated when saved to Strapi
        cabinId: cabinId,
        checkIn: event.startDate,
        checkOut: event.endDate,
        guestName: extractGuestName(event.summary),
        guestEmail: '',
        guests: extractGuestCount(event.description || event.summary),
        pets: 0,
        state: 'confirmed',
        source: 'airbnb',
        externalId: event.id,
        reservationCode: extractReservationCode(event.description || event.summary),
        createdAt: new Date(),
        updatedAt: new Date()
    }
}

function extractGuestName(summary: string): string {
    if (summary.includes('Reserved')) {
        return 'Huésped de Airbnb'
    }

    const nameMatch = summary.match(/^(.+?)\s*-?\s*/)
    return nameMatch ? nameMatch[1].trim() : 'Huésped de Airbnb'
}

function extractGuestCount(text: string): number {
    const guestMatch = text.match(/(\d+)\s*(guest|huésped|adult)/i)
    return guestMatch ? parseInt(guestMatch[1]) : 1
}

function extractReservationCode(text: string): string {
    const codeMatch = text.match(/([A-Z0-9]{8,})/i)
    return codeMatch ? codeMatch[1] : ''
} 