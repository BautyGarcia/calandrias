export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  availability: CabinAvailability[]
}

export interface CabinAvailability {
  cabinId: string
  cabinName: string
  status: 'available' | 'reserved' | 'blocked' | 'maintenance'
  reservationDetails?: ReservationDetails
}

export interface ReservationDetails {
  reservationCode?: string
  guestName?: string
  checkIn: Date
  checkOut: Date
  adults: number
  children: number
  pets: number
  notes?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  cabinId: string
  type: 'reservation' | 'blocked' | 'maintenance'
  details?: ReservationDetails
}

export interface CalendarMonth {
  year: number
  month: number
  days: CalendarDay[]
}

export interface CalendarState {
  currentDate: Date
  selectedDate: Date | null
  events: CalendarEvent[]
  cabins: CabinInfo[]
  view: 'month' | 'week' | 'day'
}

export interface CabinInfo {
  id: string
  name: string
  slug: string
  capacity: number
  color: string // Color para identificar la cabaña en el calendario
} 