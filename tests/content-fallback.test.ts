import { describe, it, expect } from 'vitest'
import { withFallback } from '@/lib/content-fallback'

describe('withFallback', () => {
    it('devuelve el valor del CMS cuando existe', () => {
        expect(withFallback('CMS', 'default')).toBe('CMS')
    })

    it('cae al default cuando el valor es null', () => {
        expect(withFallback(null, 'default')).toBe('default')
    })

    it('cae al default cuando el valor es undefined', () => {
        expect(withFallback(undefined, 'default')).toBe('default')
    })

    it('cae al default cuando el string está vacío o en blanco', () => {
        expect(withFallback('', 'default')).toBe('default')
        expect(withFallback('   ', 'default')).toBe('default')
    })

    it('conserva valores no-string (ej: objetos)', () => {
        const obj = { a: 1 }
        expect(withFallback(obj, { a: 2 })).toBe(obj)
    })

    it('no cae al default con 0 o false', () => {
        expect(withFallback(0, 99)).toBe(0)
        expect(withFallback(false, true)).toBe(false)
    })
})
