import { NextRequest, NextResponse } from 'next/server'
import { generateICalForCabin } from '@/utils/ical-generator'
import { StrapiAPI, strapiToLocalReservation } from '@/lib/strapi'

const cabinNames: Record<string, string> = {
    'refugio-intimo': 'Refugio Íntimo'
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Verificar que la cabaña existe
        if (!cabinNames[id]) {
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
            const icalContent = generateICalForCabin([], cabinNames[id])
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
        const icalContent = generateICalForCabin(localReservations, cabinNames[id])

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