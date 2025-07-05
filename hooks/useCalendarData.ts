"use client"

import { useState, useEffect } from 'react'
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

  const loadStrapiReservations = async (targetCabinId?: string) => {
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
  }

  const loadFromUrl = async (url: string) => {
    setLoading(true)
    setError(null)

    try {
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
  }

  const loadFromContent = async (content: string) => {
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

      const calendarEvents = convertICalToCalendarEvents(Object.values(result.events), CALENDAR_CABINS)
      setEvents(calendarEvents)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const loadExampleData = async () => {
    try {
      const response = await fetch('/examples/example-airbnb.ics')
      const content = await response.text()
      await loadFromContent(content)
    } catch (err) {
      setError('Error al cargar datos de ejemplo')
    }
  }

  const refreshEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      let icalEvents: CalendarEvent[] = []
      
      // Cargar eventos de iCal si hay URL
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
      
      // Siempre cargar reservas de Strapi
      const strapiEvents = await loadStrapiReservations(cabinId)
      
      // Combinar todos los eventos
      const allEvents = [...icalEvents, ...strapiEvents]
      
      setEvents(allEvents)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const refreshStrapiOnly = async () => {
    try {
      const strapiEvents = await loadStrapiReservations(cabinId)
      
      // Mantener eventos de iCal existentes y actualizar solo Strapi
      const currentIcalEvents = events.filter(event => !event.id.startsWith('strapi-'))
      const allEvents = [...currentIcalEvents, ...strapiEvents]
      
      setEvents(allEvents)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error refreshing Strapi events:', err)
    }
  }

  const clearData = () => {
    setEvents([])
    setError(null)
    setLastUpdated(null)
  }

  // Auto-load en mount si se proporciona URL
  useEffect(() => {
    if (autoLoad && icalUrl) {
      loadFromUrl(icalUrl)
    }
  }, [icalUrl, autoLoad])

  return {
    events,
    loading,
    error,
    lastUpdated,
    loadFromUrl,
    loadFromContent,
    loadExampleData,
    refreshEvents,
    refreshStrapiOnly,
    clearData
  }
} 