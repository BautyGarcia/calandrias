import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
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
// Row shapes (snake_case) + mappers
// ---------------------------------------------------------------

interface SiteSettingsRow {
    id: boolean
    bookings_enabled: boolean
    whatsapp: string
    phone: string
    email: string
    address: string
    checkin_time: string
    checkout_time: string
    updated_at: string
}

interface FaqRow {
    id: string
    question: string
    answer: string
    sort_order: number
    is_published: boolean
    updated_at: string
}

interface ReviewRow {
    id: string
    name: string
    location: string
    text: string
    avatar_url: string | null
    rating: number
    sort_order: number
    is_published: boolean
    updated_at: string
}

interface GalleryItemRow {
    id: string
    title: string
    description: string
    image_url: string
    span: string
    sort_order: number
    is_published: boolean
    updated_at: string
}

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
        avatarUrl: row.avatar_url ?? undefined,
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
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', true).single()
    if (error) throw new Error(`Error obteniendo configuración: ${error.message}`)
    return rowToSiteSettings(data as SiteSettingsRow)
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
    const row: Record<string, unknown> = {}
    if (patch.bookingsEnabled !== undefined) row.bookings_enabled = patch.bookingsEnabled
    if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp
    if (patch.phone !== undefined) row.phone = patch.phone
    if (patch.email !== undefined) row.email = patch.email
    if (patch.address !== undefined) row.address = patch.address
    if (patch.checkinTime !== undefined) row.checkin_time = patch.checkinTime
    if (patch.checkoutTime !== undefined) row.checkout_time = patch.checkoutTime

    const supabase = createAdminClient()
    const { error } = await supabase.from('site_settings').update(row).eq('id', true)
    if (error) throw new Error(`Error actualizando configuración: ${error.message}`)
}

// ---------------------------------------------------------------
// Bloques de contenido (site_content key/value jsonb)
// ---------------------------------------------------------------

export async function getSiteContent<T>(key: string): Promise<T | null> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle()
    if (error) throw new Error(`Error obteniendo contenido '${key}': ${error.message}`)
    return data ? (data.value as T) : null
}

export async function setSiteContent<T>(key: string, value: T): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('site_content')
        .upsert({ key, value }, { onConflict: 'key' })
    if (error) throw new Error(`Error guardando contenido '${key}': ${error.message}`)
}

// ---------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------

export async function getFaqs(all = false): Promise<Faq[]> {
    const supabase = createAdminClient()
    let query = supabase.from('faqs').select('*').order('sort_order', { ascending: true })
    if (!all) query = query.eq('is_published', true)
    const { data, error } = await query
    if (error) throw new Error(`Error obteniendo FAQs: ${error.message}`)
    return (data as FaqRow[]).map(rowToFaq)
}

export async function upsertFaq(faq: FaqInput): Promise<Faq> {
    const row: Record<string, unknown> = {
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sortOrder,
        is_published: faq.isPublished,
    }
    if (faq.id) row.id = faq.id

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('faqs').upsert(row).select('*').single()
    if (error) throw new Error(`Error guardando FAQ: ${error.message}`)
    return rowToFaq(data as FaqRow)
}

export async function deleteFaq(id: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) throw new Error(`Error eliminando FAQ: ${error.message}`)
}

// ---------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------

export async function getReviews(all = false): Promise<Review[]> {
    const supabase = createAdminClient()
    let query = supabase.from('reviews').select('*').order('sort_order', { ascending: true })
    if (!all) query = query.eq('is_published', true)
    const { data, error } = await query
    if (error) throw new Error(`Error obteniendo reseñas: ${error.message}`)
    return (data as ReviewRow[]).map(rowToReview)
}

export async function upsertReview(review: ReviewInput): Promise<Review> {
    const row: Record<string, unknown> = {
        name: review.name,
        location: review.location,
        text: review.text,
        avatar_url: review.avatarUrl ?? null,
        rating: review.rating,
        sort_order: review.sortOrder,
        is_published: review.isPublished,
    }
    if (review.id) row.id = review.id

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('reviews').upsert(row).select('*').single()
    if (error) throw new Error(`Error guardando reseña: ${error.message}`)
    return rowToReview(data as ReviewRow)
}

export async function deleteReview(id: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) throw new Error(`Error eliminando reseña: ${error.message}`)
}

// ---------------------------------------------------------------
// Gallery items
// ---------------------------------------------------------------

export async function getGalleryItems(all = false): Promise<GalleryItem[]> {
    const supabase = createAdminClient()
    let query = supabase.from('gallery_items').select('*').order('sort_order', { ascending: true })
    if (!all) query = query.eq('is_published', true)
    const { data, error } = await query
    if (error) throw new Error(`Error obteniendo galería: ${error.message}`)
    return (data as GalleryItemRow[]).map(rowToGalleryItem)
}

export async function upsertGalleryItem(item: GalleryItemInput): Promise<GalleryItem> {
    const row: Record<string, unknown> = {
        title: item.title,
        description: item.description,
        image_url: item.imageUrl,
        span: item.span,
        sort_order: item.sortOrder,
        is_published: item.isPublished,
    }
    if (item.id) row.id = item.id

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('gallery_items').upsert(row).select('*').single()
    if (error) throw new Error(`Error guardando ítem de galería: ${error.message}`)
    return rowToGalleryItem(data as GalleryItemRow)
}

export async function deleteGalleryItem(id: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.from('gallery_items').delete().eq('id', id)
    if (error) throw new Error(`Error eliminando ítem de galería: ${error.message}`)
}

// ---------------------------------------------------------------
// Reorden
// ---------------------------------------------------------------

export type ReorderableTable = 'faqs' | 'reviews' | 'gallery_items'

// Renumera sort_order = posición (1-based) según el orden de `ids`, en un
// único UPDATE atómico (función admin_reorder, migración 0004).
export async function reorderContent(table: ReorderableTable, ids: string[]): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('admin_reorder', { p_table: table, p_ids: ids })
    if (error) throw new Error(`Error reordenando ${table}: ${error.message}`)
}
