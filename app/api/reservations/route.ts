import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
    checkDateAvailability,
    createReservation,
    generateReservationCode,
} from '@/lib/db/reservations'
import { getSiteSettings } from '@/lib/db/content'
import type { ReservationInput } from '@/types/db'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Validación de la reserva pública (fechas YYYY-MM-DD, checkOut > checkIn).
const CreateReservationSchema = z
    .object({
        cabinId: z.string().min(1, 'cabinId requerido'),
        checkIn: z.string().regex(DATE_RE, 'checkIn debe tener formato YYYY-MM-DD'),
        checkOut: z.string().regex(DATE_RE, 'checkOut debe tener formato YYYY-MM-DD'),
        guestName: z.string().min(2, 'Nombre requerido'),
        guestEmail: z.string().email('Email inválido'),
        guestPhone: z.string().optional(),
        guests: z.number().int().min(1, 'Mínimo 1 huésped'),
        pets: z.number().int().min(0, 'pets no puede ser negativo').default(0),
        state: z.enum(['confirmed', 'pending', 'cancelled', 'blocked']).optional(),
        source: z.enum(['airbnb', 'direct', 'manual']).optional(),
        externalId: z.string().optional(),
        reservationCode: z.string().optional(),
        totalPrice: z.number().optional(),
        currency: z.string().optional(),
        specialRequests: z.string().optional(),
    })
    .refine((data) => data.checkOut > data.checkIn, {
        message: 'checkOut debe ser posterior a checkIn',
        path: ['checkOut'],
    })

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 1. Validación de esquema
        const parsed = CreateReservationSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos de reserva inválidos', details: parsed.error.flatten() },
                { status: 400 }
            )
        }
        const data = parsed.data

        // 2. Gating de reservas online
        const settings = await getSiteSettings()
        if (!settings.bookingsEnabled) {
            return NextResponse.json(
                { error: 'Las reservas online están temporalmente deshabilitadas' },
                { status: 403 }
            )
        }

        // 3. Revalidar disponibilidad
        const availability = await checkDateAvailability(data.cabinId, data.checkIn, data.checkOut)
        if (!availability.isAvailable) {
            return NextResponse.json(
                { error: 'Las fechas seleccionadas ya no están disponibles' },
                { status: 409 }
            )
        }

        // 4. Crear reserva
        const input: ReservationInput = {
            cabinId: data.cabinId,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            guestPhone: data.guestPhone,
            guests: data.guests,
            pets: data.pets,
            state: data.state ?? 'confirmed',
            source: data.source ?? 'direct',
            externalId: data.externalId,
            reservationCode: data.reservationCode ?? generateReservationCode(),
            totalPrice: data.totalPrice,
            currency: data.currency ?? 'ARS',
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
