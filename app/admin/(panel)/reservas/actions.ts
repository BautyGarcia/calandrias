'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import {
    confirmReservation,
    cancelReservation,
    createReservation,
    generateReservationCode,
} from '@/lib/db/reservations'
import { runAirbnbSync } from '@/lib/airbnb-sync'
import { summarizeSync } from '@/lib/reservations-view'
import type { ReservationInput } from '@/types/db'

// Resultado tipado que la UI puede renderizar sin recibir un throw sin capturar.
export type ActionResult = { ok: true } | { ok: false; error: string }

const CONFLICT_MESSAGE = 'Esas fechas se superponen con otra reserva'
const GENERIC_ERROR = 'No se pudo completar la operación. Intentá nuevamente.'

const idSchema = z.string().uuid()
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')

// Esquema base del formulario de "Nueva reserva / Bloquear fechas". Los campos de
// huésped son opcionales a nivel base y se exigen sólo en modo 'manual' vía refine.
const formSchema = z
    .object({
        mode: z.enum(['manual', 'blocked']),
        cabinId: z.string().min(1, 'Elegí una cabaña'),
        checkIn: dateSchema,
        checkOut: dateSchema,
        guestName: z.string().trim().optional().default(''),
        guestEmail: z.string().trim().optional().default(''),
        guestPhone: z.string().trim().optional().default(''),
        guests: z.coerce.number().int().min(1).optional().default(1),
        pets: z.coerce.number().int().min(0).optional().default(0),
        totalPrice: z.coerce.number().min(0).optional(),
        specialRequests: z.string().trim().optional().default(''),
    })
    .refine((v) => v.checkOut > v.checkIn, {
        message: 'La fecha de salida debe ser posterior a la de entrada',
        path: ['checkOut'],
    })
    .refine((v) => v.mode !== 'manual' || v.guestName.length > 0, {
        message: 'Ingresá el nombre del huésped',
        path: ['guestName'],
    })

export async function confirmReservationAction(id: string): Promise<ActionResult> {
    await requireAdmin()

    const parsed = idSchema.safeParse(id)
    if (!parsed.success) return { ok: false, error: 'Reserva inválida' }

    try {
        await confirmReservation(parsed.data)
    } catch (err) {
        if (err instanceof Error && err.message === 'DATE_CONFLICT') {
            return { ok: false, error: CONFLICT_MESSAGE }
        }
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidatePath('/admin/reservas')
    return { ok: true }
}

export async function cancelReservationAction(id: string): Promise<ActionResult> {
    await requireAdmin()

    const parsed = idSchema.safeParse(id)
    if (!parsed.success) return { ok: false, error: 'Reserva inválida' }

    try {
        await cancelReservation(parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidatePath('/admin/reservas')
    return { ok: true }
}

export async function createManualReservationAction(input: FormData): Promise<ActionResult> {
    await requireAdmin()

    const parsed = formSchema.safeParse({
        mode: input.get('mode'),
        cabinId: input.get('cabinId'),
        checkIn: input.get('checkIn'),
        checkOut: input.get('checkOut'),
        guestName: input.get('guestName') ?? undefined,
        guestEmail: input.get('guestEmail') ?? undefined,
        guestPhone: input.get('guestPhone') ?? undefined,
        guests: input.get('guests') ?? undefined,
        pets: input.get('pets') ?? undefined,
        totalPrice: input.get('totalPrice') || undefined,
        specialRequests: input.get('specialRequests') ?? undefined,
    })

    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    const v = parsed.data
    const isBlock = v.mode === 'blocked'

    const reservation: ReservationInput = {
        cabinId: v.cabinId,
        checkIn: v.checkIn,
        checkOut: v.checkOut,
        guestName: isBlock ? v.guestName || 'Fechas bloqueadas' : v.guestName,
        guestEmail: v.guestEmail,
        guestPhone: v.guestPhone || undefined,
        guests: isBlock ? 0 : v.guests,
        pets: isBlock ? 0 : v.pets,
        state: isBlock ? 'blocked' : 'confirmed',
        source: 'manual',
        reservationCode: generateReservationCode(),
        totalPrice: isBlock ? undefined : v.totalPrice,
        specialRequests: v.specialRequests || undefined,
    }

    try {
        await createReservation(reservation)
    } catch (err) {
        if (err instanceof Error && err.message === 'DATE_CONFLICT') {
            return { ok: false, error: CONFLICT_MESSAGE }
        }
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidatePath('/admin/reservas')
    return { ok: true }
}

export async function syncAirbnbNowAction(): Promise<{ ok: boolean; summary: string }> {
    await requireAdmin()

    try {
        const results = await runAirbnbSync()
        revalidatePath('/admin/reservas')
        return { ok: true, summary: summarizeSync(results) }
    } catch {
        return { ok: false, summary: 'No se pudo sincronizar con Airbnb. Intentá nuevamente.' }
    }
}
