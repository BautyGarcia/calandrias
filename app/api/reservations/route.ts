import { NextRequest, NextResponse } from 'next/server'
import { StrapiAPI, strapiToLocalReservation } from '@/lib/strapi'
import { CreateReservationRequest } from '@/types'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const cabinId = searchParams.get('cabinId')
        const status = searchParams.get('status')

        const strapiAPI = new StrapiAPI()

        // Obtener reservas de Strapi
        const strapiReservations = await strapiAPI.getReservations(cabinId || undefined)

        // Validar que strapiReservations es un array
        if (!Array.isArray(strapiReservations)) {
            return NextResponse.json({
                reservations: [],
                total: 0
            })
        }

        // Convertir a formato local
        let localReservations = strapiReservations.map(strapiToLocalReservation)

        // Filtrar por status si se especifica
        if (status) {
            localReservations = localReservations.filter(r => r.status === status)
        }

        return NextResponse.json({
            reservations: localReservations,
            total: localReservations.length
        })

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Error obteniendo reservas',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateReservationRequest = await request.json()

        // Validar datos requeridos
        if (!body.cabinId || !body.checkIn || !body.checkOut || !body.guestName) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Faltan campos requeridos: cabinId, checkIn, checkOut, guestName' 
                },
                { status: 400 }
            )
        }

        const strapiAPI = new StrapiAPI()

        // Verificar disponibilidad usando el nuevo endpoint centralizado
        const availabilityCheck = await strapiAPI.checkDateAvailability(
            body.cabinId,
            body.checkIn,
            body.checkOut
        )

        if (!availabilityCheck.isAvailable) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Fechas no disponibles',
                    conflictingReservations: availabilityCheck.conflictingReservations.map(r => ({
                        id: r.id,
                        checkIn: r.checkIn,
                        checkOut: r.checkOut,
                        source: r.source,
                        guestName: r.guestName
                    }))
                },
                { status: 409 }
            )
        }

        // Preparar datos de la reserva
        const reservationData = {
            cabinId: body.cabinId,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
            guestName: body.guestName,
            guestEmail: body.guestEmail || '',
            guestPhone: body.guestPhone,
            guests: body.guests || 1,
            pets: body.pets || 0,
            status: body.status || 'confirmed',
            source: body.source || 'direct',
            externalId: body.externalId,
            reservationCode: body.reservationCode || generateReservationCode(),
            totalPrice: body.totalPrice,
            currency: body.currency || 'ARS',
            specialRequests: body.specialRequests
        }

        // Crear reserva en Strapi
        const strapiReservation = await strapiAPI.createReservation(reservationData)

        // Convertir a formato local para respuesta
        const localReservation = strapiToLocalReservation(strapiReservation)

        return NextResponse.json({
            success: true,
            data: {
                reservation: localReservation,
                message: 'Reserva creada exitosamente'
            }
        }, { status: 201 })

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'Error creando reserva',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        )
    }
}

function generateReservationCode(): string {
    return 'CAL-' + Math.random().toString(36).substr(2, 8).toUpperCase()
} 