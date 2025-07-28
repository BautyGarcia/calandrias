import { CalendarDay, CalendarEvent, CalendarMonth, CabinInfo, ReservationDetails } from '@/types/calendar'
import { LocalReservation } from '@/types/reservation'

// Obtener los días de un mes para el calendario
export function getCalendarMonth(year: number, month: number): CalendarMonth {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  const endDate = new Date(lastDay)

  // Ajustar para mostrar la semana completa
  startDate.setDate(startDate.getDate() - startDate.getDay())
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const days: CalendarDay[] = []
  const currentDate = new Date(startDate)
  const today = new Date()

  while (currentDate <= endDate) {
    const isCurrentMonth = currentDate.getMonth() === month
    const isToday =
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()

    days.push({
      date: new Date(currentDate),
      isCurrentMonth,
      isToday,
      availability: [] // Se llenará con los eventos
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return {
    year,
    month,
    days
  }
}

// Convertir eventos de iCal a eventos de calendario
export function convertICalToCalendarEvents(icalEvents: any[], cabins: CabinInfo[]): CalendarEvent[] {
  const events: CalendarEvent[] = []

  Object.values(icalEvents).forEach((event: any) => {
    if (event.type !== 'VEVENT' || !event.start || !event.end) return

    // Determinar la cabaña basada en el summary o descripción
    const cabin = determineCabinFromEvent(event, cabins)
    if (!cabin) return

    // Extraer detalles de la reserva
    const reservationDetails = extractReservationDetails(event)

    // Determinar el tipo de evento
    const eventType = determineEventType(event)

    events.push({
      id: event.uid || `${event.start}-${event.end}`,
      title: event.summary || 'Evento sin título',
      start: new Date(event.start),
      end: new Date(event.end),
      cabinId: cabin.id,
      type: eventType,
      details: reservationDetails
    })
  })

  return events
}

// Determinar la cabaña a partir del evento
function determineCabinFromEvent(event: any, cabins: CabinInfo[]): CabinInfo | null {
  const summary = event.summary?.toLowerCase() || ''
  const description = event.description?.toLowerCase() || ''
  const location = event.location?.toLowerCase() || ''

  // Si el evento menciona una cabaña específica
  for (const cabin of cabins) {
    if (
      summary.includes(cabin.name.toLowerCase()) ||
      summary.includes(cabin.slug) ||
      description.includes(cabin.name.toLowerCase()) ||
      location.includes(cabin.name.toLowerCase())
    ) {
      return cabin
    }
  }

  // Detectar por capacidad mencionada en la descripción
  const adultsMatch = description.match(/adults?:\s*(\d+)/i)
  if (adultsMatch) {
    const adults = parseInt(adultsMatch[1])
    const suitableCabin = cabins.find(c => c.capacity >= adults)
    if (suitableCabin) return suitableCabin
  }

  // Por defecto, asignar a la primera cabaña si no se puede determinar
  return cabins[0] || null
}

// Extraer detalles de reserva del evento
function extractReservationDetails(event: any): ReservationDetails | undefined {
  if (!event.description) return undefined

  const description = event.description

  // Extraer código de reserva
  const reservationCodeMatch = description.match(/Reservation Code:\s*([A-Z0-9]+)/i)

  // Extraer nombre del huésped
  const guestMatch = description.match(/Guest:\s*([^\\n]+)/i)

  // Extraer números
  const adultsMatch = description.match(/Adults?:\s*(\d+)/i)
  const childrenMatch = description.match(/Children:\s*(\d+)/i)
  const petsMatch = description.match(/Pets?:\s*(\d+)/i)

  return {
    reservationCode: reservationCodeMatch?.[1],
    guestName: guestMatch?.[1]?.trim(),
    checkIn: new Date(event.start),
    checkOut: new Date(event.end),
    guests: adultsMatch ? parseInt(adultsMatch[1]) : 0,
    pets: petsMatch ? parseInt(petsMatch[1]) : 0,
    notes: description
  }
}

// Determinar el tipo de evento
function determineEventType(event: any): 'reservation' | 'blocked' | 'maintenance' {
  const summary = event.summary?.toLowerCase() || ''
  const description = event.description?.toLowerCase() || ''

  if (summary.includes('blocked') || summary.includes('bloqueado')) {
    return 'blocked'
  }

  if (
    description.includes('maintenance') ||
    description.includes('mantenimiento') ||
    description.includes('limpieza')
  ) {
    return 'maintenance'
  }

  return 'reservation'
}

// Formatear fecha para mostrar
export function formatCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Verificar si una fecha está en un rango
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  // Incluir tanto fecha de inicio como fecha de fin
  // Para una reserva del 5 al 6, debe bloquear 5 Y 6
  return checkDate >= startDate && checkDate <= endDate
}

// Obtener el estado de disponibilidad para una cabaña en una fecha específica
export function getCabinAvailabilityForDate(
  date: Date,
  cabinId: string,
  events: CalendarEvent[]
): 'available' | 'reserved' | 'blocked' | 'maintenance' {
  const dayEvents = events.filter(event =>
    event.cabinId === cabinId && isDateInRange(date, event.start, event.end)
  )

  if (dayEvents.length === 0) return 'available'

  // Prioridad: maintenance > blocked > reserved
  if (dayEvents.some(e => e.type === 'maintenance')) return 'maintenance'
  if (dayEvents.some(e => e.type === 'blocked')) return 'blocked'
  if (dayEvents.some(e => e.type === 'reservation')) return 'reserved'

  return 'available'
}

// Colores para los estados
export const AVAILABILITY_COLORS = {
  available: '#10b981', // green-500
  reserved: '#ef4444', // red-500
  blocked: '#f59e0b', // amber-500
  maintenance: '#8b5cf6' // violet-500
} as const

// Función helper para crear fechas sin problemas de zona horaria
function createDateFromString(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate())
  }

  // Si es un string, parsearlo como fecha local
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // Los meses en JS son 0-indexed
    const day = parseInt(parts[2])
    return new Date(year, month, day)
  }

  // Fallback
  return new Date(dateString)
}

// Convertir reservas de Strapi a eventos de calendario
export function convertStrapiReservationsToCalendarEvents(
  reservations: LocalReservation[]
): CalendarEvent[] {
  return reservations
    .filter(reservation => reservation.status !== 'cancelled') // Excluir canceladas
    .map(reservation => {
      // Crear fechas sin problemas de zona horaria
      const startDate = createDateFromString(reservation.checkIn)
      const endDate = createDateFromString(reservation.checkOut)

      return {
        id: `strapi-${reservation.id}`,
        title: `${reservation.guestName} - ${reservation.source === 'direct' ? 'Reserva Directa' : reservation.source}`,
        start: startDate,
        end: endDate,
        cabinId: reservation.cabinId,
        type: 'reservation' as const,
        details: {
          guestName: reservation.guestName,
          reservationCode: reservation.reservationCode || `REF-${reservation.id}`,
          source: reservation.source,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          guests: reservation.guests,
          pets: reservation.pets,
          specialRequests: reservation.specialRequests
        }
      }
    })
} 