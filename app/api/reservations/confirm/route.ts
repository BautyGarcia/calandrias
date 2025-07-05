import { NextRequest, NextResponse } from 'next/server'
import { StrapiAPI } from '@/lib/strapi'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { documentId } = body

        if (!documentId) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'documentId es requerido' 
                },
                { status: 400 }
            )
        }

        const strapiAPI = new StrapiAPI()
        const result = await strapiAPI.confirmReservation(documentId)

        if (result) {
            return NextResponse.json({
                success: true,
                message: 'Reserva confirmada exitosamente'
            })
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No se pudo confirmar la reserva'
                },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('Error confirming reservation:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        )
    }
} 