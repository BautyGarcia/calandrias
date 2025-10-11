import { LocalReservation, StrapiReservation, StrapiReservationInput, StrapiReservationUpdate } from '@/types'
import { Cabin } from '@/types/cabin'

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

    // Actualizar reserva existente (usar documentId para Strapi v5)
    async updateReservation(documentId: string, reservationData: StrapiReservationUpdate): Promise<StrapiReservation> {
        const response = await this.request<StrapiReservation>(`/reservations/${documentId}`, {
            method: 'PUT',
            body: JSON.stringify({
                data: reservationData
            })
        })
        return response
    }

    // Eliminar reserva (usar documentId para Strapi v5)
    async deleteReservation(documentId: string): Promise<void> {
        await this.request(`/reservations/${documentId}`, {
            method: 'DELETE'
        })
    }

    // Confirmar reserva
    async confirmReservation(documentId: string): Promise<boolean> {
        const response = await this.request<boolean>('/reservations/confirm', {
            method: 'POST',
            body: JSON.stringify({
                id: documentId
            })
        })
        return response
    }

    // Cancelar reserva
    async cancelReservation(documentId: string): Promise<boolean> {
        const response = await this.request<boolean>('/reservations/cancel', {
            method: 'POST',
            body: JSON.stringify({
                id: documentId
            })
        })
        return response
    }

    // Obtener reservas por rango de fechas
    async getReservationsByDateRange(cabinId: string, startDate: string, endDate: string): Promise<StrapiReservation[]> {
        const endpoint = `/reservations?filters[cabinId][$eq]=${cabinId}&filters[checkIn][$gte]=${startDate}&filters[checkOut][$lte]=${endDate}&sort=checkIn:asc`
        
        const response = await this.request<StrapiReservation[]>(endpoint)
        return response || []
    }

    // Verificar disponibilidad usando el endpoint centralizado
    async checkDateAvailability(cabinId: string, checkIn: string, checkOut: string): Promise<{
        isAvailable: boolean
        conflictingReservations: StrapiReservation[]
        requestedPeriod: {
            checkIn: string
            checkOut: string
            cabinId: string
        }
    }> {
        const response = await this.request<{
            isAvailable: boolean
            conflictingReservations: StrapiReservation[]
            requestedPeriod: {
                checkIn: string
                checkOut: string
                cabinId: string
            }
        }>('/reservations/check-date-is-available', {
            method: 'POST',
            body: JSON.stringify({
                checkIn,
                checkOut,
                cabinId
            })
        })
        
        return response
    }

    // ============================================
    // CABINS ENDPOINTS
    // ============================================

    // Obtener todas las cabañas
    async getCabins(): Promise<Cabin[]> {
        const response = await this.request<Cabin[]>('/cabins')
        return response || []
    }

    // Obtener cabaña por slug
    async getCabinBySlug(slug: string): Promise<Cabin | null> {
        const response = await this.request<Cabin[]>(`/cabins?filters[slug][$eq]=${slug}&populate=*`)
        return response?.[0] || null
    }

    // Obtener cabaña por ID
    async getCabinById(id: number): Promise<Cabin | null> {
        const response = await this.request<Cabin>(`/cabins/${id}?populate=*`)
        return response || null
    }

    // Obtener cabaña por documentId
    async getCabinByDocumentId(documentId: string): Promise<Cabin | null> {
        const response = await this.request<Cabin[]>(`/cabins?filters[documentId][$eq]=${documentId}&populate=*`)
        return response?.[0] || null
    }

    /**
     * Obtiene configuraciones de sync de Airbnb desde Strapi
     * SOLO para uso en backend (cron jobs, admin APIs)
     * Las URLs son campos privados y no se exponen al frontend
     */
    async getAirbnbSyncConfigs(): Promise<Array<{
        cabinId: string;
        cabinSlug: string;
        cabinName: string;
        icalUrl: string;
    }>> {
        try {
            // Obtener todas las cabañas (incluyendo campos privados si están disponibles)
            const cabins = await this.getCabins();
            
            // Filtrar solo las que tienen URL de Airbnb configurada
            return cabins
                .filter(cabin => cabin.airbnb_ical_url && cabin.airbnb_ical_url.trim() !== '')
                .map(cabin => ({
                    cabinId: cabin.slug, // Usar slug como ID principal
                    cabinSlug: cabin.slug,
                    cabinName: cabin.name,
                    icalUrl: cabin.airbnb_ical_url!
                }));
        } catch (error) {
            console.error('Error fetching Airbnb sync configs from Strapi:', error);
            throw error;
        }
    }
}

// Función helper para convertir StrapiReservation a formato local
export function strapiToLocalReservation(strapiReservation: StrapiReservation): LocalReservation {
    return {
        id: strapiReservation.id.toString(),
        documentId: strapiReservation.documentId,
        cabinId: strapiReservation.cabinId,
        checkIn: new Date(strapiReservation.checkIn),
        checkOut: new Date(strapiReservation.checkOut),
        guestName: strapiReservation.guestName,
        guestEmail: strapiReservation.guestEmail,
        guestPhone: strapiReservation.guestPhone || undefined,
        guests: strapiReservation.guests,
        pets: strapiReservation.pets,
        state: strapiReservation.state,
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
        guests: localReservation.guests,
        pets: localReservation.pets,
        state: localReservation.state,
        source: localReservation.source,
        externalId: localReservation.externalId,
        reservationCode: localReservation.reservationCode,
        totalPrice: localReservation.totalPrice,
        currency: localReservation.currency,
        specialRequests: localReservation.specialRequests
    }
} 