"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Loader2, CalendarDays, Users, DollarSign } from "lucide-react"
import CabinAvailabilityCalendar, { DateRange } from '@/components/calendar/CabinAvailabilityCalendar'
import SelectedDateRange from '@/components/calendar/SelectedDateRange'
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
  const { events, loading, error, loadFromUrl } = useCalendarData()
  const [isAutoLoaded, setIsAutoLoaded] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange>({ from: null, to: null })

  // Get the appropriate iCal URL for this cabin
  const icalUrl = CABIN_ICAL_URLS[cabin.slug] || DEFAULT_ICAL_URL

  // Helper function to convert price string to number
  const parsePrice = (priceString: string): number => {
    return Number(priceString.replace(/,/g, ''))
  }

  // Helper function to format number with commas
  const formatPrice = (price: number): string => {
    return price.toLocaleString('es-AR')
  }

  // Auto-load calendar data when component mounts
  useEffect(() => {
    if (!isAutoLoaded && !loading && events.length === 0) {    
      loadFromUrl(icalUrl)
        .then(() => {
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

  // Calculate nights and total price
  const nights = selectedRange.from && selectedRange.to 
    ? Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24))
    : 3 // Default 3 nights for display

  const pricePerNight = parsePrice(cabin.price)
  const basePrice = pricePerNight * nights
  const cleaningFee = 50
  const serviceFee = 25
  const totalPrice = basePrice + cleaningFee + serviceFee

  return (
    <section className="py-16 bg-[var(--soft-cream)]">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-[var(--brown-earth)] font-bold mb-4">
              Disponibilidad y Reserva
            </h2>
            <p className="text-[var(--slate-gray)] max-w-2xl mx-auto">
              Selecciona las fechas para tu estadía en {cabin.subtitle.toLowerCase()}.
            </p>
          </div>

          {/* Calendar and Reservation Menu */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Display - 2/3 width */}
            <div className="lg:col-span-2">
              <Card className="border-[var(--beige-arena)]">
                <CardHeader className="border-b border-[var(--beige-arena)]">
                  <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Selecciona tus fechas
                  </CardTitle>
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
                          Obteniendo la disponibilidad más actualizada...
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
                      </div>
                    </div>
                  ) : (
                    <CabinAvailabilityCalendar
                      cabinId={calendarCabin.id}
                      events={events}
                      selectedRange={selectedRange}
                      onRangeChange={setSelectedRange}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Reservation Menu - 1/3 width */}
            <div className="lg:col-span-1">
              <Card className="border-[var(--beige-arena)] sticky top-8">
                <CardHeader className="border-b border-[var(--beige-arena)]">
                  <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Tu Reserva
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* Selected Date Range */}
                  <SelectedDateRange selectedRange={selectedRange} />
                  
                  {/* Guest Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--dark-wood)]">
                      Huéspedes
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-[var(--light-sand)] rounded-lg border border-[var(--beige-arena)]">
                      <Users className="h-4 w-4 text-[var(--slate-gray)]" />
                      <span className="text-sm text-[var(--slate-gray)]">
                        Hasta {cabin.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Price Estimate */}
                  <div className="space-y-4 pt-4 border-t border-[var(--beige-arena)]">
                    <h4 className="font-medium text-[var(--brown-earth)]">Estimado de precios</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--slate-gray)]">${cabin.price} x {nights} noches</span>
                        <span className="text-[var(--dark-wood)]">${formatPrice(basePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--slate-gray)]">Limpieza</span>
                        <span className="text-[var(--dark-wood)]">${formatPrice(cleaningFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--slate-gray)]">Servicios</span>
                        <span className="text-[var(--dark-wood)]">${formatPrice(serviceFee)}</span>
                      </div>
                      <div className="border-t border-[var(--beige-arena)] pt-2 mt-2">
                        <div className="flex justify-between font-medium">
                          <span className="text-[var(--brown-earth)]">Total</span>
                          <span className="text-[var(--brown-earth)]">${formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reserve Button */}
                  <Button 
                    variant="wood" 
                    size="lg" 
                    className="w-full font-medium"
                    disabled={!selectedRange.from || !selectedRange.to}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Reservar
                  </Button>
                  
                  {(!selectedRange.from || !selectedRange.to) && (
                    <p className="text-xs text-[var(--slate-gray)] text-center">
                      Selecciona fechas para activar la reserva
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 