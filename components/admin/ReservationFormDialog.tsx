'use client'

import { useState, useTransition } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { Plus, Loader2 } from 'lucide-react'
import { createManualReservationAction } from '@/app/admin/(panel)/reservas/actions'

interface CabinOption {
    slug: string
    name: string
}

type Mode = 'manual' | 'blocked'

export function ReservationFormDialog({ cabins }: { cabins: CabinOption[] }) {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<Mode>('manual')
    const [cabinSlug, setCabinSlug] = useState('')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    function reset() {
        setMode('manual')
        setCabinSlug('')
        setError('')
    }

    function handleOpenChange(next: boolean) {
        setOpen(next)
        if (!next) reset()
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')

        const form = e.currentTarget
        const data = new FormData(form)
        data.set('mode', mode)
        data.set('cabinId', cabinSlug)

        const checkIn = String(data.get('checkIn') ?? '')
        const checkOut = String(data.get('checkOut') ?? '')

        // Validaciones inmediatas (el server revalida con zod de todos modos).
        if (!cabinSlug) return setError('Elegí una cabaña')
        if (!checkIn || !checkOut) return setError('Completá las fechas')
        if (checkOut <= checkIn) return setError('La fecha de salida debe ser posterior a la de entrada')
        if (mode === 'manual' && !String(data.get('guestName') ?? '').trim()) {
            return setError('Ingresá el nombre del huésped')
        }

        startTransition(async () => {
            const result = await createManualReservationAction(data)
            if (result.ok) {
                handleOpenChange(false)
            } else {
                setError(result.error)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva reserva / Bloquear fechas
            </Button>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nueva reserva / Bloquear fechas</DialogTitle>
                    <DialogDescription>
                        Cargá una reserva manual o bloqueá fechas para que no puedan reservarse en la web.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1 rounded-md bg-[var(--light-sand)] p-1">
                    {(['manual', 'blocked'] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={cn(
                                'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                                mode === m
                                    ? 'bg-white text-[var(--brown-earth)] shadow-sm'
                                    : 'text-[var(--slate-gray)] hover:text-[var(--brown-earth)]'
                            )}
                        >
                            {m === 'manual' ? 'Reserva manual' : 'Bloquear fechas'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Cabaña</Label>
                        <Select value={cabinSlug} onValueChange={setCabinSlug}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Elegí una cabaña" />
                            </SelectTrigger>
                            <SelectContent>
                                {cabins.map((c) => (
                                    <SelectItem key={c.slug} value={c.slug}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="checkIn">Entrada</Label>
                            <Input id="checkIn" name="checkIn" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="checkOut">Salida</Label>
                            <Input id="checkOut" name="checkOut" type="date" required />
                        </div>
                    </div>

                    {mode === 'manual' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="guestName">Huésped</Label>
                                <Input id="guestName" name="guestName" placeholder="Nombre y apellido" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="guestEmail">Email</Label>
                                    <Input id="guestEmail" name="guestEmail" type="email" placeholder="opcional" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guestPhone">Teléfono</Label>
                                    <Input id="guestPhone" name="guestPhone" placeholder="opcional" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="guests">Huéspedes</Label>
                                    <Input id="guests" name="guests" type="number" min={1} defaultValue={2} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pets">Mascotas</Label>
                                    <Input id="pets" name="pets" type="number" min={0} defaultValue={0} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="totalPrice">Total ($)</Label>
                                    <Input id="totalPrice" name="totalPrice" type="number" min={0} placeholder="opcional" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="specialRequests">Notas</Label>
                                <Textarea id="specialRequests" name="specialRequests" placeholder="opcional" rows={2} />
                            </div>
                        </div>
                    )}

                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {mode === 'manual' ? 'Crear reserva' : 'Bloquear fechas'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
