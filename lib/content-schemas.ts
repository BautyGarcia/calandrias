import { z } from 'zod'

// ---------------------------------------------------------------
// Schemas por bloque de `site_content`. Task 11 consumirá estos
// shapes en la home pública, por eso deben coincidir con el seed.
// ---------------------------------------------------------------

const nonEmpty = z.string().trim().min(1)

export const heroSchema = z.object({
    title: nonEmpty,
    subtitle: nonEmpty,
    ctaLabel: nonEmpty,
})

export const servicesSchema = z.object({
    title: nonEmpty,
    items: z
        .array(
            z.object({
                icon: nonEmpty,
                title: nonEmpty,
                description: nonEmpty,
            })
        )
        .min(1),
})

export const ctaSchema = z.object({
    title: nonEmpty,
    subtitle: nonEmpty,
    buttonLabel: nonEmpty,
})

export const cabinsTeaserSchema = z.object({
    title: nonEmpty,
    subtitle: nonEmpty,
    stats: z
        .array(
            z.object({
                value: nonEmpty,
                label: nonEmpty,
            })
        )
        .min(1),
    features: z
        .array(
            z.object({
                title: nonEmpty,
                description: nonEmpty,
            })
        )
        .min(1),
    ctaLabel: nonEmpty,
})

export const seoSchema = z.object({
    title: nonEmpty,
    description: nonEmpty,
    keywords: nonEmpty,
})

export type HeroContent = z.infer<typeof heroSchema>
export type ServicesContent = z.infer<typeof servicesSchema>
export type CtaContent = z.infer<typeof ctaSchema>
export type CabinsTeaserContent = z.infer<typeof cabinsTeaserSchema>
export type SeoContent = z.infer<typeof seoSchema>

export const SITE_CONTENT_KEYS = ['hero', 'services', 'cta', 'cabins_teaser', 'seo'] as const
export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number]

const SCHEMA_MAP: Record<SiteContentKey, z.ZodTypeAny> = {
    hero: heroSchema,
    services: servicesSchema,
    cta: ctaSchema,
    cabins_teaser: cabinsTeaserSchema,
    seo: seoSchema,
}

// Devuelve el schema que corresponde a `key`, o null si la key no está permitida.
// Usa Object.prototype.hasOwnProperty para no matchear keys heredadas (p.ej. __proto__).
export function siteContentSchemaFor(key: string): z.ZodTypeAny | null {
    if (!Object.prototype.hasOwnProperty.call(SCHEMA_MAP, key)) return null
    return SCHEMA_MAP[key as SiteContentKey]
}
