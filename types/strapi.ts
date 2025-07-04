export interface StrapiReservation {
    id: number
    documentId: string
    cabinId: string
    checkIn: string
    checkOut: string
    guestName: string
    guestEmail: string
    guestPhone?: string | null
    adults: number
    children: number
    pets: number
    status: 'confirmed' | 'pending' | 'cancelled' | 'blocked'
    source: 'airbnb' | 'direct' | 'manual'
    externalId?: string | null
    reservationCode?: string | null
    totalPrice?: number | null
    currency?: string | null
    specialRequests?: string | null
    createdAt: string
    updatedAt: string
    publishedAt?: string | null
    locale?: string | null
    createdBy?: unknown | null
    updatedBy?: unknown | null
    localizations?: unknown[]
}

export interface StrapiReservationInput {
    cabinId: string
    checkIn: string
    checkOut: string
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
}

export interface StrapiReservationUpdate {
    cabinId?: string
    checkIn?: string
    checkOut?: string
    guestName?: string
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