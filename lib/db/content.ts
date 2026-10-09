import 'server-only'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { faqs, galleryItems, reviews, siteContent, siteSettings } from '@/lib/schema'
import { errorMessage } from '@/lib/db/errors'
import type {
    SiteSettings,
    Faq,
    FaqInput,
    Review,
    ReviewInput,
    GalleryItem,
    GalleryItemInput,
} from '@/types/db'

// ---------------------------------------------------------------
// Mappers (fila snake_case → tipo de la app)
// ---------------------------------------------------------------

type SiteSettingsRow = typeof siteSettings.$inferSelect
type FaqRow = typeof faqs.$inferSelect
type ReviewRow = typeof reviews.$inferSelect
type GalleryItemRow = typeof galleryItems.$inferSelect

function rowToSiteSettings(row: SiteSettingsRow): SiteSettings {
    return {
        bookingsEnabled: row.bookings_enabled,
        whatsapp: row.whatsapp,
        phone: row.phone,
        email: row.email,
        address: row.address,
        checkinTime: row.checkin_time,
        checkoutTime: row.checkout_time,
    }
}

function rowToFaq(row: FaqRow): Faq {
    return {
        id: row.id,
        question: row.question,
        answer: row.answer,
        sortOrder: row.sort_order,
        isPublished: row.is_published,
    }
}

function rowToReview(row: ReviewRow): Review {
    return {
        id: row.id,
        name: row.name,
        location: row.location,
        text: row.text,
        rating: row.rating,
        sortOrder: row.sort_order,
        isPublished: row.is_published,
    }
}

function rowToGalleryItem(row: GalleryItemRow): GalleryItem {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        span: row.span,
        sortOrder: row.sort_order,
        isPublished: row.is_published,
    }
}

// ---------------------------------------------------------------
// Site settings (fila única id = true)
// ---------------------------------------------------------------

export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, true)).limit(1)
        if (!row) throw new Error('fila de configuración ausente')
        return rowToSiteSettings(row)
    } catch (e) {
        throw new Error(`Error obteniendo configuración: ${errorMessage(e)}`)
    }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
    const row: Partial<typeof siteSettings.$inferInsert> = {}
    if (patch.bookingsEnabled !== undefined) row.bookings_enabled = patch.bookingsEnabled
    if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp
    if (patch.phone !== undefined) row.phone = patch.phone
    if (patch.email !== undefined) row.email = patch.email
    if (patch.address !== undefined) row.address = patch.address
    if (patch.checkinTime !== undefined) row.checkin_time = patch.checkinTime
    if (patch.checkoutTime !== undefined) row.checkout_time = patch.checkoutTime
    if (Object.keys(row).length === 0) return

    try {
        await db.update(siteSettings).set(row).where(eq(siteSettings.id, true))
    } catch (e) {
        throw new Error(`Error actualizando configuración: ${errorMessage(e)}`)
    }
}

// ---------------------------------------------------------------
// Bloques de contenido (site_content key/value jsonb)
// ---------------------------------------------------------------

export async function getSiteContent<T>(key: string): Promise<T | null> {
    try {
        const [row] = await db.select({ value: siteContent.value }).from(siteContent).where(eq(siteContent.key, key)).limit(1)
        return row ? (row.value as T) : null
    } catch (e) {
        throw new Error(`Error obteniendo contenido '${key}': ${errorMessage(e)}`)
    }
}

export async function setSiteContent<T>(key: string, value: T): Promise<void> {
    try {
        await db
            .insert(siteContent)
            .values({ key, value })
            .onConflictDoUpdate({ target: siteContent.key, set: { value } })
    } catch (e) {
        throw new Error(`Error guardando contenido '${key}': ${errorMessage(e)}`)
    }
}

// ---------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------

export async function getFaqs(all = false): Promise<Faq[]> {
    try {
        const rows = await db
            .select()
            .from(faqs)
            .where(all ? undefined : eq(faqs.is_published, true))
            .orderBy(asc(faqs.sort_order))
        return rows.map(rowToFaq)
    } catch (e) {
        throw new Error(`Error obteniendo FAQs: ${errorMessage(e)}`)
    }
}

