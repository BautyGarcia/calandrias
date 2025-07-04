'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { LocalReservation } from '@/types'

export default function AdminReservas() {
    const [reservations, setReservations] = useState<LocalReservation[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')

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
            } else {
                console.error('Error:', data.error)
            }
        } catch (error) {
            console.error('Error fetching reservations:', error)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        fetchReservations()
    }, [fetchReservations])

    const syncAirbnb = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/cron/sync-airbnb', {
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`
                }
            })
            
            const data = await response.json()
            
            if (response.ok) {
                fetchReservations();
            } else {
                alert(`Error en sincronización: ${data.error}`)
            }
        } catch (error) {
            console.error('Error syncing:', error)
            alert('Error de conexión en la sincronización')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800'
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            case 'blocked': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'airbnb': return 'bg-pink-100 text-pink-800'
            case 'direct': return 'bg-blue-100 text-blue-800'
            case 'manual': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Cargando reservas...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Panel de Reservas</h1>
                            <p className="text-gray-600">Gestión de reservas de todas las fuentes</p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={syncAirbnb}
                                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                            >
                                🔄 Sincronizar Airbnb
                            </button>

                            <a
                                href="/api/cabins/refugio-intimo/ical"
                                target="_blank"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                📅 Descargar iCal
                            </a>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex gap-2">
                        <span className="text-gray-700 font-medium mr-4">Filtrar por estado:</span>
                        {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {status === 'all' ? 'Todas' :
                                    status === 'confirmed' ? 'Confirmadas' :
                                        status === 'pending' ? 'Pendientes' :
                                            'Canceladas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {reservations.filter(r => r.status === 'confirmed').length}
                        </div>
                        <div className="text-gray-600">Confirmadas</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-pink-600">
                            {reservations.filter(r => r.source === 'airbnb').length}
                        </div>
                        <div className="text-gray-600">Desde Airbnb</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {reservations.filter(r => r.source === 'direct').length}
                        </div>
                        <div className="text-gray-600">Directas</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-2xl font-bold text-gray-600">
                            {reservations.length}
                        </div>
                        <div className="text-gray-600">Total</div>
                    </div>
                </div>

                {/* Tabla de reservas */}
                <div className="bg-white rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Huésped
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fechas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cabaña
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fuente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Código
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reservations.map((reservation) => (
                                    <tr key={reservation.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {reservation.guestName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {reservation.adults} adultos
                                                {reservation.children > 0 && `, ${reservation.children} niños`}
                                                {reservation.pets > 0 && `, ${reservation.pets} mascotas`}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {format(reservation.checkIn, 'dd/MM/yyyy', { locale: es })}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                hasta {format(reservation.checkOut, 'dd/MM/yyyy', { locale: es })}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {reservation.cabinId === 'refugio-intimo' ? 'Refugio Íntimo' : reservation.cabinId}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(reservation.source)}`}>
                                                {reservation.source === 'airbnb' ? 'Airbnb' :
                                                    reservation.source === 'direct' ? 'Directa' :
                                                        'Manual'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                                                {reservation.status === 'confirmed' ? 'Confirmada' :
                                                    reservation.status === 'pending' ? 'Pendiente' :
                                                        reservation.status === 'cancelled' ? 'Cancelada' :
                                                            'Bloqueada'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {reservation.reservationCode}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {reservations.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-500">No se encontraron reservas</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 