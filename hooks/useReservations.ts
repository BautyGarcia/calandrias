"use client"

import { useState } from 'react'
import { CreateReservationRequest, CreateReservationApiResponse, ApiResponse } from '@/types/api'

interface ConflictError {
    error: string
    conflictingReservations?: Array<{
        id: string
        checkIn: string
        checkOut: string
        source: string
        guestName: string
    }>
}

interface EmailConfirmationData {
    guestName: string
    guestEmail: string
    cabinName: string
    checkIn: Date
    checkOut: Date
    totalPrice: number
    reservationCode: string
    paymentId: string
}

export function useReservations() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [conflictDetails, setConflictDetails] = useState<ConflictError | null>(null)
    const [isEmailSending, setIsEmailSending] = useState(false)
    const [emailError, setEmailError] = useState<string | null>(null)

    const createReservation = async (reservationData: CreateReservationRequest): Promise<CreateReservationApiResponse> => {
        setIsLoading(true)
        setError(null)
        setConflictDetails(null)

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservationData),
            })

            const data = await response.json()

            if (!response.ok) {
                // Error de conflicto de fechas
                if (response.status === 409 && data.conflictingReservations) {
                    const conflictError: ConflictError = {
                        error: data.error || 'Fechas no disponibles',
                        conflictingReservations: data.conflictingReservations
                    }
                    setConflictDetails(conflictError)
                    throw conflictError
                }

                // Otros errores
                throw new Error(data.error || 'Error creando reserva')
            }

            if (!data.success) {
                throw new Error('Respuesta inválida del servidor')
            }

            return data.data
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message)
            }
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const sendReservationConfirmationEmail = async (emailData: EmailConfirmationData): Promise<boolean> => {
        setIsEmailSending(true)
        setEmailError(null)

        try {
            const response = await fetch('/api/emails/send-confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Error enviando email de confirmación')
            }

            if (!result.success) {
                throw new Error(result.error || 'Error enviando email de confirmación')
            }

            console.log('✅ Email de confirmación enviado:', {
                emailId: result.emailId,
                sentTo: result.sentTo,
                reservationCode: result.reservationCode
            })

            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido enviando email'
            setEmailError(errorMessage)
            console.error('❌ Error enviando email de confirmación:', error)
            
            // No lanzamos el error para que no interrumpa el flujo de reserva
            // El email es importante pero no crítico
            return false
        } finally {
            setIsEmailSending(false)
        }
    }

    return {
        createReservation,
        sendReservationConfirmationEmail,
        isLoading,
        error,
        conflictDetails,
        isEmailSending,
        emailError,
        clearError: () => {
            setError(null)
            setConflictDetails(null)
            setEmailError(null)
        }
    }
} 