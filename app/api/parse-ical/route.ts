import { NextRequest, NextResponse } from 'next/server'
import { ParseICalRequest, ICalRawEvent, ProcessedEvent } from '@/types'
import * as ical from 'node-ical'

export async function POST(request: NextRequest) {
    try {
        const body: ParseICalRequest = await request.json()
        const { type, data } = body

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos (type, data)' },
                { status: 400 }
            )
        }

        let events: Record<string, ICalRawEvent>

        if (type === 'url') {
            // Parsear desde URL
            try {
                events = await ical.async.fromURL(data, {
                    headers: {
                        'User-Agent': 'Calandrias-iCal-Parser/1.0',
                    },
                    timeout: 10000, // 10 segundos de timeout
                }) as unknown as Record<string, ICalRawEvent>
            } catch (error) {
                console.error('Error parsing from URL:', error)
                return NextResponse.json(
                    { error: `Error al obtener o parsear la URL: ${error instanceof Error ? error.message : 'Error desconocido'}` },
                    { status: 400 }
                )
            }
        } else if (type === 'content') {
            // Parsear desde contenido directo
            try {
                events = await ical.async.parseICS(data) as unknown as Record<string, ICalRawEvent>
            } catch (error) {
                console.error('Error parsing content:', error)
                return NextResponse.json(
                    { error: `Error al parsear el contenido iCal: ${error instanceof Error ? error.message : 'Error desconocido'}` },
                    { status: 400 }
                )
            }
        } else {
            return NextResponse.json(
                { error: 'Tipo no válido. Debe ser "url" o "content"' },
                { status: 400 }
            )
        }

        // Procesar y limpiar los eventos
        const processedEvents: Record<string, ProcessedEvent> = {}

        for (const [key, event] of Object.entries(events)) {
            // Convertir fechas a strings para serialización JSON
            const processedEvent: ProcessedEvent = {
                ...event,
                start: event.start ? event.start.toISOString() : null,
                end: event.end ? event.end.toISOString() : null,
                // Preservar otros campos importantes
                type: event.type,
                summary: event.summary,
                description: event.description,
                location: event.location,
                organizer: event.organizer,
                uid: event.uid,
                state: event.state,
                // Incluir información de recurrencia si existe
                rrule: event.rrule ? {
                    ...event.rrule,
                    origOptions: event.rrule.origOptions,
                } : null,
                // Incluir fechas de excepción
                exdate: event.exdate,
                // Incluir recurrencias específicas
                recurrences: event.recurrences,
            }

            processedEvents[key] = processedEvent
        }

        // Estadísticas básicas
        const stats = {
            total: Object.keys(processedEvents).length,
            vevents: Object.values(processedEvents).filter((e: ProcessedEvent) => e.type === 'VEVENT').length,
            vtimezones: Object.values(processedEvents).filter((e: ProcessedEvent) => e.type === 'VTIMEZONE').length,
            vcalendars: Object.values(processedEvents).filter((e: ProcessedEvent) => e.type === 'VCALENDAR').length,
        }

        return NextResponse.json({
            success: true,
            events: processedEvents,
            stats,
            message: `Calendario parseado exitosamente. ${stats.vevents} eventos encontrados.`
        })

    } catch (error) {
        console.error('Error in parse-ical API:', error)
        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        )
    }
} 