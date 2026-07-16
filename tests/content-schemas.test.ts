import { describe, it, expect } from 'vitest'
import {
    siteContentSchemaFor,
    heroSchema,
    servicesSchema,
    ctaSchema,
    cabinsTeaserSchema,
    seoSchema,
    SITE_CONTENT_KEYS,
} from '@/lib/content-schemas'
import { swapSortOrder } from '@/lib/sort-order'

const validHero = { title: 'Hola', subtitle: 'Bienvenido', ctaLabel: 'Reservar' }

describe('siteContentSchemaFor', () => {
    it('devuelve el schema para cada key permitida', () => {
        expect(siteContentSchemaFor('hero')).toBe(heroSchema)
        expect(siteContentSchemaFor('services')).toBe(servicesSchema)
        expect(siteContentSchemaFor('cta')).toBe(ctaSchema)
        expect(siteContentSchemaFor('cabins_teaser')).toBe(cabinsTeaserSchema)
        expect(siteContentSchemaFor('seo')).toBe(seoSchema)
    })

    it('rechaza (null) una key desconocida', () => {
        expect(siteContentSchemaFor('unknown')).toBeNull()
        expect(siteContentSchemaFor('')).toBeNull()
        expect(siteContentSchemaFor('__proto__')).toBeNull()
    })

    it('SITE_CONTENT_KEYS contiene exactamente las 5 keys', () => {
        expect([...SITE_CONTENT_KEYS].sort()).toEqual(
            ['cabins_teaser', 'cta', 'hero', 'seo', 'services'].sort()
        )
    })
})

describe('heroSchema', () => {
    it('acepta un hero válido', () => {
        expect(heroSchema.safeParse(validHero).success).toBe(true)
    })

    it('rechaza un hero sin ctaLabel', () => {
        const { ctaLabel: _drop, ...noCta } = validHero
        expect(heroSchema.safeParse(noCta).success).toBe(false)
    })

    it('rechaza un hero con campo vacío', () => {
        expect(heroSchema.safeParse({ ...validHero, title: '' }).success).toBe(false)
    })
})

describe('servicesSchema', () => {
    const valid = {
        title: 'Servicios',
        items: [{ icon: 'Home', title: 'Uno', description: 'desc' }],
    }
    it('acepta al menos un item', () => {
        expect(servicesSchema.safeParse(valid).success).toBe(true)
    })
    it('rechaza items vacíos', () => {
        expect(servicesSchema.safeParse({ title: 'x', items: [] }).success).toBe(false)
    })
    it('rechaza un item sin description', () => {
        expect(
            servicesSchema.safeParse({ title: 'x', items: [{ icon: 'Home', title: 'Uno' }] }).success
        ).toBe(false)
    })
})

describe('cabinsTeaserSchema', () => {
    const valid = {
        title: 'Refugio',
        subtitle: 'sub',
        stats: [{ value: '4', label: 'Cabañas' }],
        features: [{ title: 'Vistas', description: 'desc' }],
        ctaLabel: 'Ver',
    }
    it('acepta un teaser válido', () => {
        expect(cabinsTeaserSchema.safeParse(valid).success).toBe(true)
    })
    it('rechaza si falta stats', () => {
        const { stats: _drop, ...noStats } = valid
        expect(cabinsTeaserSchema.safeParse(noStats).success).toBe(false)
    })
})

describe('seoSchema', () => {
    it('acepta seo válido', () => {
        expect(
            seoSchema.safeParse({ title: 't', description: 'd', keywords: 'k' }).success
        ).toBe(true)
    })
    it('rechaza si falta keywords', () => {
        expect(seoSchema.safeParse({ title: 't', description: 'd' }).success).toBe(false)
    })
})

describe('ctaSchema', () => {
    it('acepta cta válido', () => {
        expect(
            ctaSchema.safeParse({ title: 't', subtitle: 's', buttonLabel: 'b' }).success
        ).toBe(true)
    })
})

describe('swapSortOrder', () => {
    const items = [
        { id: 'a', sortOrder: 1 },
        { id: 'b', sortOrder: 2 },
        { id: 'c', sortOrder: 3 },
    ]

    it('intercambia los sortOrder de dos posiciones', () => {
        const next = swapSortOrder(items, 0, 1)
        expect(next[0]).toEqual({ id: 'a', sortOrder: 2 })
        expect(next[1]).toEqual({ id: 'b', sortOrder: 1 })
        expect(next[2]).toEqual({ id: 'c', sortOrder: 3 })
    })

    it('no muta el array original', () => {
        const snapshot = JSON.parse(JSON.stringify(items))
        swapSortOrder(items, 0, 2)
        expect(items).toEqual(snapshot)
    })

    it('devuelve el mismo contenido si los índices son inválidos o iguales', () => {
        expect(swapSortOrder(items, 0, 0)).toEqual(items)
        expect(swapSortOrder(items, -1, 1)).toEqual(items)
        expect(swapSortOrder(items, 0, 99)).toEqual(items)
    })
})
