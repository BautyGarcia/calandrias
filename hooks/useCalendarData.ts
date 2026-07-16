"use client"

import { useState, useCallback } from 'react'
import { CalendarEvent } from '@/types/calendar'
import { AvailabilityRange } from '@/types/db'
import { availabilityToCalendarEvents } from '@/utils/calendar'

interface UseCalendarDataProps {
  cabinId?: string
}

export function useCalendarData({ cabinId }: UseCalendarDataProps = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Único fetch: disponibilidad pública (sin datos personales) por cabaña.
  const loadAvailability = useCallback(async () => {
    if (!cabinId) {
      setEvents([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/availability?cabin=${encodeURIComponent(cabinId)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener la disponibilidad')
      }

      const ranges: AvailabilityRange[] = result.ranges || []
      setEvents(availabilityToCalendarEvents(ranges, cabinId))
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [cabinId])

  const clearData = useCallback(() => {
    setEvents([])
    setError(null)
    setLastUpdated(null)
  }, [])

  return {
    events,
    loading,
    error,
    lastUpdated,
    // `syncing` se conserva por compatibilidad; ya no hay sync de Airbnb en el cliente.
    syncing: false,
    refreshEvents: loadAvailability,
    refreshStrapiOnly: loadAvailability,
    clearData,
  }
}
