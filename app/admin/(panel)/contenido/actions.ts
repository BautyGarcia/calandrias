'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { siteContentSchemaFor } from '@/lib/content-schemas'
import {
    setSiteContent,
    upsertFaq,
    deleteFaq,
    upsertReview,
    deleteReview,
    upsertGalleryItem,
    deleteGalleryItem,
    reorderContent,
    type ReorderableTable,
} from '@/lib/db/content'
import { uploadImageToBucket, type UploadResult } from '@/lib/actions/upload'
import type { FaqInput, ReviewInput, GalleryItemInput } from '@/types/db'

export type ActionResult = { ok: true } | { ok: false; error: string }

const GENERIC_ERROR = 'No se pudo completar la operación. Intentá nuevamente.'

const idSchema = z.string().uuid()

const reorderIdsSchema = z.array(idSchema).min(1).max(500)

async function reorderAction(table: ReorderableTable, ids: unknown): Promise<ActionResult> {
    await requireAdmin()

    const parsed = reorderIdsSchema.safeParse(ids)
    if (!parsed.success) return { ok: false, error: 'Orden inválido' }

    try {
        await reorderContent(table, parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

export async function reorderFaqsAction(ids: unknown): Promise<ActionResult> {
    return reorderAction('faqs', ids)
}

export async function reorderReviewsAction(ids: unknown): Promise<ActionResult> {
    return reorderAction('reviews', ids)
}

export async function reorderGalleryAction(ids: unknown): Promise<ActionResult> {
    return reorderAction('gallery_items', ids)
}

// Valores de `span` soportados por la grilla bento (Tailwind sólo compila las
// clases presentes en el código: ver safelist en components/BentoGridGallery.tsx).
// Limitamos el select a estos dos para no romper el layout público con clases inexistentes.
const GALLERY_SPANS = ['col-span-1 row-span-2', 'col-span-2 row-span-2'] as const

const faqInputSchema = z.object({
    id: idSchema.optional(),
    question: z.string().trim().min(1, 'Escribí la pregunta'),
    answer: z.string().trim().min(1, 'Escribí la respuesta'),
    sortOrder: z.coerce.number().int(),
    isPublished: z.boolean(),
})

const reviewInputSchema = z.object({
    id: idSchema.optional(),
    name: z.string().trim().min(1, 'Escribí el nombre'),
    location: z.string().trim().min(1, 'Escribí la ubicación'),
    text: z.string().trim().min(1, 'Escribí la reseña'),
    rating: z.coerce.number().int().min(1).max(5),
    sortOrder: z.coerce.number().int(),
    isPublished: z.boolean(),
})

const galleryInputSchema = z.object({
    id: idSchema.optional(),
    title: z.string().trim().min(1, 'Escribí el título'),
    description: z.string().trim().min(1, 'Escribí la descripción'),
    imageUrl: z.string().trim().min(1, 'Subí una imagen'),
    span: z.enum(GALLERY_SPANS),
    sortOrder: z.coerce.number().int(),
    isPublished: z.boolean(),
})

// Revalida la home (donde Task 11 renderiza este contenido) + la página del admin.
function revalidateContentSurfaces() {
    revalidatePath('/')
    revalidatePath('/admin/contenido')
}

// -------------------------------------------------------------------
// Bloques de texto (site_content)
// -------------------------------------------------------------------

export async function updateSiteContentAction(
    key: string,
    value: unknown
): Promise<ActionResult> {
    await requireAdmin()

    const schema = siteContentSchemaFor(key)
    if (!schema) return { ok: false, error: 'Sección de contenido inválida' }

    const parsed = schema.safeParse(value)
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    try {
        await setSiteContent(key, parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

// -------------------------------------------------------------------
// FAQs
// -------------------------------------------------------------------

export async function upsertFaqAction(input: unknown): Promise<ActionResult> {
    await requireAdmin()

    const parsed = faqInputSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    try {
        await upsertFaq(parsed.data as FaqInput)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

export async function deleteFaqAction(id: string): Promise<ActionResult> {
    await requireAdmin()

    const parsed = idSchema.safeParse(id)
    if (!parsed.success) return { ok: false, error: 'Elemento inválido' }

    try {
        await deleteFaq(parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

// -------------------------------------------------------------------
// Reseñas
// -------------------------------------------------------------------

export async function upsertReviewAction(input: unknown): Promise<ActionResult> {
    await requireAdmin()

    const parsed = reviewInputSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    try {
        await upsertReview(parsed.data as ReviewInput)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

export async function deleteReviewAction(id: string): Promise<ActionResult> {
    await requireAdmin()

    const parsed = idSchema.safeParse(id)
    if (!parsed.success) return { ok: false, error: 'Elemento inválido' }

    try {
        await deleteReview(parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

// -------------------------------------------------------------------
// Galería
// -------------------------------------------------------------------

export async function upsertGalleryItemAction(input: unknown): Promise<ActionResult> {
    await requireAdmin()

    const parsed = galleryInputSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    try {
        await upsertGalleryItem(parsed.data as GalleryItemInput)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

export async function deleteGalleryItemAction(id: string): Promise<ActionResult> {
    await requireAdmin()

    const parsed = idSchema.safeParse(id)
    if (!parsed.success) return { ok: false, error: 'Elemento inválido' }

    try {
        await deleteGalleryItem(parsed.data)
    } catch {
        return { ok: false, error: GENERIC_ERROR }
    }

    revalidateContentSurfaces()
    return { ok: true }
}

// Sube una imagen de galería al bucket `images` bajo `gallery/`.
export async function uploadGalleryImageAction(form: FormData): Promise<UploadResult> {
    await requireAdmin()

    const file = form.get('file')
    if (!(file instanceof File)) return { ok: false, error: 'No se recibió ningún archivo' }

    return uploadImageToBucket(file, 'gallery')
}

