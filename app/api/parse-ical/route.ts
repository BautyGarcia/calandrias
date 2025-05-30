import { NextRequest, NextResponse } from 'next/server'
const ical = require('node-ical')

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, data } = body

        if (!type || !data) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos (type, data)' },
                { status: 400 }
            )
        }

        let events

        if (type === 'url') {
            // Parsear desde URL
            try {
                events = await ical.async.fromURL(data, {
                    headers: {
                        'User-Agent': 'Calandrias-iCal-Parser/1.0',
                    },
                    timeout: 10000, // 10 segundos de timeout
                })
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
                events = await ical.async.parseICS(data)
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
        const processedEvents: { [key: string]: any } = {}

        for (const [key, event] of Object.entries(events)) {
            const typedEvent = event as any

            // Convertir fechas a strings para serialización JSON
            const processedEvent = {
                ...typedEvent,
                start: typedEvent.start ? typedEvent.start.toISOString() : null,
                end: typedEvent.end ? typedEvent.end.toISOString() : null,
                // Preservar otros campos importantes
                type: typedEvent.type,
                summary: typedEvent.summary,
                description: typedEvent.description,
                location: typedEvent.location,
                organizer: typedEvent.organizer,
                uid: typedEvent.uid,
                status: typedEvent.status,
                // Incluir información de recurrencia si existe
                rrule: typedEvent.rrule ? {
                    ...typedEvent.rrule,
                    origOptions: typedEvent.rrule.origOptions,
                } : null,
                // Incluir fechas de excepción
                exdate: typedEvent.exdate,
                // Incluir recurrencias específicas
                recurrences: typedEvent.recurrences,
            }

            processedEvents[key] = processedEvent
        }

        // Estadísticas básicas
        const stats = {
            total: Object.keys(processedEvents).length,
            vevents: Object.values(processedEvents).filter((e: any) => e.type === 'VEVENT').length,
            vtimezones: Object.values(processedEvents).filter((e: any) => e.type === 'VTIMEZONE').length,
            vcalendars: Object.values(processedEvents).filter((e: any) => e.type === 'VCALENDAR').length,
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