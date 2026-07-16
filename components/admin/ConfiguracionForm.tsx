'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, Loader2, MessageCircle, AlertTriangle } from 'lucide-react'
import { updateSiteSettingsAction } from '@/app/admin/(panel)/configuracion/actions'
import type { SiteSettings } from '@/types/db'

interface ConfiguracionFormProps {
    settings: SiteSettings
}

type Status = { type: 'ok' | 'error'; msg: string } | null

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean
    onChange: (value: boolean) => void
    label: string
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-moss)] focus-visible:ring-offset-2',
                checked ? 'bg-[var(--green-moss)]' : 'bg-[var(--slate-gray)]/40'
            )}
        >
            <span
                className={cn(
                    'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform',
                    checked ? 'translate-x-7' : 'translate-x-1'
                )}
            />
        </button>
    )
}

function Field({
    label,
    help,
    children,
}: {
    label: string
    help?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {help && <p className="text-xs text-[var(--slate-gray)]">{help}</p>}
        </div>
    )
}

export function ConfiguracionForm({ settings }: ConfiguracionFormProps) {
    const [state, setState] = useState<SiteSettings>(settings)
    const [status, setStatus] = useState<Status>(null)
    const [isPending, startTransition] = useTransition()

    function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
        setState((prev) => ({ ...prev, [key]: value }))
        setStatus(null)
    }

    function handleSave() {
        setStatus(null)
        startTransition(async () => {
            const result = await updateSiteSettingsAction(state)
            if (result.ok) setStatus({ type: 'ok', msg: 'Configuración guardada correctamente.' })
            else setStatus({ type: 'error', msg: result.error })
        })
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Interruptor maestro de reservas */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-[var(--green-moss)]" />
                        Reservas online
                    </CardTitle>
                    <CardDescription>
                        Controlá si los visitantes pueden reservar y pagar directamente desde la web.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-4 rounded-lg border border-[var(--beige-arena)] bg-[var(--light-sand)]/50 p-4">
                        <div className="space-y-1">
                            <p className="font-medium text-[var(--brown-earth)]">Aceptar reservas online</p>
                            <p className="text-sm text-[var(--slate-gray)]">
                                {state.bookingsEnabled
                                    ? 'Activado: los huéspedes ven el calendario, el estimado de precios y el botón para reservar y pagar.'
                                    : 'Desactivado: la web muestra el botón “Contactar por WhatsApp para reservar” en lugar del flujo de reserva.'}
                            </p>
                        </div>
                        <Toggle
                            checked={state.bookingsEnabled}
                            onChange={(v) => set('bookingsEnabled', v)}
                            label="Aceptar reservas online"
                        />
                    </div>
                    {!state.bookingsEnabled && (
                        <div className="flex items-start gap-2 text-sm text-[var(--slate-gray)]">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--terracotta)]" />
                            <span>
                                Mientras esté desactivado, ninguna reserva podrá completarse online (ni desde la
                                interfaz ni desde el servidor). Activalo cuando estés listo para recibir pagos.
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Datos de contacto */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Datos de contacto</CardTitle>
                    <CardDescription>
                        El número de WhatsApp se usa en toda la web (mapa, cabañas, emails de confirmación).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Field
                        label="WhatsApp"
                        help="Sólo números, con código de país y sin el signo +. Ej: 5492494027920."
                    >
                        <Input
                            type="tel"
                            inputMode="numeric"
                            value={state.whatsapp}
                            onChange={(e) => set('whatsapp', e.target.value)}
                        />
                    </Field>
                    <Field label="Teléfono" help="Número visible para llamadas. Ej: +54 9 2494 02-7920.">
                        <Input
                            type="tel"
                            value={state.phone}
                            onChange={(e) => set('phone', e.target.value)}
                        />
                    </Field>
                    <Field label="Email" help="Email de contacto que ven los huéspedes.">
                        <Input
                            type="email"
                            inputMode="email"
                            value={state.email}
                            onChange={(e) => set('email', e.target.value)}
                        />
                    </Field>
                    <Field label="Dirección" help="Dirección completa (aparece en emails y datos de la web).">
                        <Input value={state.address} onChange={(e) => set('address', e.target.value)} />
                    </Field>
                </CardContent>
            </Card>

            {/* Horarios */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Horarios</CardTitle>
                    <CardDescription>Horarios de check-in y check-out que se informan al huésped.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Check-in" help="Hora de ingreso (HH:MM).">
                        <Input
                            type="time"
                            value={state.checkinTime}
                            onChange={(e) => set('checkinTime', e.target.value)}
                        />
                    </Field>
                    <Field label="Check-out" help="Hora de salida (HH:MM).">
                        <Input
                            type="time"
                            value={state.checkoutTime}
                            onChange={(e) => set('checkoutTime', e.target.value)}
                        />
                    </Field>
                </CardContent>
            </Card>

            {/* Barra sticky de guardado */}
            <div className="sticky bottom-0 -mx-4 border-t border-[var(--beige-arena)] bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-h-[1.25rem] text-sm">
                        {status && (
                            <span
                                className={cn(
                                    'flex items-center gap-1.5',
                                    status.type === 'ok'
                                        ? 'text-[var(--green-moss)]'
                                        : 'text-[var(--terracotta)]'
                                )}
                            >
                                {status.type === 'ok' && <Check className="h-4 w-4" />}
                                {status.msg}
                            </span>
                        )}
                    </div>
                    <Button type="button" onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar cambios
                    </Button>
                </div>
            </div>
        </div>
    )
}
