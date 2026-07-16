import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { seedCabins as cabins } from './fixtures/seed-cabins'

const seed = readFileSync('supabase/seed.sql', 'utf-8')

describe('seed.sql', () => {
    it('contiene las 3 cabañas del fixture de seed', () => {
        for (const c of cabins) {
            expect(seed).toContain(c.slug)
            expect(seed).toContain(c.name)
        }
    })
    it('inicia con reservas deshabilitadas', () => {
        expect(seed).toMatch(/bookings_enabled/)
        expect(seed).not.toMatch(/bookings_enabled[^)]*true/i)
    })
})
