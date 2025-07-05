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

export function useReservations() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [conflictDetails, setConflictDetails] = useState<ConflictError | null>(null)

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

    const sendReservationConfirmationEmail = async (reservationData: CreateReservationRequest) => {
        // TODO: Implementar envío de email de confirmación
        console.log('Sending confirmation email for reservation:', reservationData)
    }

    return {
        createReservation,
        sendReservationConfirmationEmail,
        isLoading,
        error,
        conflictDetails,
        clearError: () => {
            setError(null)
            setConflictDetails(null)
        }
    }
} 