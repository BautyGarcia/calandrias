import { NextRequest, NextResponse } from 'next/server'
import {
    checkDateAvailability,
    createReservation,
    generateReservationCode,
} from '@/lib/db/reservations'
import { getCabinBySlug } from '@/lib/db/cabins'
import { getSiteSettings } from '@/lib/db/content'
import { PublicReservationSchema } from '@/lib/reservations/public-input'
import { calculatePriceForDateRange } from '@/utils/pricing'
import type { ReservationInput } from '@/types/db'

// Parsea un string YYYY-MM-DD a un Date local (sin corrimiento de día por UTC),
// igual que `createDateFromString` de utils/calendar.ts (construcción de 3 args).
function createLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 1. Validación de esquema (endurecido: sólo campos del huésped, .strict()).
        const parsed = PublicReservationSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos de reserva inválidos', details: parsed.error.flatten() },
                { status: 400 }
            )
        }
        const data = parsed.data

        // 2. Gating de reservas online (SIEMPRE antes del cálculo de precio).
        const settings = await getSiteSettings()
        if (!settings.bookingsEnabled) {
            return NextResponse.json(
                { error: 'Las reservas online están temporalmente deshabilitadas' },
                { status: 403 }
            )
        }

        // 3. Resolver la cabaña y calcular el precio en el servidor (nunca del cliente).
        const cabin = await getCabinBySlug(data.cabinId)
        if (!cabin) {
            return NextResponse.json({ error: 'Cabaña no encontrada' }, { status: 404 })
        }

        const checkInDate = createLocalDate(data.checkIn)
        const checkOutDate = createLocalDate(data.checkOut)
        const pricing = calculatePriceForDateRange(cabin, checkInDate, checkOutDate)

        // 4. Revalidar disponibilidad
        const availability = await checkDateAvailability(data.cabinId, data.checkIn, data.checkOut)
        if (!availability.isAvailable) {
            return NextResponse.json(
                { error: 'Las fechas seleccionadas ya no están disponibles' },
                { status: 409 }
            )
        }

        // 5. Crear reserva. El servidor fija state/source/currency/reservationCode
        //    y el precio total calculado; el cliente no puede influir en ellos.
        const input: ReservationInput = {
            cabinId: data.cabinId,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            guestPhone: data.guestPhone,
            guests: data.guests,
            pets: data.pets,
            state: 'pending',
            source: 'direct',
            reservationCode: generateReservationCode(),
            totalPrice: pricing.finalPrice,
            currency: 'ARS',
            specialRequests: data.specialRequests,
        }

        const reservation = await createReservation(input)
        return NextResponse.json({ reservation }, { status: 201 })

    } catch (error) {
        // La constraint de solapamiento se traduce a Error('DATE_CONFLICT').
        if (error instanceof Error && error.message === 'DATE_CONFLICT') {
            return NextResponse.json(
                { error: 'Las fechas seleccionadas ya no están disponibles' },
                { status: 409 }
            )
        }

        console.error('Error creando reserva:', error)
        return NextResponse.json(
            {
                error: 'Error creando reserva',
                message: error instanceof Error ? error.message : 'Error desconocido',
            },
            { status: 500 }
        )
    }
}
