import { describe, it, expect } from 'vitest'
import {
    MONTHS,
    emptyPricingGrid,
    overridesToPricingGrid,
    pricingGridToOverrides,
    parseCabinForm,
    type PricingRow,
} from '@/lib/cabin-form'
import type { CabinPricingOverride } from '@/types/cabin'

describe('overridesToPricingGrid', () => {
    it('produce 12 filas en orden enero..diciembre', () => {
        const grid = overridesToPricingGrid([])
        expect(grid).toHaveLength(12)
        expect(grid.map((r) => r.mes)).toEqual(MONTHS)
        // Sin overrides: todas las celdas vacías (heredan base).
        expect(grid.every((r) => r.precio === '' && r.descuento === '')).toBe(true)
    })

    it('rellena las celdas de los meses con override', () => {
        const overrides: CabinPricingOverride[] = [
            { id: 0, mes: 'enero', precio_override: 60000, descuento_dia_semana_override: 0 },
            { id: 1, mes: 'julio', descuento_dia_semana_override: 15 },
        ]
        const grid = overridesToPricingGrid(overrides)
        const enero = grid.find((r) => r.mes === 'enero')!
        expect(enero.precio).toBe('60000')
        expect(enero.descuento).toBe('0')
        const julio = grid.find((r) => r.mes === 'julio')!
        expect(julio.precio).toBe('') // no precio_override => hereda base
        expect(julio.descuento).toBe('15')
    })
})

describe('pricingGridToOverrides', () => {
    it('omite meses con ambas celdas vacías', () => {
        const grid = emptyPricingGrid()
        expect(pricingGridToOverrides(grid)).toEqual([])
    })

    it('incluye sólo los meses con algún valor', () => {
        const grid = emptyPricingGrid()
        grid[0] = { mes: 'enero', precio: '60000', descuento: '0' }
        const out = pricingGridToOverrides(grid)
        expect(out).toHaveLength(1)
        expect(out[0].mes).toBe('enero')
        expect(out[0].precio_override).toBe(60000)
        expect(out[0].descuento_dia_semana_override).toBe(0)
    })

    it('override parcial: sólo descuento => no incluye precio_override', () => {
        const grid = emptyPricingGrid()
        grid[6] = { mes: 'julio', precio: '', descuento: '15' }
        const out = pricingGridToOverrides(grid)
        expect(out).toHaveLength(1)
        expect(out[0].mes).toBe('julio')
        expect('precio_override' in out[0]).toBe(false)
        expect(out[0].descuento_dia_semana_override).toBe(15)
    })

    it('override parcial: sólo precio => no incluye descuento_override', () => {
        const grid = emptyPricingGrid()
        grid[2] = { mes: 'marzo', precio: '55000', descuento: '' }
        const out = pricingGridToOverrides(grid)
        expect(out).toHaveLength(1)
        expect(out[0].precio_override).toBe(55000)
        expect('descuento_dia_semana_override' in out[0]).toBe(false)
    })

    it('ignora valores no numéricos como celda vacía', () => {
        const grid = emptyPricingGrid()
        grid[0] = { mes: 'enero', precio: 'abc', descuento: '' }
        expect(pricingGridToOverrides(grid)).toEqual([])
    })
})

describe('round-trip overrides <-> grid', () => {
    it('preserva overrides completos y parciales', () => {
        const overrides: CabinPricingOverride[] = [
            { id: 0, mes: 'enero', precio_override: 60000, descuento_dia_semana_override: 5 },
            { id: 1, mes: 'diciembre', precio_override: 80000 },
            { id: 2, mes: 'junio', descuento_dia_semana_override: 20 },
        ]
        const grid = overridesToPricingGrid(overrides)
        const back = pricingGridToOverrides(grid)
        // Reordenado por mes; comparamos por contenido (sin id).
        const norm = (o: CabinPricingOverride) => ({
            mes: o.mes,
            precio_override: o.precio_override,
            descuento_dia_semana_override: o.descuento_dia_semana_override,
        })
        expect(back.map(norm).sort((a, b) => a.mes.localeCompare(b.mes))).toEqual(
            overrides.map(norm).sort((a, b) => a.mes.localeCompare(b.mes))
        )
    })
})

describe('parseCabinForm', () => {
    const validRaw = () => ({
        name: 'El Roble',
        subtitle: 'Cabaña serrana',
        description: 'Una cabaña con vista.',
        setting: 'Entre sierras',
        capacity: '4 huéspedes',
        bedrooms: '2 dormitorios',
        bathrooms: '1 baño',
        imageUrl: 'https://x.supabase.co/a.jpg',
        thumbnailUrl: 'https://x.supabase.co/b.jpg',
        highlights: JSON.stringify(['Chimenea', 'Jacuzzi']),
        features: JSON.stringify([{ icon: 'Mountain', label: 'Vista a las sierras' }]),
        nearbyAttractions: JSON.stringify(['Lago', 'Cascada']),
        amenities_kitchen: 'true',
        amenities_pool_shared: 'false',
        amenities_air_conditioning: 'frío-calor',
        ratingScore: '4.8',
        ratingReviewCount: '12',
        precio_base_noche: '40000',
        descuento_dia_semana_default: '10',
        pricingGrid: JSON.stringify([
            { mes: 'enero', precio: '60000', descuento: '0' },
        ]),
        isPublished: 'true',
        sortOrder: '1',
    })

    it('parsea un formulario válido a CabinInput', () => {
        const res = parseCabinForm(validRaw())
        expect(res.ok).toBe(true)
        if (!res.ok) return
        const d = res.data
        expect(d.name).toBe('El Roble')
        expect(d.capacity).toBe('4 huéspedes')
        expect(d.highlights).toEqual(['Chimenea', 'Jacuzzi'])
        expect(d.features).toEqual([{ id: 0, icon: 'Mountain', label: 'Vista a las sierras' }])
        expect(d.amenities.kitchen).toBe(true)
        expect(d.amenities.pool_shared).toBe(false)
        expect(d.amenities.air_conditioning).toBe('frío-calor')
        expect(d.ratingScore).toBe(4.8)
        expect(d.precio_base_noche).toBe(40000)
        expect(d.descuento_dia_semana_default).toBe(10)
        expect(d.overrides_mensuales).toHaveLength(1)
        expect(d.overrides_mensuales[0].precio_override).toBe(60000)
        expect(d.isPublished).toBe(true)
    })

    it('rechaza name vacío', () => {
        const raw = { ...validRaw(), name: '   ' }
        const res = parseCabinForm(raw)
        expect(res.ok).toBe(false)
    })

    it('rechaza un icono de feature inválido', () => {
        const raw = { ...validRaw(), features: JSON.stringify([{ icon: 'Nope', label: 'x' }]) }
        const res = parseCabinForm(raw)
        expect(res.ok).toBe(false)
    })

    it('rechaza precio_base_noche negativo', () => {
        const raw = { ...validRaw(), precio_base_noche: '-5' }
        const res = parseCabinForm(raw)
        expect(res.ok).toBe(false)
    })

    it('acepta imageUrl vacía como null', () => {
        const raw = { ...validRaw(), imageUrl: '', thumbnailUrl: '' }
        const res = parseCabinForm(raw)
        expect(res.ok).toBe(true)
        if (!res.ok) return
        expect(res.data.imageUrl).toBeNull()
        expect(res.data.thumbnailUrl).toBeNull()
    })
})
