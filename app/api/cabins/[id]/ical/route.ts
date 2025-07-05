import { NextRequest, NextResponse } from 'next/server'
import { generateICalForCabin } from '@/utils/ical-generator'
import { StrapiAPI, strapiToLocalReservation } from '@/lib/strapi'
import { getCabinConfig } from '@/utils/cabins'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Verificar que la cabaña existe
        const cabinConfig = getCabinConfig(id)
        if (!cabinConfig) {
            return NextResponse.json(
                { error: 'Cabaña no encontrada' },
                { status: 404 }
            )
        }

        // Inicializar cliente de Strapi
        const strapiAPI = new StrapiAPI()

        // Obtener reservas de Strapi
        const strapiReservations = await strapiAPI.getReservations(id)

        // Validar que strapiReservations es un array válido
        if (!Array.isArray(strapiReservations)) {
            const icalContent = generateICalForCabin([], cabinConfig.name)
            return new NextResponse(icalContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/calendar; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${id}-calendar.ics"`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            })
        }

        // Convertir a formato local
        const localReservations = strapiReservations.map(strapiToLocalReservation)

        // Generar iCal
        const icalContent = generateICalForCabin(localReservations, cabinConfig.name)

        // Retornar como archivo .ics
        return new NextResponse(icalContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="${id}-calendar.ics"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })

    } catch (error) {
        console.error('Error generating iCal:', error)
        return NextResponse.json(
            {
                error: 'Error generando calendario',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        )
    }
} 