export interface CabinFeature {
    icon: React.ReactNode
    name: string
    description: string
}

export interface Cabin {
    id: string
    name: string
    slug: string
    description: string
    shortDescription: string
    capacity: number
    bedrooms: number
    bathrooms: number
    area: number
    price: {
        basePrice: number
        currency: string
        period: string
    }
    location: {
        coordinates: {
            lat: number
            lng: number
        }
        address: string
        nearbyAttractions: string[]
    }
    images: {
        main: string
        gallery: string[]
        virtual360?: string
    }
    amenities: string[]
    features: CabinFeature[]
    policies: {
        checkIn: string
        checkOut: string
        cancellation: string
        pets: boolean
        smoking: boolean
        parties: boolean
    }
    availability: {
        calendar: string // URL del calendario iCal
        minStay: number
        maxStay: number
        advanceBooking: number
    }
} 