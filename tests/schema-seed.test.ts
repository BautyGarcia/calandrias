import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { cabinsData as cabins } from '@/data/cabins'

const seed = readFileSync('supabase/seed.sql', 'utf-8')

describe('seed.sql', () => {
    it('contiene las 3 cabañas de data/cabins.ts', () => {
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
