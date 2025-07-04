import { LocalReservation, StrapiReservation, StrapiReservationInput, StrapiReservationUpdate } from '@/types'

export class StrapiAPI {
    private baseURL: string
    private token: string

    constructor() {
        this.baseURL = process.env.STRAPI_API_URL || 'http://localhost:1337/api'
        this.token = process.env.STRAPI_API_TOKEN || ''
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })
        
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Strapi API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`)
        }

        const responseText = await response.text()
        try {
            return JSON.parse(responseText)
        } catch {
            throw new Error(`Invalid JSON response from Strapi: ${responseText.substring(0, 200)}`)
        }
    }

    // Obtener reservas de una cabaña
    async getReservations(cabinId?: string): Promise<StrapiReservation[]> {
        let endpoint = '/reservations?sort=checkIn:asc'
        
        if (cabinId) {
            endpoint += `&filters[cabinId][$eq]=${cabinId}`
        }

        const response = await this.request<StrapiReservation[]>(endpoint)
        return response
    }

    // Crear nueva reserva
    async createReservation(reservationData: StrapiReservationInput): Promise<StrapiReservation> {
        const response = await this.request<StrapiReservation>('/reservations', {
            method: 'POST',
            body: JSON.stringify({
                data: reservationData
            })
        })
        
        return response
    }

    // Actualizar reserva existente
    async updateReservation(id: number, reservationData: StrapiReservationUpdate): Promise<StrapiReservation> {
        const response = await this.request<StrapiReservation>(`/reservations/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                data: reservationData
            })
        })
        return response
    }

    // Eliminar reserva
    async deleteReservation(id: number): Promise<void> {
        await this.request(`/reservations/${id}`, {
            method: 'DELETE'
        })
    }

    // Obtener reservas por rango de fechas
    async getReservationsByDateRange(cabinId: string, startDate: string, endDate: string): Promise<StrapiReservation[]> {
        const endpoint = `/reservations?filters[cabinId][$eq]=${cabinId}&filters[checkIn][$gte]=${startDate}&filters[checkOut][$lte]=${endDate}&sort=checkIn:asc`
        
        const response = await this.request<StrapiReservation[]>(endpoint)
        return response || []
    }

    // Verificar conflictos de fechas
    async checkDateConflicts(cabinId: string, checkIn: string, checkOut: string, excludeId?: number): Promise<StrapiReservation[]> {
        let endpoint = `/reservations?filters[cabinId][$eq]=${cabinId}&filters[status][$ne]=cancelled`
        
        // Buscar reservas que se solapan con las fechas dadas
        endpoint += `&filters[$or][0][checkIn][$lte]=${checkIn}&filters[$or][0][checkOut][$gt]=${checkIn}`
        endpoint += `&filters[$or][1][checkIn][$lt]=${checkOut}&filters[$or][1][checkOut][$gte]=${checkOut}`
        endpoint += `&filters[$or][2][checkIn][$gte]=${checkIn}&filters[$or][2][checkOut][$lte]=${checkOut}`
        
        if (excludeId) {
            endpoint += `&filters[id][$ne]=${excludeId}`
        }

        const response = await this.request<StrapiReservation[]>(endpoint)
        return response || []
    }
}

// Función helper para convertir StrapiReservation a formato local
export function strapiToLocalReservation(strapiReservation: StrapiReservation): LocalReservation {
    return {
        id: strapiReservation.id.toString(), // Convertir a string para LocalReservation
        cabinId: strapiReservation.cabinId,
        checkIn: new Date(strapiReservation.checkIn),
        checkOut: new Date(strapiReservation.checkOut),
        guestName: strapiReservation.guestName,
        guestEmail: strapiReservation.guestEmail,
        guestPhone: strapiReservation.guestPhone || undefined,
        adults: strapiReservation.adults,
        children: strapiReservation.children,
        pets: strapiReservation.pets,
        status: strapiReservation.status,
        source: strapiReservation.source,
        externalId: strapiReservation.externalId || undefined,
        reservationCode: strapiReservation.reservationCode || undefined,
        totalPrice: strapiReservation.totalPrice || undefined,
        currency: strapiReservation.currency || undefined,
        specialRequests: strapiReservation.specialRequests || undefined,
        createdAt: new Date(strapiReservation.createdAt),
        updatedAt: new Date(strapiReservation.updatedAt)
    }
}

// Función helper para convertir formato local a Strapi
export function localToStrapiReservation(localReservation: LocalReservation): StrapiReservationInput {
    return {
        cabinId: localReservation.cabinId,
        checkIn: localReservation.checkIn.toISOString().split('T')[0],
        checkOut: localReservation.checkOut.toISOString().split('T')[0],
        guestName: localReservation.guestName,
        guestEmail: localReservation.guestEmail,
        guestPhone: localReservation.guestPhone,
        adults: localReservation.adults,
        children: localReservation.children,
        pets: localReservation.pets,
        status: localReservation.status,
        source: localReservation.source,
        externalId: localReservation.externalId,
        reservationCode: localReservation.reservationCode,
        totalPrice: localReservation.totalPrice,
        currency: localReservation.currency,
        specialRequests: localReservation.specialRequests
    }
} 