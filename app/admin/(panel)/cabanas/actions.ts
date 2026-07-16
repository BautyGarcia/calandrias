'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { updateCabin, setAirbnbIcalUrl } from '@/lib/db/cabins'
import { parseCabinForm, airbnbUrlSchema } from '@/lib/cabin-form'
import { uploadImageToBucket, type UploadResult } from '@/lib/actions/upload'

export type ActionResult = { ok: true } | { ok: false; error: string }
export type { UploadResult }

const GENERIC_ERROR = 'No se pudo completar la operación. Intentá nuevamente.'

const idSchema = z.string().uuid()

// Revalida todas las superficies públicas que muestran datos de cabañas.
function revalidateCabinSurfaces() {
    revalidatePath('/cabanas')
    revalidatePath('/cabanas/[slug]', 'page')
    revalidatePath('/')
    revalidatePath('/admin/cabanas')
}

// Actualiza el contenido/precios de una cabaña. `id` = documentId (uuid).
export async function updateCabinAction(id: string, form: FormData): Promise<ActionResult> {
    await requireAdmin()

    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) return { ok: false, error: 'Cabaña inválida' }

    const raw: Record<string, unknown> = {}
    for (const [key, value] of form.entries()) {
        if (typeof value === 'string') raw[key] = value
    }

    const parsed = parseCabinForm(raw)
    if (!parsed.ok) return { ok: false, error: parsed.error }

    try {
        await updateCabin(parsedId.data, parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateCabinSurfaces()
    return { ok: true }
}

// Sube una imagen al bucket `images` bajo `cabins/{slug}/` y devuelve su URL pública.
export async function uploadImageAction(form: FormData): Promise<UploadResult> {
    await requireAdmin()

    const file = form.get('file')
    const slugRaw = form.get('slug')

    if (!(file instanceof File)) return { ok: false, error: 'No se recibió ningún archivo' }
    if (typeof slugRaw !== 'string' || slugRaw.trim() === '') {
        return { ok: false, error: 'Falta la cabaña' }
    }

    const slug = slugRaw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    return uploadImageToBucket(file, `cabins/${slug}`)
}

// Setea/limpia la URL iCal de Airbnb de una cabaña. `cabinId` = documentId (uuid).
export async function updateAirbnbUrlAction(cabinId: string, url: string): Promise<ActionResult> {
    await requireAdmin()

    const parsedId = idSchema.safeParse(cabinId)
    if (!parsedId.success) return { ok: false, error: 'Cabaña inválida' }

    const parsedUrl = airbnbUrlSchema.safeParse(url)
    if (!parsedUrl.success) {
        return { ok: false, error: parsedUrl.error.issues[0]?.message ?? 'URL inválida' }
    }

    try {
        await setAirbnbIcalUrl(parsedId.data, parsedUrl.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidatePath('/admin/cabanas')
    return { ok: true }
}
