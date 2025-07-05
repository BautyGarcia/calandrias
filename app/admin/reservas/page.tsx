'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    RefreshCw,
    Calendar,
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Home,
    Filter,
    Check,
    X
} from "lucide-react"
import { LocalReservation } from '@/types'
import { getCabinDisplayName } from '@/utils/cabins'

interface ConflictDetection {
    id: string
    type: 'overlap' | 'same_dates'
    reservations: LocalReservation[]
    message: string
}

export default function AdminReservas() {
    const [reservations, setReservations] = useState<LocalReservation[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')
    const [conflicts, setConflicts] = useState<ConflictDetection[]>([])
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const fetchReservations = useCallback(async () => {
        try {
            setLoading(true)
            let url = '/api/reservations'
            if (filter !== 'all') {
                url += `?status=${filter}`
            }

            const response = await fetch(url)
            const data = await response.json()

            if (response.ok) {
                setReservations(data.reservations)
                detectConflicts(data.reservations)
            } else {
                console.error('Error:', data.error)
            }
        } catch (error) {
            console.error('Error fetching reservations:', error)
        } finally {
            setLoading(false)
        }
    }, [filter])

    const detectConflicts = (reservationList: LocalReservation[]) => {
        const conflicts: ConflictDetection[] = []
        const activeReservations = reservationList.filter(r => r.status !== 'cancelled')

        for (let i = 0; i < activeReservations.length; i++) {
            for (let j = i + 1; j < activeReservations.length; j++) {
                const res1 = activeReservations[i]
                const res2 = activeReservations[j]

                // Solo verificar conflictos en la misma cabaña
                if (res1.cabinId !== res2.cabinId) continue

                const start1 = new Date(res1.checkIn)
                const end1 = new Date(res1.checkOut)
                const start2 = new Date(res2.checkIn)
                const end2 = new Date(res2.checkOut)

                // Verificar solapamiento
                const hasOverlap = start1 < end2 && start2 < end1

                if (hasOverlap) {
                    const conflictId = `${res1.id}-${res2.id}`
                    const existingConflict = conflicts.find(c => c.id === conflictId)

                    if (!existingConflict) {
                        conflicts.push({
                            id: conflictId,
                            type: (start1.getTime() === start2.getTime() && end1.getTime() === end2.getTime()) ? 'same_dates' : 'overlap',
                            reservations: [res1, res2],
                            message: `Conflicto entre ${res1.source} y ${res2.source} en ${res1.cabinId}`
                        })
                    }
                }
            }
        }

        setConflicts(conflicts)
    }

    useEffect(() => {
        fetchReservations()
    }, [fetchReservations])

    const syncAirbnb = async () => {
        try {
            setSyncing(true)
            const response = await fetch('/api/cron/sync-airbnb', {
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                await fetchReservations()
            } else {
                alert(`Error en sincronización: ${data.error}`)
            }
        } catch (error) {
            console.error('Error syncing:', error)
            alert('Error de conexión en la sincronización')
        } finally {
            setSyncing(false)
        }
    }

    const handleConfirmReservation = async (reservationId: string) => {
        setActionLoading(reservationId)
        try {
            // Find the reservation to get its documentId
            const reservation = reservations.find(r => r.id === reservationId)
            if (!reservation) {
                throw new Error('Reserva no encontrada')
            }

            const response = await fetch('/api/reservations/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    documentId: reservation.documentId
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al confirmar la reserva')
            }

            // Refrescar datos
            await fetchReservations()
        } catch (error) {
            console.error('Error confirming reservation:', error)
            alert(`Error al confirmar la reserva: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setActionLoading(null)
        }
    }

    const handleCancelReservation = async (reservationId: string) => {
        setActionLoading(reservationId)
        try {
            // Find the reservation to get its documentId
            const reservation = reservations.find(r => r.id === reservationId)
            if (!reservation) {
                throw new Error('Reserva no encontrada')
            }

            const response = await fetch('/api/reservations/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    documentId: reservation.documentId
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al cancelar la reserva')
            }

            // Refrescar datos
            await fetchReservations()
        } catch (error) {
            console.error('Error cancelling reservation:', error)
            alert(`Error al cancelar la reserva: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setActionLoading(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-[var(--green-moss)] text-white">Confirmada</Badge>
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pendiente</Badge>
            case 'cancelled':
                return <Badge className="bg-[var(--slate-gray)] text-white">Cancelada</Badge>
            default:
                return <Badge className="bg-[var(--light-sand)] text-[var(--brown-earth)]">Bloqueada</Badge>
        }
    }

    const getSourceBadge = (source: string) => {
        switch (source) {
            case 'airbnb':
                return <Badge className="bg-pink-100 text-pink-800 border-pink-200">Airbnb</Badge>
            case 'direct':
                return <Badge className="bg-[var(--soft-cream)] text-[var(--brown-earth)] border-[var(--beige-arena)]">Directa</Badge>
            case 'manual':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Manual</Badge>
            default:
                return <Badge className="bg-[var(--light-sand)] text-[var(--slate-gray)]">Otro</Badge>
        }
    }

    const canModifyReservation = (reservation: LocalReservation) => {
        // Solo permitir modificar reservas directas o manuales, no de Airbnb
        return reservation.source !== 'airbnb' && reservation.status !== 'cancelled'
    }

    const getActionButtons = (reservation: LocalReservation) => {
        if (!canModifyReservation(reservation)) {
            return (
                <div className="flex items-center justify-center">
                    <span className="text-xs text-[var(--slate-gray)]">No editable</span>
                </div>
            )
        }

        const isLoading = actionLoading === reservation.id

        return (
            <div className="flex items-center gap-1">
                {reservation.status === 'pending' && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirmReservation(reservation.id)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Confirmar reserva"
                    >
                        <Check className="h-3 w-3" />
                    </Button>
                )}
                
                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelReservation(reservation.id)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cancelar reserva"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--soft-cream)] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-[var(--brown-earth)] mx-auto mb-4" />
                    <p className="text-[var(--brown-earth)] text-lg">Cargando panel de administración...</p>
                </div>
            </div>
        )
    }

    const filteredReservations = reservations.filter(reservation => {
        if (filter === 'all') return true
        return reservation.status === filter
    })

    const stats = {
        total: reservations.length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        pending: reservations.filter(r => r.status === 'pending').length,
        airbnb: reservations.filter(r => r.source === 'airbnb').length,
        direct: reservations.filter(r => r.source === 'direct').length
    }

    return (
        <div className="min-h-screen bg-[var(--soft-cream)] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <Card className="border-[var(--beige-arena)] mb-6">
                    <CardHeader className="border-b border-[var(--beige-arena)]">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl text-[var(--brown-earth)] font-serif">
                                    Panel de Administración
                                </CardTitle>
                                <p className="text-[var(--slate-gray)] mt-2">
                                    Gestión centralizada de reservas de Calandrias
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={syncAirbnb}
                                    disabled={syncing}
                                    variant="outline"
                                    className="border-[var(--brown-earth)] text-[var(--brown-earth)] hover:bg-[var(--light-sand)]"
                                >
                                    {syncing ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Sincronizar Airbnb
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Conflictos Alert */}
                {conflicts.length > 0 && (
                    <Alert className="border-red-200 bg-red-50 mb-6">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">
                            Conflictos Detectados ({conflicts.length})
                        </AlertTitle>
                        <AlertDescription className="text-red-700">
                            <div className="mt-2 space-y-1">
                                {conflicts.map((conflict) => (
                                    <div key={conflict.id} className="text-sm">
                                        • {conflict.message}
                                    </div>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <Card className="border-[var(--beige-arena)]">
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-[var(--brown-earth)]" />
                                <div>
                                    <div className="text-2xl font-bold text-[var(--brown-earth)]">
                                        {stats.total}
                                    </div>
                                    <div className="text-sm text-[var(--slate-gray)]">Total</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[var(--beige-arena)]">
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-[var(--green-moss)]" />
                                <div>
                                    <div className="text-2xl font-bold text-[var(--green-moss)]">
                                        {stats.confirmed}
                                    </div>
                                    <div className="text-sm text-[var(--slate-gray)]">Confirmadas</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[var(--beige-arena)]">
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-amber-600" />
                                <div>
                                    <div className="text-2xl font-bold text-amber-600">
                                        {stats.pending}
                                    </div>
                                    <div className="text-sm text-[var(--slate-gray)]">Pendientes</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[var(--beige-arena)]">
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Home className="h-5 w-5 text-pink-600" />
                                <div>
                                    <div className="text-2xl font-bold text-pink-600">
                                        {stats.airbnb}
                                    </div>
                                    <div className="text-sm text-[var(--slate-gray)]">Airbnb</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[var(--beige-arena)]">
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-[var(--green-moss)]" />
                                <div>
                                    <div className="text-2xl font-bold text-[var(--green-moss)]">
                                        {stats.direct}
                                    </div>
                                    <div className="text-sm text-[var(--slate-gray)]">Directas</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card className="border-[var(--beige-arena)] mb-6">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Filter className="h-4 w-4 text-[var(--brown-earth)]" />
                            <span className="text-[var(--brown-earth)] font-medium">Filtrar por estado:</span>
                            <div className="flex gap-2">
                                {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((status) => (
                                    <Button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        variant={filter === status ? "default" : "outline"}
                                        size="sm"
                                        className={filter === status
                                            ? "bg-[var(--brown-earth)] text-white"
                                            : "border-[var(--beige-arena)] text-[var(--brown-earth)] hover:bg-[var(--light-sand)]"
                                        }
                                    >
                                        {status === 'all' ? 'Todas' :
                                            status === 'confirmed' ? 'Confirmadas' :
                                                status === 'pending' ? 'Pendientes' :
                                                    'Canceladas'}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de reservas */}
                <Card className="border-[var(--beige-arena)]">
                    <CardHeader className="border-b border-[var(--beige-arena)]">
                        <CardTitle className="text-[var(--brown-earth)]">
                            Reservas ({filteredReservations.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--beige-arena)]">
                                <thead className="bg-[var(--light-sand)]">
                                    <tr>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Huésped
                                        </th>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Fechas
                                        </th>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Cabaña
                                        </th>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Fuente
                                        </th>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Código
                                        </th>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 pb-3 text-left text-xs font-medium text-[var(--brown-earth)] uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[var(--beige-arena)]">
                                    {filteredReservations.map((reservation) => {
                                        const hasConflict = conflicts.some(c =>
                                            c.reservations.some(r => r.id === reservation.id)
                                        )

                                        return (
                                            <tr
                                                key={reservation.id}
                                                className={hasConflict ? 'bg-red-50' : ''}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {hasConflict && (
                                                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-medium text-[var(--brown-earth)]">
                                                                {reservation.guestName}
                                                            </div>
                                                            <div className="text-sm text-[var(--slate-gray)]">
                                                                {reservation.adults} adultos
                                                                {reservation.children > 0 && `, ${reservation.children} niños`}
                                                                {reservation.pets > 0 && `, ${reservation.pets} mascotas`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-[var(--brown-earth)]">
                                                        {format(reservation.checkIn, 'dd/MM/yyyy', { locale: es })}
                                                    </div>
                                                    <div className="text-sm text-[var(--slate-gray)]">
                                                        hasta {format(reservation.checkOut, 'dd/MM/yyyy', { locale: es })}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--brown-earth)]">
                                                    {getCabinDisplayName(reservation.cabinId)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getSourceBadge(reservation.source)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(reservation.status)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--brown-earth)]">
                                                    {reservation.reservationCode}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--brown-earth)]">
                                                    {reservation.totalPrice ? `$${reservation.totalPrice.toLocaleString('es-AR')}` : '-'}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {getActionButtons(reservation)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {filteredReservations.length === 0 && (
                            <div className="text-center py-12">
                                <XCircle className="h-12 w-12 text-[var(--slate-gray)] mx-auto mb-4" />
                                <div className="text-[var(--slate-gray)]">No se encontraron reservas</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 