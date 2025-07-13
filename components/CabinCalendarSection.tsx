"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Loader2, CalendarDays, Users, DollarSign, CheckCircle } from "lucide-react"
import CabinAvailabilityCalendar, { DateRange } from '@/components/calendar/CabinAvailabilityCalendar'
import SelectedDateRange from '@/components/calendar/SelectedDateRange'
import ReservationForm from '@/components/ReservationForm'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useReservations } from '@/hooks/useReservations'
import { CALENDAR_CABINS } from '@/data/cabins-calendar'
import { Cabin } from '@/data/cabins'
import { ReservationFormData } from '@/types/reservation'
import { CreateReservationRequest } from '@/types/api'
import { getCabinICalUrl } from '@/utils/cabins'


interface CabinCalendarSectionProps {
  cabin: Cabin
}

export default function CabinCalendarSection({ cabin }: CabinCalendarSectionProps) {
  const { events, loading, error, syncing, loadFromUrl, refreshStrapiOnly } = useCalendarData({ cabinId: cabin.slug })
  const { createReservation, isLoading: isSubmittingReservation } = useReservations()
  const [isAutoLoaded, setIsAutoLoaded] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange>({ from: null, to: null })
  const [currentStep, setCurrentStep] = useState<'calendar' | 'form'>('calendar')
  const [syncSuccess, setSyncSuccess] = useState(false)

  // Effect to show sync success indicator
  useEffect(() => {
    if (!syncing && syncSuccess) {
      const timer = setTimeout(() => setSyncSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
    if (syncing) {
      setSyncSuccess(true)
    }
  }, [syncing, syncSuccess])

  // Get the appropriate iCal URL for this cabin
  const icalUrl = getCabinICalUrl(cabin.slug)

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
      const loadData = async () => {
        try {
          // Always load Strapi reservations
          await refreshStrapiOnly()
          
          // Only load from iCal URL if one is configured
          if (icalUrl) {
            await loadFromUrl(icalUrl)
          }
          
          setIsAutoLoaded(true)
        } catch (err) {
          console.error('Failed to load calendar data:', err)
          setIsAutoLoaded(true) // Still mark as attempted to prevent infinite retries
        }
      }
      
      loadData()
    }
  }, [icalUrl, loadFromUrl, refreshStrapiOnly, isAutoLoaded, loading, events.length, cabin.slug])

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

  // Handle reservation form submission
  const handleReservationSubmit = async (formData: ReservationFormData): Promise<void> => {
    if (!selectedRange.from || !selectedRange.to) {
      throw new Error('Fechas no seleccionadas')
    }

    try {
      const reservationRequest: CreateReservationRequest = {
        cabinId: cabin.slug,
        checkIn: selectedRange.from.toISOString().split('T')[0],
        checkOut: selectedRange.to.toISOString().split('T')[0],
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        adults: formData.adults,
        children: formData.children,
        pets: formData.pets,
        specialRequests: formData.specialRequests,
        totalPrice: totalPrice,
        currency: 'ARS',
        status: 'pending',
        source: 'direct'
      }

      await createReservation(reservationRequest)

      // Limpiar fechas seleccionadas y refrescar solo reservas de Strapi (más eficiente)
      setSelectedRange({ from: null, to: null })
      await refreshStrapiOnly()
    } catch (error) {
      console.error('Error submitting reservation:', error)

      // También refrescar reservas de Strapi en caso de error (puede que haya conflictos nuevos)
      await refreshStrapiOnly()

      // Re-lanzar el error para que el formulario lo maneje
      throw error
    }
  }

  const handleReserveClick = () => {
    if (selectedRange.from && selectedRange.to) {
      setCurrentStep('form')
    }
  }

  const handleBackToCalendar = () => {
    // Actualizar reservas de Strapi antes de volver para mostrar cambios recientes
    refreshStrapiOnly()
    setCurrentStep('calendar')
  }

  return (
    <section className="py-16 bg-[var(--soft-cream)]">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-[var(--brown-earth)] font-bold mb-4">
              Disponibilidad y Reserva
            </h2>
            <p className="text-[var(--slate-gray)] max-w-2xl mx-auto">
              {currentStep === 'calendar'
                ? `Selecciona las fechas para tu estadía en ${cabin.subtitle.toLowerCase()}.`
                : 'Completa la información para confirmar tu reserva.'
              }
            </p>
          </div>

          {currentStep === 'calendar' ? (
            /* Calendar and Reservation Menu */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar Display - 2/3 width */}
              <div className="lg:col-span-2">
                <Card className="border-[var(--beige-arena)]">
                  <CardHeader className="border-b border-[var(--beige-arena)]">
                    <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Selecciona tus fechas
                      {!syncing && syncSuccess && (
                        <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          <span>Sincronizado</span>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-[var(--green-moss)]" />
                        <div className="text-center space-y-2">
                          <h3 className="text-lg font-medium text-[var(--brown-earth)]">
                            {syncing ? 'Sincronizando con Airbnb' : 'Cargando calendario'}
                          </h3>
                          <p className="text-[var(--slate-gray)]">
                            {syncing 
                              ? 'Actualizando reservas desde Airbnb...'
                              : 'Obteniendo la disponibilidad más actualizada...'
                            }
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
                      onClick={handleReserveClick}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Continuar con la Reserva
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
          ) : (
            /* Reservation Form */
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <ReservationForm
                  onSubmit={handleReservationSubmit}
                  onCalendarRefresh={refreshStrapiOnly}
                  isLoading={isSubmittingReservation}
                />
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <Card className="border-[var(--beige-arena)] sticky top-8">
                  <CardHeader className="border-b border-[var(--beige-arena)]">
                    <CardTitle className="text-[var(--brown-earth)]">
                      Resumen de Reserva
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-[var(--brown-earth)]">{cabin.name}</h4>
                      <p className="text-sm text-[var(--slate-gray)]">{cabin.subtitle}</p>
                    </div>

                    <SelectedDateRange selectedRange={selectedRange} />

                    <div className="space-y-2 pt-4 border-t border-[var(--beige-arena)]">
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
                        <div className="flex justify-between font-medium text-lg">
                          <span className="text-[var(--brown-earth)]">Total</span>
                          <span className="text-[var(--brown-earth)]">${formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleBackToCalendar}
                      className="w-full mt-4 border-[var(--brown-earth)] text-[var(--brown-earth)]"
                    >
                      Cambiar Fechas
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
} 