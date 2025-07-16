"use client"

import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent } from '@/types/calendar'
import { convertICalToCalendarEvents, convertStrapiReservationsToCalendarEvents } from '@/utils/calendar'
import { CALENDAR_CABINS } from '@/data/cabins-calendar'

interface UseCalendarDataProps {
  icalUrl?: string
  autoLoad?: boolean
  cabinId?: string
}

export function useCalendarData({ icalUrl, autoLoad = false, cabinId }: UseCalendarDataProps = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)

  const syncAirbnb = useCallback(async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/cron/sync-airbnb', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`
        }
      })

      if (!response.ok) {
        console.warn('Airbnb sync failed, continuing with existing data')
      }
    } catch (error) {
      console.warn('Airbnb sync error, continuing with existing data:', error)
    } finally {
      setSyncing(false)
    }
  }, [])

  const loadStrapiReservations = useCallback(async (targetCabinId?: string) => {
    try {
      const url = targetCabinId 
        ? `/api/reservations?cabinId=${targetCabinId}`
        : '/api/reservations'
      
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener reservas de Strapi')
      }

      return convertStrapiReservationsToCalendarEvents(result.reservations || [])
    } catch (err) {
      console.error('Error loading Strapi reservations:', err)
      return []
    }
  }, [])

  const loadFromUrl = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)

    try {
      // Sincronizar con Airbnb antes de cargar datos (solo cuando es necesario)
      if (cabinId) {
        await syncAirbnb()
      }

      const response = await fetch('/api/parse-ical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'url',
          data: url 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el iCal')
      }

      const icalEvents = convertICalToCalendarEvents(Object.values(result.events), CALENDAR_CABINS)
      
      const strapiEvents = await loadStrapiReservations(cabinId)
      
      const allEvents = [...icalEvents, ...strapiEvents]
      
      setEvents(allEvents)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [cabinId, syncAirbnb, loadStrapiReservations])

  const loadFromContent = useCallback(async (content: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/parse-ical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'content',
          data: content 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el iCal')
      }

      const icalEvents = convertICalToCalendarEvents(Object.values(result.events), CALENDAR_CABINS)
      setEvents(icalEvents)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadExampleData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Simular carga de datos de ejemplo
      await new Promise(resolve => setTimeout(resolve, 1000))
      setEvents([])
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Sincronizar con Airbnb antes de refrescar (solo cuando es necesario)
      if (cabinId) {
        await syncAirbnb()
      }

      // Obtener eventos de iCal si hay URL
      let icalEvents: CalendarEvent[] = []
      if (icalUrl) {
        const response = await fetch('/api/parse-ical', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            type: 'url',
            data: icalUrl 
          }),
        })

        const result = await response.json()

        if (response.ok) {
          icalEvents = convertICalToCalendarEvents(Object.values(result.events), CALENDAR_CABINS)
        }
      }

      // Obtener eventos de Strapi
      const strapiEvents = await loadStrapiReservations(cabinId)
      
      const allEvents = [...icalEvents, ...strapiEvents]
      
      setEvents(allEvents)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [cabinId, icalUrl, syncAirbnb, loadStrapiReservations])

  const refreshStrapiOnly = useCallback(async () => {
    try {
      // Solo cargar reservas de Strapi sin sincronizar Airbnb
      // (la sincronización ya se hizo en la carga inicial)
      const strapiEvents = await loadStrapiReservations(cabinId)
      
      // Mantener eventos de iCal existentes y actualizar solo Strapi
      const currentIcalEvents = events.filter(event => !event.id.startsWith('strapi-'))
      const allEvents = [...currentIcalEvents, ...strapiEvents]
      
      setEvents(allEvents)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error refreshing Strapi events:', err)
    }
  }, [cabinId, loadStrapiReservations, events])

  const clearData = useCallback(() => {
    setEvents([])
    setError(null)
    setLastUpdated(null)
  }, [])

  // Auto-load en mount si se proporciona URL
  useEffect(() => {
    if (autoLoad && icalUrl) {
      loadFromUrl(icalUrl)
    }
  }, [icalUrl, autoLoad, loadFromUrl])

  return {
    events,
    loading,
    error,
    lastUpdated,
    syncing,
    loadFromUrl,
    loadFromContent,
    loadExampleData,
    refreshEvents,
    refreshStrapiOnly,
    clearData,
    syncAirbnb
  }
} 