export async function upsertFaq(faq: FaqInput): Promise<Faq> {
    const set = {
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sortOrder,
        is_published: faq.isPublished,
    }
    try {
        const [row] = await db
            .insert(faqs)
            .values({ id: faq.id || undefined, ...set })
            .onConflictDoUpdate({ target: faqs.id, set })
            .returning()
        return rowToFaq(row)
    } catch (e) {
        throw new Error(`Error guardando FAQ: ${errorMessage(e)}`)
    }
}

export async function deleteFaq(id: string): Promise<void> {
    try {
        await db.delete(faqs).where(eq(faqs.id, id))
    } catch (e) {
        throw new Error(`Error eliminando FAQ: ${errorMessage(e)}`)
    }
}

// ---------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------

export async function getReviews(all = false): Promise<Review[]> {
    try {
        const rows = await db
            .select()
            .from(reviews)
            .where(all ? undefined : eq(reviews.is_published, true))
            .orderBy(asc(reviews.sort_order))
        return rows.map(rowToReview)
    } catch (e) {
        throw new Error(`Error obteniendo reseñas: ${errorMessage(e)}`)
    }
}

export async function upsertReview(review: ReviewInput): Promise<Review> {
    const set = {
        name: review.name,
        location: review.location,
        text: review.text,
        rating: review.rating,
        sort_order: review.sortOrder,
        is_published: review.isPublished,
    }
    try {
        const [row] = await db
            .insert(reviews)
            .values({ id: review.id || undefined, ...set })
            .onConflictDoUpdate({ target: reviews.id, set })
            .returning()
        return rowToReview(row)
    } catch (e) {
        throw new Error(`Error guardando reseña: ${errorMessage(e)}`)
    }
}

export async function deleteReview(id: string): Promise<void> {
    try {
        await db.delete(reviews).where(eq(reviews.id, id))
    } catch (e) {
        throw new Error(`Error eliminando reseña: ${errorMessage(e)}`)
    }
}

// ---------------------------------------------------------------
// Gallery items
// ---------------------------------------------------------------

export async function getGalleryItems(all = false): Promise<GalleryItem[]> {
    try {
        const rows = await db
            .select()
            .from(galleryItems)
            .where(all ? undefined : eq(galleryItems.is_published, true))
            .orderBy(asc(galleryItems.sort_order))
        return rows.map(rowToGalleryItem)
    } catch (e) {
        throw new Error(`Error obteniendo galería: ${errorMessage(e)}`)
    }
}

export async function upsertGalleryItem(item: GalleryItemInput): Promise<GalleryItem> {
    const set = {
        title: item.title,
        description: item.description,
        image_url: item.imageUrl,
        span: item.span,
        sort_order: item.sortOrder,
        is_published: item.isPublished,
    }
    try {
        const [row] = await db
            .insert(galleryItems)
            .values({ id: item.id || undefined, ...set })
            .onConflictDoUpdate({ target: galleryItems.id, set })
            .returning()
        return rowToGalleryItem(row)
    } catch (e) {
        throw new Error(`Error guardando ítem de galería: ${errorMessage(e)}`)
    }
}

export async function deleteGalleryItem(id: string): Promise<void> {
    try {
        await db.delete(galleryItems).where(eq(galleryItems.id, id))
    } catch (e) {
        throw new Error(`Error eliminando ítem de galería: ${errorMessage(e)}`)
    }
}

// ---------------------------------------------------------------
// Reorden
// ---------------------------------------------------------------

export type ReorderableTable = 'faqs' | 'reviews' | 'gallery_items'

// Renumera sort_order = posición (1-based) según el orden de `ids`, en un
// único UPDATE atómico (función SQL admin_reorder, migración 0004).
export async function reorderContent(table: ReorderableTable, ids: string[]): Promise<void> {
    try {
        await db.execute(sql`select admin_reorder(${table}, ${ids}::uuid[])`)
    } catch (e) {
        throw new Error(`Error reordenando ${table}: ${errorMessage(e)}`)
    }
}
