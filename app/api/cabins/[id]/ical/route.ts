import { NextRequest, NextResponse } from 'next/server'
import { getCabinBySlug } from '@/lib/db/cabins'
import { getReservations } from '@/lib/db/reservations'
import { generateICalForCabin } from '@/utils/ical-generator'
import type { Reservation } from '@/types/db'
import type { LocalReservation } from '@/types/reservation'

// Adapta el shape camelCase de la app (fechas Date) al que consume el generador
// de iCal. `generateICalForCabin` sólo emite reservas confirmed|blocked|pending.
function toLocalReservation(r: Reservation): LocalReservation {
    return {
        id: r.id,
        documentId: r.id,
        cabinId: r.cabinId,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone,
        guests: r.guests,
        pets: r.pets,
        state: r.state,
        source: r.source,
        externalId: r.externalId,
        reservationCode: r.reservationCode,
        totalPrice: r.totalPrice,
        currency: r.currency,
        specialRequests: r.specialRequests,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    }
}

// Exporta el calendario (.ics) de una cabaña. `id` = slug de la cabaña.
// Airbnb (u otro OTA) importa este feed para bloquear fechas.
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: slug } = await params

    const cabin = await getCabinBySlug(slug)
    if (!cabin) {
        return NextResponse.json({ error: 'Cabaña no encontrada' }, { status: 404 })
    }

    const reservations = await getReservations({ cabinSlug: slug })
    const nonCancelled = reservations.filter((r) => r.state !== 'cancelled').map(toLocalReservation)

    const ical = generateICalForCabin(nonCancelled, cabin.name)

    return new NextResponse(ical, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${slug}.ics"`,
            'Cache-Control': 'public, max-age=300',
        },
    })
}
