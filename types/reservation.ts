import { PaymentStatus } from './payment'

export interface LocalReservation {
    id: string
    documentId: string
    cabinId: string
    checkIn: Date
    checkOut: Date
    guestName: string
    guestEmail: string
    guestPhone?: string
    guests: number
    pets: number
    status: 'confirmed' | 'pending' | 'cancelled' | 'blocked'
    source: 'airbnb' | 'direct' | 'manual'
    externalId?: string
    reservationCode?: string
    totalPrice?: number
    currency?: string
    specialRequests?: string
    createdAt: Date
    updatedAt: Date
    // Campos de pago
    paymentId?: string
    paymentStatus?: PaymentStatus
    paymentMethod?: string
    paidAmount?: number
    depositAmount?: number
    paymentDate?: Date
    mpPreferenceId?: string
    mpPaymentId?: string
}

export interface ICalEvent {
    id: string
    summary: string
    description?: string
    startDate: Date
    endDate: Date
    location?: string
    organizer?: string
    attendee?: string
}

// Tipos para el formulario de reserva
export interface ReservationFormData {
    guestName: string
    guestEmail: string
    guestPhone?: string
    guests: number
    pets: number
    specialRequests?: string
}

export interface ReservationSummary {
    checkIn: Date
    checkOut: Date
    nights: number
    pricePerNight: number
    basePrice: number
    totalPrice: number
    guestInfo: ReservationFormData
}

export interface ReservationStep {
    id: 'dates' | 'guests' | 'details' | 'summary' | 'payment'
    title: string
    completed: boolean
    current: boolean
} 