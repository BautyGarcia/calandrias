export interface LocalReservation {
    id: string
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