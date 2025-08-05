import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'
import { ReservationConfirmationData } from '@/emails/templates/ReservationConfirmation'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validar datos requeridos
        const {
            guestName,
            guestEmail,
            cabinName,
            checkIn,
            checkOut,
            totalPrice,
            reservationCode,
            paymentId
        } = body

        // Validación básica
        if (!guestName || !guestEmail || !cabinName || !checkIn || !checkOut || !totalPrice || !reservationCode || !paymentId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Faltan datos requeridos para enviar el email',
                    required: ['guestName', 'guestEmail', 'cabinName', 'checkIn', 'checkOut', 'totalPrice', 'reservationCode', 'paymentId']
                },
                { status: 400 }
            )
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(guestEmail)) {
            return NextResponse.json(
                { success: false, error: 'Formato de email inválido' },
                { status: 400 }
            )
        }

        // Preparar datos del email
        const emailData: ReservationConfirmationData = {
            guestName,
            guestEmail,
            cabinName,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            totalPrice: Number(totalPrice),
            reservationCode,
            paymentId
        }

        // Enviar email
        const result = await EmailService.sendReservationConfirmation(emailData, {
            to: guestEmail
        })

        return NextResponse.json({
            success: true,
            message: 'Email de confirmación enviado exitosamente',
            emailId: result?.id,
            sentTo: guestEmail,
            reservationCode
        })

    } catch (error) {
        console.error('Error enviando email de confirmación:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Error interno del servidor al enviar email',
                details: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        )
    }
}