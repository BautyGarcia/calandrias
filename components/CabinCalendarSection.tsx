"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Calendar, RefreshCw, Loader2 } from "lucide-react"
import CabinAvailabilityCalendar from '@/components/calendar/CabinAvailabilityCalendar'
import { useCalendarData } from '@/hooks/useCalendarData'
import { CALENDAR_CABINS } from '@/data/cabins-calendar'
import { Cabin } from '@/data/cabins'

// Configuration for dynamic iCal URLs per cabin
const CABIN_ICAL_URLS: Record<string, string> = {
  // Default URL for all cabins for now - can be customized per cabin in the future
  'refugio-intimo': 'https://www.airbnb.com.ar/calendar/ical/1424652928174532253.ics?s=b96f0ce321866e603b783e255ef7d430',
  'confort-familiar': 'https://www.airbnb.com.ar/calendar/ical/1424652928174532253.ics?s=b96f0ce321866e603b783e255ef7d430',
  'experiencia-premium': 'https://www.airbnb.com.ar/calendar/ical/1424652928174532253.ics?s=b96f0ce321866e603b783e255ef7d430',
  'retiro-exclusivo': 'https://www.airbnb.com.ar/calendar/ical/1424652928174532253.ics?s=b96f0ce321866e603b783e255ef7d430'
}

// Default URL fallback
const DEFAULT_ICAL_URL = 'https://www.airbnb.com.ar/calendar/ical/1424652928174532253.ics?s=b96f0ce321866e603b783e255ef7d430'

interface CabinCalendarSectionProps {
  cabin: Cabin
}

export default function CabinCalendarSection({ cabin }: CabinCalendarSectionProps) {
  const { events, loading, error, loadFromUrl, clearData } = useCalendarData()
  const [isAutoLoaded, setIsAutoLoaded] = useState(false)

  // Get the appropriate iCal URL for this cabin
  const icalUrl = CABIN_ICAL_URLS[cabin.slug] || DEFAULT_ICAL_URL

  // Auto-load calendar data when component mounts
  useEffect(() => {
    if (!isAutoLoaded && !loading && events.length === 0) {
      console.log(`Auto-loading calendar data for cabin: ${cabin.slug}`)
      console.log(`Using iCal URL: ${icalUrl}`)
      
      loadFromUrl(icalUrl)
        .then(() => {
          console.log('Calendar data loaded successfully')
          setIsAutoLoaded(true)
        })
        .catch((err) => {
          console.error('Failed to load calendar data:', err)
          setIsAutoLoaded(true) // Still mark as attempted to prevent infinite retries
        })
    }
  }, [icalUrl, loadFromUrl, isAutoLoaded, loading, events.length, cabin.slug])

  // Get the appropriate calendar cabin config
  const calendarCabin = CALENDAR_CABINS.find(c => 
    c.name.toLowerCase().includes(cabin.subtitle.toLowerCase().split(' ')[0]) ||
    c.name.toLowerCase().includes(cabin.name.toLowerCase())
  ) || CALENDAR_CABINS[0]

  const handleRefresh = async () => {
    console.log(`Refreshing calendar data for cabin: ${cabin.slug}`)
    try {
      await loadFromUrl(icalUrl)
      console.log('Calendar data refreshed successfully')
    } catch (err) {
      console.error('Failed to refresh calendar data:', err)
    }
  }

  return (
    <section className="py-16 bg-[var(--soft-cream)]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-[var(--brown-earth)] font-bold mb-4">
              Disponibilidad de {cabin.name}
            </h2>
            <p className="text-[var(--slate-gray)] max-w-2xl mx-auto">
              Selecciona las fechas para tu estadía en {cabin.subtitle.toLowerCase()}. 
              Los datos se sincronizan automáticamente con nuestro sistema de reservas.
            </p>
          </div>

          {/* Calendar Display */}
          <Card className="border-[var(--beige-arena)]">
            <CardHeader className="border-b border-[var(--beige-arena)]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Selecciona tus fechas
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  {/* Status indicator */}
                  {loading && (
                    <div className="flex items-center gap-2 text-[var(--slate-gray)] text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando...
                    </div>
                  )}
                  
                  {!loading && events.length > 0 && (
                    <div className="flex items-center gap-2 text-[var(--green-moss)] text-sm">
                      <div className="w-2 h-2 bg-[var(--green-moss)] rounded-full animate-pulse"></div>
                      Sincronizado
                    </div>
                  )}

                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={loading}
                      className="text-[var(--slate-gray)] hover:text-[var(--brown-earth)]"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-[var(--green-moss)]" />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-[var(--brown-earth)]">
                      Cargando calendario
                    </h3>
                    <p className="text-[var(--slate-gray)]">
                      Obteniendo la disponibilidad más actualizada desde Airbnb...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-[var(--brown-earth)]">
                      Error al cargar el calendario
                    </h3>
                    <p className="text-[var(--slate-gray)]">
                      {error}
                    </p>
                    <Button 
                      onClick={handleRefresh}
                      variant="outline"
                      className="mt-4"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reintentar
                    </Button>
                  </div>
                </div>
              ) : (
                <CabinAvailabilityCalendar
                  cabinId={calendarCabin.id}
                  cabinName={cabin.name}
                  events={events}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
} 