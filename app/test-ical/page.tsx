"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, FileText } from "lucide-react"
import AvailabilityCalendar from '@/components/calendar/AvailabilityCalendar'
import { convertICalToCalendarEvents } from '@/utils/calendar'
import { CALENDAR_CABINS } from '@/data/cabins-calendar'
import { CalendarEvent } from '@/types/calendar'

interface ICalEvent {
  type: string
  summary?: string
  description?: string
  start?: Date
  end?: Date
  location?: string
  organizer?: any
  uid?: string
  status?: string
}

interface ParsedEvents {
  [key: string]: ICalEvent
}

export default function TestICalPage() {
  const [icalUrl, setICalUrl] = useState('')
  const [icalContent, setICalContent] = useState('')
  const [events, setEvents] = useState<ParsedEvents | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'content'>('url')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Convertir eventos iCal a eventos de calendario
  const calendarEvents: CalendarEvent[] = events ? convertICalToCalendarEvents(Object.values(events), CALENDAR_CABINS) : []

  const parseFromUrl = async () => {
    if (!icalUrl.trim()) {
      setError('Por favor ingresa una URL válida')
      return
    }

    setLoading(true)
    setError('')
    setEvents(null)

    try {
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

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el iCal')
      }

      setEvents(result.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const parseFromContent = async () => {
    if (!icalContent.trim()) {
      setError('Por favor ingresa el contenido del iCal')
      return
    }

    setLoading(true)
    setError('')
    setEvents(null)

    try {
      const response = await fetch('/api/parse-ical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'content',
          data: icalContent 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el iCal')
      }

      setEvents(result.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getEventsByType = () => {
    if (!events) return { vevents: [], other: [] }
    
    const vevents: ICalEvent[] = []
    const other: ICalEvent[] = []
    
    Object.values(events).forEach(event => {
      if (event.type === 'VEVENT') {
        vevents.push(event)
      } else {
        other.push(event)
      }
    })
    
    // Ordenar eventos por fecha de inicio
    vevents.sort((a, b) => {
      if (!a.start || !b.start) return 0
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
    
    return { vevents, other }
  }

  const { vevents, other } = getEventsByType()

  return (
    <main className="min-h-screen bg-[var(--light-sand)] py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-serif text-[var(--brown-earth)] font-bold">
              Test iCal Parser & Calendar
            </h1>
            <p className="text-xl text-[var(--slate-gray)]">
              Experimenta con la librería node-ical y visualiza la disponibilidad en calendario
            </p>
          </div>

          {/* Input Section */}
          <Card className="bg-white border-[var(--beige-arena)]">
            <CardHeader>
              <CardTitle className="text-[var(--brown-earth)]">Cargar iCal</CardTitle>
              <div className="flex gap-4">
                <Button
                  variant={activeTab === 'url' ? 'wood' : 'outline'}
                  onClick={() => setActiveTab('url')}
                  size="sm"
                >
                  Desde URL
                </Button>
                <Button
                  variant={activeTab === 'content' ? 'wood' : 'outline'}
                  onClick={() => setActiveTab('content')}
                  size="sm"
                >
                  Contenido directo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === 'url' ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ical-url" className="block text-sm font-medium text-[var(--brown-earth)] mb-1">
                      URL del iCal de Airbnb
                    </label>
                    <Input
                      id="ical-url"
                      type="url"
                      placeholder="https://airbnb.com/calendar/ical/..."
                      value={icalUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setICalUrl(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={parseFromUrl} 
                    disabled={loading}
                    className="w-full"
                    variant="moss"
                  >
                    {loading ? 'Parseando...' : 'Parsear desde URL'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ical-content" className="block text-sm font-medium text-[var(--brown-earth)] mb-1">
                      Contenido iCal
                    </label>
                    <textarea
                      id="ical-content"
                      placeholder="Pega aquí el contenido completo del archivo .ics..."
                      value={icalContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setICalContent(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-[var(--beige-arena)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--green-moss)] focus:border-transparent"
                    />
                  </div>
                  <Button 
                    onClick={parseFromContent} 
                    disabled={loading}
                    className="w-full"
                    variant="moss"
                  >
                    {loading ? 'Parseando...' : 'Parsear contenido'}
                  </Button>
                </div>
              )}

              {/* Example URLs */}
              <div className="mt-4 p-4 bg-[var(--soft-cream)] rounded-lg">
                <h4 className="font-medium text-[var(--brown-earth)] mb-2">URLs de ejemplo:</h4>
                <div className="space-y-2 text-sm">
                  <button
                    onClick={() => setICalUrl('https://calendar.google.com/calendar/ical/en.ar%23holiday%40group.v.calendar.google.com/public/basic.ics')}
                    className="block text-[var(--green-moss)] hover:underline text-left"
                  >
                    Feriados Argentina (Google Calendar)
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/examples/example-airbnb.ics')
                        const content = await response.text()
                        setActiveTab('content')
                        setICalContent(content)
                      } catch (error) {
                        setError('Error al cargar el ejemplo')
                      }
                    }}
                    className="flex items-center gap-2 text-[var(--green-moss)] hover:underline text-left"
                  >
                    <FileText className="h-4 w-4" />
                    Cargar ejemplo de Airbnb (5 reservas)
                  </button>
                  <p className="text-[var(--slate-gray)] text-xs">
                    Nota: Para usar con Airbnb, necesitarás la URL específica de tu calendario que proporciona Airbnb
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Display */}
          {events && !loading && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    ¡Éxito! Se encontraron {Object.keys(events).length} elementos en el calendario
                  </span>
                  {calendarEvents.length > 0 && (
                    <span className="ml-2">
                      ({calendarEvents.length} eventos de cabañas)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Display */}
          {events && calendarEvents.length > 0 && (
            <AvailabilityCalendar
              events={calendarEvents}
              cabins={CALENDAR_CABINS}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          )}

          {/* Events Display */}
          {events && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Events Column */}
              <Card className="bg-white border-[var(--beige-arena)]">
                <CardHeader>
                  <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Eventos ({vevents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vevents.length === 0 ? (
                    <p className="text-[var(--slate-gray)]">No se encontraron eventos</p>
                  ) : (
                    <div className="space-y-4">
                      {vevents.map((event, index) => (
                        <div key={index} className="p-4 border border-[var(--beige-arena)] rounded-lg">
                          <h4 className="font-medium text-[var(--brown-earth)] mb-2">
                            {event.summary || 'Sin título'}
                          </h4>
                          
                          {event.start && (
                            <div className="flex items-center gap-2 text-sm text-[var(--slate-gray)] mb-1">
                              <Clock className="h-4 w-4" />
                              <span>Inicio: {formatDate(new Date(event.start))}</span>
                            </div>
                          )}
                          
                          {event.end && (
                            <div className="flex items-center gap-2 text-sm text-[var(--slate-gray)] mb-1">
                              <Clock className="h-4 w-4" />
                              <span>Fin: {formatDate(new Date(event.end))}</span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-[var(--slate-gray)] mb-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.status && (
                            <div className="inline-block px-2 py-1 bg-[var(--green-moss)]/10 text-[var(--green-moss)] text-xs rounded">
                              {event.status}
                            </div>
                          )}
                          
                          {event.description && (
                            <div className="mt-2 text-sm text-[var(--slate-gray)]">
                              <p className="line-clamp-3">{event.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raw Data Column */}
              <Card className="bg-white border-[var(--beige-arena)]">
                <CardHeader>
                  <CardTitle className="text-[var(--brown-earth)]">
                    Datos Raw ({Object.keys(events).length} elementos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(events, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 