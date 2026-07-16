import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
    Cabin,
    CabinFeatureIcon,
    Month,
} from '@/types/cabin'
import type { CabinInput } from '@/types/db'

// Shapes nativos de las columnas jsonb en Postgres (sin los `id` sintéticos
// que el tipo de la app arrastra por compatibilidad histórica).
interface CabinFeatureRow {
    icon: string
    label: string
}
interface CabinAmenitiesRow {
    kitchen: boolean
    air_conditioning: string
    pool_shared: boolean
}
interface CabinOverrideRow {
    mes: string
    precio_override?: number
    descuento_dia_semana_override?: number
}

// Fila tal como vive en Postgres (snake_case).
export interface CabinRow {
    id: string
    slug: string
    name: string
    subtitle: string
    description: string
    setting: string
    capacity: string
    bedrooms: string
    bathrooms: string
    image_url: string | null
    thumbnail_url: string | null
    features: CabinFeatureRow[]
    highlights: string[]
    amenities: CabinAmenitiesRow
    nearby_attractions: string[]
    rating_score: number
    rating_review_count: number
    precio_base_noche: number
    descuento_dia_semana_default: number
    overrides_mensuales: CabinOverrideRow[]
    is_published: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

// ---------------------------------------------------------------
// Mapper puro (testeable sin DB)
// ---------------------------------------------------------------

// La app conserva el tipo `Cabin`: el uuid de la DB vive en `documentId`
// (compatibilidad histórica); `id` numérico se deriva de `sort_order`.
export function rowToCabin(row: CabinRow): Cabin {
    return {
        id: row.sort_order,
        documentId: row.id,
        slug: row.slug,
        name: row.name,
        subtitle: row.subtitle,
        description: row.description,
        setting: row.setting,
        capacity: row.capacity,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        image: { url: row.image_url ?? '' },
        thumbnail: { url: row.thumbnail_url ?? '' },
        // Los `id` numéricos son sintéticos (compatibilidad histórica; en la DB no existen).
        features: (row.features ?? []).map((f, i) => ({
            id: i,
            icon: f.icon as CabinFeatureIcon,
            label: f.label,
        })),
        highlights: row.highlights ?? [],
        amenities: { id: 0, ...row.amenities },
        rating: { id: 0, score: row.rating_score, review_count: row.rating_review_count },
        nearby_attractions: row.nearby_attractions ?? [],
        precio_base_noche: row.precio_base_noche,
        descuento_dia_semana_default: row.descuento_dia_semana_default,
        overrides_mensuales: (row.overrides_mensuales ?? []).map((o, i) => ({
            id: i,
            mes: o.mes as Month,
            precio_override: o.precio_override,
            descuento_dia_semana_override: o.descuento_dia_semana_override,
        })),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.is_published ? row.created_at : '',
    }
}

// Mapea sólo las claves presentes de un patch parcial (para UPDATE).
function cabinPatchToRow(patch: Partial<CabinInput>): Record<string, unknown> {
    const row: Record<string, unknown> = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.subtitle !== undefined) row.subtitle = patch.subtitle
    if (patch.description !== undefined) row.description = patch.description
    if (patch.setting !== undefined) row.setting = patch.setting
    if (patch.capacity !== undefined) row.capacity = patch.capacity
    if (patch.bedrooms !== undefined) row.bedrooms = patch.bedrooms
    if (patch.bathrooms !== undefined) row.bathrooms = patch.bathrooms
    if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl
    if (patch.thumbnailUrl !== undefined) row.thumbnail_url = patch.thumbnailUrl
    if (patch.features !== undefined) row.features = patch.features
    if (patch.highlights !== undefined) row.highlights = patch.highlights
    if (patch.amenities !== undefined) row.amenities = patch.amenities
    if (patch.nearbyAttractions !== undefined) row.nearby_attractions = patch.nearbyAttractions
    if (patch.ratingScore !== undefined) row.rating_score = patch.ratingScore
    if (patch.ratingReviewCount !== undefined) row.rating_review_count = patch.ratingReviewCount
    if (patch.precio_base_noche !== undefined) row.precio_base_noche = patch.precio_base_noche
    if (patch.descuento_dia_semana_default !== undefined) row.descuento_dia_semana_default = patch.descuento_dia_semana_default
    if (patch.overrides_mensuales !== undefined) row.overrides_mensuales = patch.overrides_mensuales
    if (patch.isPublished !== undefined) row.is_published = patch.isPublished
    if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder
    return row
}

