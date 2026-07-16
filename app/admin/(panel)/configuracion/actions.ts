'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { siteSettingsSchema } from '@/lib/settings-schema'
import { updateSiteSettings } from '@/lib/db/content'

export type ActionResult = { ok: true } | { ok: false; error: string }

const GENERIC_ERROR = 'No se pudo guardar la configuración. Intentá nuevamente.'

export async function updateSiteSettingsAction(input: unknown): Promise<ActionResult> {
    await requireAdmin()

    const parsed = siteSettingsSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    try {
        await updateSiteSettings(parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    // Revalida todo el sitio público (contacto/horarios/estado de reservas se
    // usan en el layout y en cada página) y la propia pantalla de configuración.
    revalidatePath('/', 'layout')
    revalidatePath('/admin/configuracion')
    return { ok: true }
}
