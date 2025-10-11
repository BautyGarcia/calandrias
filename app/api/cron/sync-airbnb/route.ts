import { NextRequest, NextResponse } from 'next/server'
import { parseAirbnbICalEvents, airbnbEventToReservation } from '@/utils/ical-generator'
import { StrapiAPI, localToStrapiReservation } from '@/lib/strapi'

export async function GET(request: NextRequest) {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    const results = []
    const strapiAPI = new StrapiAPI()

    try {
        // Obtener configuraciones desde Strapi (no desde archivos hardcodeados)
        const configs = await strapiAPI.getAirbnbSyncConfigs()

        if (configs.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No hay cabañas configuradas para sincronización con Airbnb',
                timestamp: new Date().toISOString(),
                results: []
            })
        }

        // Procesar cada cabaña
        for (const config of configs) {
            try {
                const { cabinId, cabinSlug, cabinName, icalUrl } = config

                // Obtener iCal de Airbnb
                const response = await fetch(icalUrl, {
                    headers: {
                        'User-Agent': 'Calandrias-Sync/1.0'
                    },
                    // Timeout de 10 segundos para evitar bloqueos
                    signal: AbortSignal.timeout(10000)
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const icalContent = await response.text()

                // Parsear eventos del iCal
                const events = parseAirbnbICalEvents(icalContent)

                // Obtener reservas existentes de Airbnb en Strapi (usar slug)
                const existingReservations = await strapiAPI.getReservations(cabinSlug)

                const existingAirbnbReservations = existingReservations.filter(
                    r => r.source === 'airbnb'
                )

                let created = 0
                let updated = 0
                let errors = 0

                // Procesar cada evento de Airbnb
                for (const event of events) {
                    try {
                        const reservationData = airbnbEventToReservation(event, cabinSlug)

                        // Buscar si ya existe esta reserva
                        const existing = existingAirbnbReservations.find(
                            r => r.externalId === event.id
                        )

                        if (existing) {
                            // Actualizar reserva existente si cambió algo
                            const strapiData = localToStrapiReservation(reservationData)

                            // Comparar datos básicos para ver si necesita actualización
                            const needsUpdate =
                                existing.checkIn !== strapiData.checkIn ||
                                existing.checkOut !== strapiData.checkOut ||
                                existing.guestName !== strapiData.guestName

                            if (needsUpdate) {
                                await strapiAPI.updateReservation(existing.documentId, strapiData)
                                updated++
                            }
                        } else {
                            // Crear nueva reserva
                            const strapiData = localToStrapiReservation(reservationData)
                            await strapiAPI.createReservation(strapiData)
                            created++
                        }
                    } catch (error) {
                        console.error(`Error processing event ${event.id}:`, error)
                        errors++
                    }
                }

                // Marcar como canceladas las reservas que ya no están en Airbnb
                const eventIds = events.map(e => e.id)
                for (const existing of existingAirbnbReservations) {
                    if (!eventIds.includes(existing.externalId || '')) {
                        if (existing.state !== 'cancelled') {
                            await strapiAPI.updateReservation(existing.documentId, { state: 'cancelled' })
                        }
                    }
                }

                results.push({
                    cabinId,
                    cabinName,
                    success: true,
                    eventsFound: events.length,
                    created,
                    updated,
                    errors
                })
            } catch (error) {
                results.push({
                    cabinId: config.cabinId,
                    cabinName: config.cabinName,
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido'
                })
            }
        }

        const successCount = results.filter(r => r.success).length
        const totalCount = results.length
        const totalCreated = results.reduce((sum, r) => sum + (r.created || 0), 0)
        const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0)

        return NextResponse.json({
            success: true,
            message: `Sincronización completada: ${successCount}/${totalCount} cabañas procesadas`,
            summary: {
                totalCreated,
                totalUpdated,
                cabinsProcessed: successCount
            },
            timestamp: new Date().toISOString(),
            results
        })

    } catch (error) {
        console.error('Error general en sincronización:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
} 