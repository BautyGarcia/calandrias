'use client'

import { useMemo, useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
    CheckCircle,
    Clock,
    CalendarDays,
    RefreshCw,
    Check,
    X,
    Loader2,
} from 'lucide-react'
import {
    formatDateRange,
    type ReservationView,
    type ReservationStats,
} from '@/lib/reservations-view'
import type { ReservationState } from '@/types/db'
import { ReservationFormDialog } from '@/components/admin/ReservationFormDialog'
import {
    confirmReservationAction,
    cancelReservationAction,
    syncAirbnbNowAction,
} from '@/app/admin/(panel)/reservas/actions'

interface CabinOption {
    slug: string
    name: string
}

type StateFilter = 'all' | ReservationState

const STATE_FILTERS: { value: StateFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'blocked', label: 'Bloqueadas' },
    { value: 'cancelled', label: 'Canceladas' },
]

function stateBadge(state: ReservationState) {
    switch (state) {
        case 'confirmed':
            return <Badge className="bg-[var(--green-moss)] text-white">Confirmada</Badge>
        case 'pending':
            return <Badge className="border-amber-300 bg-amber-100 text-amber-800">Pendiente</Badge>
        case 'cancelled':
            return <Badge className="bg-[var(--slate-gray)] text-white">Cancelada</Badge>
        case 'blocked':
            return <Badge className="border-sky-200 bg-sky-100 text-sky-800">Bloqueada</Badge>
    }
}

function sourceBadge(source: ReservationView['source']) {
    switch (source) {
        case 'airbnb':
            return <Badge className="border-gray-300 bg-gray-100 text-gray-700">Airbnb</Badge>
        case 'direct':
            return <Badge className="border-green-200 bg-green-100 text-green-800">Web</Badge>
        case 'manual':
            return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Manual</Badge>
    }
}

function StatCard({
    icon: Icon,
    value,
    label,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    value: number
    label: string
    tone: string
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3">
                <Icon className={cn('h-6 w-6', tone)} />
                <div>
                    <div className={cn('text-2xl font-bold', tone)}>{value}</div>
                    <div className="text-sm text-[var(--slate-gray)]">{label}</div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ReservationsTable({
    reservations,
    cabins,
    stats,
}: {
    reservations: ReservationView[]
    cabins: CabinOption[]
    stats: ReservationStats
}) {
    const [cabinFilter, setCabinFilter] = useState<string>('all')
    const [stateFilter, setStateFilter] = useState<StateFilter>('all')
    const [actionId, setActionId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [syncMessage, setSyncMessage] = useState('')
    const [cancelTarget, setCancelTarget] = useState<ReservationView | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isSyncing, startSync] = useTransition()

    const cabinName = useMemo(() => {
        const map = new Map(cabins.map((c) => [c.slug, c.name]))
        return (slug: string) => map.get(slug) ?? slug
    }, [cabins])

    const filtered = useMemo(() => {
        return reservations.filter((r) => {
            if (cabinFilter !== 'all' && r.cabinId !== cabinFilter) return false
            if (stateFilter !== 'all' && r.state !== stateFilter) return false
            return true
        })
    }, [reservations, cabinFilter, stateFilter])

    function handleConfirm(r: ReservationView) {
        setError('')
        setActionId(r.id)
        startTransition(async () => {
            const result = await confirmReservationAction(r.id)
            if (!result.ok) setError(result.error)
            setActionId(null)
        })
    }

    function handleCancelConfirmed() {
        const r = cancelTarget
        if (!r) return
        setError('')
        setActionId(r.id)
        setCancelTarget(null)
        startTransition(async () => {
            const result = await cancelReservationAction(r.id)
            if (!result.ok) setError(result.error)
            setActionId(null)
        })
    }

    function handleSync() {
        setSyncMessage('')
        startSync(async () => {
            const result = await syncAirbnbNowAction()
            setSyncMessage(result.summary)
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-serif text-2xl font-bold text-[var(--brown-earth)]">Reservas</h1>
                <div className="flex flex-wrap gap-2">
                    <ReservationFormDialog cabins={cabins} />
                    <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
                        <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                        Sincronizar Airbnb
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard icon={CheckCircle} value={stats.confirmed} label="Confirmadas" tone="text-[var(--green-moss)]" />
                <StatCard icon={Clock} value={stats.pending} label="Pendientes" tone="text-amber-600" />
                <StatCard icon={CalendarDays} value={stats.thisMonth} label="Este mes" tone="text-[var(--brown-earth)]" />
            </div>

            {syncMessage && (
                <Alert className="border-[var(--beige-arena)] bg-[var(--light-sand)]">
                    <AlertDescription className="text-[var(--brown-earth)]">{syncMessage}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
            )}

            {/* Filtros */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={cabinFilter} onValueChange={setCabinFilter}>
                    <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder="Todas las cabañas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las cabañas</SelectItem>
                        {cabins.map((c) => (
                            <SelectItem key={c.slug} value={c.slug}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2">
                    {STATE_FILTERS.map((f) => (
                        <Button
                            key={f.value}
                            size="sm"
                            variant={stateFilter === f.value ? 'default' : 'outline'}
                            onClick={() => setStateFilter(f.value)}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tabla */}
            <Card className="p-0">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--beige-arena)]">
                            <thead className="bg-[var(--soft-cream)]">
                                <tr>
                                    {['Fechas', 'Cabaña', 'Huésped', 'Origen', 'Estado', 'Total', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--brown-earth)] whitespace-nowrap"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--beige-arena)] bg-white">
                                {filtered.map((r) => {
                                    const busy = isPending && actionId === r.id
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-[var(--brown-earth)] whitespace-nowrap">
                                                {formatDateRange(r.checkIn, r.checkOut)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[var(--brown-earth)] whitespace-nowrap">
                                                {cabinName(r.cabinId)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[var(--brown-earth)]">
                                                <div>{r.guestName}</div>
                                                {r.guests > 0 && (
                                                    <div className="text-xs text-[var(--slate-gray)]">
                                                        {r.guests} huésped{r.guests !== 1 ? 'es' : ''}
                                                        {r.pets > 0 && `, ${r.pets} mascota${r.pets !== 1 ? 's' : ''}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">{sourceBadge(r.source)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{stateBadge(r.state)}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-[var(--brown-earth)] whitespace-nowrap">
                                                {r.totalPrice ? `$${r.totalPrice.toLocaleString('es-AR')}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    {r.state === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-green-300 px-2 text-green-700 hover:bg-green-50"
                                                            disabled={busy}
                                                            onClick={() => handleConfirm(r)}
                                                            title="Confirmar"
                                                        >
                                                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                                            Confirmar
                                                        </Button>
                                                    )}
                                                    {r.state !== 'cancelled' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-red-300 px-2 text-red-700 hover:bg-red-50"
                                                            disabled={busy}
                                                            onClick={() => setCancelTarget(r)}
                                                            title="Cancelar"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                            Cancelar
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length === 0 && (
                        <div className="py-12 text-center text-[var(--slate-gray)]">No hay reservas para mostrar</div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmación de cancelación */}
            <Dialog open={cancelTarget !== null} onOpenChange={(o) => !o && setCancelTarget(null)}>
                <DialogContent showCloseButton={false} className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cancelar reserva</DialogTitle>
                        <DialogDescription>
                            ¿Cancelar la reserva de {cancelTarget?.guestName}? Esta acción libera las fechas.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelTarget(null)}>
                            Volver
                        </Button>
                        <Button variant="destructive" onClick={handleCancelConfirmed}>
                            Sí, cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
