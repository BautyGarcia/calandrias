import { LocalReservation } from './reservation'

// Tipos para API responses
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface ReservationsApiResponse {
    reservations: LocalReservation[]
    total: number
}

export interface CreateReservationApiResponse {
    reservation: LocalReservation
    message: string
}

export interface SyncAirbnbApiResponse {
    success: boolean
    message: string
    summary: {
        totalCreated: number
        totalUpdated: number
        cabinsProcessed: number
    }
    timestamp: string
    results: Array<{
        cabinId: string
        success: boolean
        eventsFound?: number
        created?: number
        updated?: number
        errors?: number
        error?: string
    }>
}

// Tipos para requests
export interface CreateReservationRequest {
    cabinId: string
    checkIn: string
    checkOut: string
    guestName: string
    guestEmail?: string
    guestPhone?: string
    adults?: number
    children?: number
    pets?: number
    status?: 'confirmed' | 'pending' | 'cancelled' | 'blocked'
    source?: 'airbnb' | 'direct' | 'manual'
    externalId?: string
    reservationCode?: string
    totalPrice?: number
    currency?: string
    specialRequests?: string
}

export interface ParseICalRequest {
    type: 'url' | 'content'
    data: string
}

export interface ParseICalResponse {
    success: boolean
    events: Record<string, unknown>
    stats: {
        total: number
        vevents: number
        vtimezones: number
        vcalendars: number
    }
    message: string
} 