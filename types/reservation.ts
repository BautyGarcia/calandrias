export interface LocalReservation {
    id: string
    documentId: string
    cabinId: string
    checkIn: Date
    checkOut: Date
    guestName: string
    guestEmail: string
    guestPhone?: string
    adults: number
    children: number
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
    adults: number
    children: number
    pets: number
    specialRequests?: string
}

export interface ReservationSummary {
    checkIn: Date
    checkOut: Date
    nights: number
    pricePerNight: number
    basePrice: number
    cleaningFee: number
    serviceFee: number
    totalPrice: number
    guestInfo: ReservationFormData
}

export interface ReservationStep {
    id: 'dates' | 'guests' | 'details' | 'summary' | 'payment'
    title: string
    completed: boolean
    current: boolean
} 