// ---------------------------------------------------------------
// Acceso a datos
// ---------------------------------------------------------------

// Lectura pública: filtra is_published en código (RLS es defensa en profundidad).
export async function getCabins(): Promise<Cabin[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })

    if (error) throw new Error(`Error obteniendo cabañas: ${error.message}`)
    return (data as CabinRow[]).map(rowToCabin)
}

export async function getCabinBySlug(slug: string): Promise<Cabin | null> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()

    if (error) throw new Error(`Error obteniendo cabaña: ${error.message}`)
    return data ? rowToCabin(data as CabinRow) : null
}

// (admin) Lista TODAS las cabañas, incluidas las no publicadas (para el panel).
export async function getAllCabinsAdmin(): Promise<Cabin[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw new Error(`Error obteniendo cabañas (admin): ${error.message}`)
    return (data as CabinRow[]).map(rowToCabin)
}

// (admin) Cabaña por slug sin filtrar is_published (para editar aunque esté oculta).
export async function getCabinForAdmin(slug: string): Promise<Cabin | null> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

    if (error) throw new Error(`Error obteniendo cabaña (admin): ${error.message}`)
    return data ? rowToCabin(data as CabinRow) : null
}

// (admin) URL iCal de Airbnb de una cabaña (o '' si no está configurada). id = uuid.
export async function getAirbnbIcalUrl(cabinId: string): Promise<string> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('cabin_sync_config')
        .select('airbnb_ical_url')
        .eq('cabin_id', cabinId)
        .maybeSingle()

    if (error) throw new Error(`Error obteniendo URL iCal: ${error.message}`)
    return data?.airbnb_ical_url ?? ''
}

// (admin) Actualiza campos editables de una cabaña por uuid.
export async function updateCabin(id: string, patch: Partial<CabinInput>): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase.from('cabins').update(cabinPatchToRow(patch)).eq('id', id)
    if (error) throw new Error(`Error actualizando cabaña: ${error.message}`)
}

// (admin) Crea una cabaña borrador (oculta) con el resto de los campos en sus
// defaults de DB; el contenido se completa después en el editor. Devuelve
// 'duplicate' si el slug ya existe.
export async function createCabin(slug: string, name: string): Promise<'created' | 'duplicate'> {
    const supabase = createAdminClient()

    const { data: maxRow, error: maxError } = await supabase
        .from('cabins')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()
    if (maxError) throw new Error(`Error creando cabaña: ${maxError.message}`)

    const { error } = await supabase.from('cabins').insert({
        slug,
        name,
        is_published: false,
        sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    if (error) {
        if (error.code === '23505') return 'duplicate'
        throw new Error(`Error creando cabaña: ${error.message}`)
    }
    return 'created'
}

// (admin) Configuraciones de sync de Airbnb (URLs iCal privadas).
export async function getAirbnbSyncConfigs(): Promise<
    { cabinId: string; cabinSlug: string; cabinName: string; icalUrl: string }[]
> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('cabin_sync_config')
        .select('cabin_id, airbnb_ical_url, cabins(slug, name)')

    if (error) throw new Error(`Error obteniendo configs de sync: ${error.message}`)

    type Row = {
        cabin_id: string
        airbnb_ical_url: string | null
        cabins: { slug: string; name: string } | { slug: string; name: string }[] | null
    }

    return (data as Row[])
        .filter((r) => r.airbnb_ical_url && r.airbnb_ical_url.trim() !== '')
        .map((r) => {
            const cabin = Array.isArray(r.cabins) ? r.cabins[0] : r.cabins
            return {
                cabinId: r.cabin_id,
                cabinSlug: cabin?.slug ?? '',
                cabinName: cabin?.name ?? '',
                icalUrl: r.airbnb_ical_url!,
            }
        })
}

// (admin) Setea/actualiza la URL iCal de Airbnb de una cabaña.
export async function setAirbnbIcalUrl(cabinId: string, url: string): Promise<void> {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('cabin_sync_config')
        .upsert({ cabin_id: cabinId, airbnb_ical_url: url }, { onConflict: 'cabin_id' })

    if (error) throw new Error(`Error guardando URL iCal: ${error.message}`)
}
