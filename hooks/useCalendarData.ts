"use client"

import { useState, useEffect } from 'react'
import { CalendarEvent } from '@/types/calendar'
import { convertICalToCalendarEvents } from '@/utils/calendar'
import { CALENDAR_CABINS } from '@/data/cabins-calendar'

interface UseCalendarDataProps {
  icalUrl?: string
  autoLoad?: boolean
}

export function useCalendarData({ icalUrl, autoLoad = false }: UseCalendarDataProps = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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

      const calendarEvents = convertICalToCalendarEvents(Object.values(result.events), CALENDAR_CABINS)
      setEvents(calendarEvents)
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

  const refresh = () => {
    if (icalUrl) {
      loadFromUrl(icalUrl)
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
    refresh,
    clearData
  }
} 