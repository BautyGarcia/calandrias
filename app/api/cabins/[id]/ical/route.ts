import { NextRequest, NextResponse } from 'next/server'
import { generateICalForCabin } from '@/utils/ical-generator'
import { StrapiAPI, strapiToLocalReservation } from '@/lib/strapi'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Inicializar cliente de Strapi
        const strapiAPI = new StrapiAPI()

        // Obtener cabaña de Strapi para verificar que existe
        const cabin = await strapiAPI.getCabinBySlug(id)

        if (!cabin) {
            return NextResponse.json(
                { error: 'Cabaña no encontrada' },
                { status: 404 }
            )
        }

        // Obtener reservas de Strapi
        const strapiReservations = await strapiAPI.getReservations(id)

        // Validar que strapiReservations es un array válido
        if (!Array.isArray(strapiReservations)) {
            const icalContent = generateICalForCabin([], cabin.name)
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
        const icalContent = generateICalForCabin(localReservations, cabin.name)

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