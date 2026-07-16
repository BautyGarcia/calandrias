import type { PaymentStatus } from './payment'
import type { CabinFeature, CabinAmenities, CabinPricingOverride } from './cabin'

// ============================================================
// RESERVATIONS
// ============================================================

export type ReservationState = 'confirmed' | 'pending' | 'cancelled' | 'blocked'
export type ReservationSource = 'airbnb' | 'direct' | 'manual'

// Shape de la app (camelCase). `cabinId` = slug de la cabaña.
export interface Reservation {
    id: string
    cabinId: string
    checkIn: Date
    checkOut: Date
    guestName: string
    guestEmail: string
    guestPhone?: string
    guests: number
    pets: number
    state: ReservationState
    source: ReservationSource
    externalId?: string
    reservationCode?: string
    totalPrice?: number
    currency?: string
    specialRequests?: string
    mpPaymentId?: string
    paymentStatus?: PaymentStatus
    paidAmount?: number
    paymentDate?: Date
    createdAt: Date
    updatedAt: Date
}

// Igual que Reservation pero sin id/createdAt/updatedAt y fechas como string YYYY-MM-DD.
export interface ReservationInput {
    cabinId: string
    checkIn: string
    checkOut: string
    guestName: string
    guestEmail: string
    guestPhone?: string
    guests: number
    pets: number
    state: ReservationState
    source: ReservationSource
    externalId?: string
    reservationCode?: string
    totalPrice?: number
    currency?: string
    specialRequests?: string
    mpPaymentId?: string
    paymentStatus?: PaymentStatus
    paidAmount?: number
    paymentDate?: string
}

// Rango de ocupación expuesto públicamente (sin datos personales).
export interface AvailabilityRange {
    checkIn: string
    checkOut: string
    state: 'confirmed' | 'pending' | 'blocked'
}

// ============================================================
// CABINS
// ============================================================

// Campos editables de una cabaña (camelCase salvo los que ya eran snake_case en la app).
export interface CabinInput {
    name: string
    subtitle: string
    description: string
    setting: string
    capacity: string
    bedrooms: string
    bathrooms: string
    imageUrl: string | null
    thumbnailUrl: string | null
    features: CabinFeature[]
    highlights: string[]
    amenities: CabinAmenities
    nearbyAttractions: string[]
    ratingScore: number
    ratingReviewCount: number
    precio_base_noche: number
    descuento_dia_semana_default: number
    overrides_mensuales: CabinPricingOverride[]
    isPublished: boolean
    sortOrder: number
}

// ============================================================
// CONTENIDO EDITABLE
// ============================================================

export interface SiteSettings {
    bookingsEnabled: boolean
    whatsapp: string
    phone: string
    email: string
    address: string
    checkinTime: string
    checkoutTime: string
}

export interface Faq {
    id: string
    question: string
    answer: string
    sortOrder: number
    isPublished: boolean
}

export type FaqInput = Omit<Faq, 'id'> & { id?: string }

export interface Review {
    id: string
    name: string
    location: string
    text: string
    avatarUrl?: string | null
    rating: number
    sortOrder: number
    isPublished: boolean
}

export type ReviewInput = Omit<Review, 'id'> & { id?: string }

export interface GalleryItem {
    id: string
    title: string
    description: string
    imageUrl: string
    span: string
    sortOrder: number
    isPublished: boolean
}

export type GalleryItemInput = Omit<GalleryItem, 'id'> & { id?: string }
