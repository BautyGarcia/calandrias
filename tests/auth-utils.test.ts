import { describe, expect, it } from 'vitest'
import { parseAuthHashType, sanitizeRedirect } from '@/lib/auth-utils'

describe('sanitizeRedirect', () => {
    const fallback = '/admin/reservas'

    it('accepts a same-origin absolute path', () => {
        expect(sanitizeRedirect('/admin/reservas', fallback)).toBe('/admin/reservas')
    })

    it('accepts a same-origin path with query string', () => {
        expect(sanitizeRedirect('/admin/reservas?foo=bar', fallback)).toBe('/admin/reservas?foo=bar')
    })

    it('rejects an absolute external URL', () => {
        expect(sanitizeRedirect('https://evil.com', fallback)).toBe(fallback)
    })

    it('rejects a protocol-relative URL (//evil.com)', () => {
        expect(sanitizeRedirect('//evil.com', fallback)).toBe(fallback)
    })

    it('rejects a backslash-based URL (browsers treat \\ as /)', () => {
        expect(sanitizeRedirect('/\\evil.com', fallback)).toBe(fallback)
    })

    it('rejects a javascript: URL', () => {
        expect(sanitizeRedirect('javascript:alert(1)', fallback)).toBe(fallback)
    })

    it('rejects a string containing :// anywhere', () => {
        expect(sanitizeRedirect('/redirect?next=https://evil.com', fallback)).toBe(fallback)
    })

    it('falls back for an empty string', () => {
        expect(sanitizeRedirect('', fallback)).toBe(fallback)
    })

    it('falls back for null', () => {
        expect(sanitizeRedirect(null, fallback)).toBe(fallback)
    })

    it('rejects a path not starting with /', () => {
        expect(sanitizeRedirect('admin/reservas', fallback)).toBe(fallback)
    })

    it('rejects a triple-slash path (///evil.com)', () => {
        expect(sanitizeRedirect('///evil.com', fallback)).toBe(fallback)
    })

    it('rejects a path with an embedded tab (WHATWG URL parser strips it, exposing //evil.com)', () => {
        expect(sanitizeRedirect('/\t/evil.com', fallback)).toBe(fallback)
    })

    it('rejects a path with an embedded newline', () => {
        expect(sanitizeRedirect('/\n/evil.com', fallback)).toBe(fallback)
    })

    it('rejects a path with an embedded carriage return', () => {
        expect(sanitizeRedirect('/\r/evil.com', fallback)).toBe(fallback)
    })

    it('rejects a path with a NUL byte', () => {
        expect(sanitizeRedirect('/admin\x00', fallback)).toBe(fallback)
    })
})

describe('parseAuthHashType', () => {
    it('extrae type=invite de un hash de callback de Supabase', () => {
        expect(parseAuthHashType('#access_token=abc&expires_in=3600&type=invite')).toBe('invite')
    })

    it('extrae type=recovery', () => {
        expect(parseAuthHashType('#access_token=abc&type=recovery&token_type=bearer')).toBe('recovery')
    })

    it('devuelve null si el hash no trae type', () => {
        expect(parseAuthHashType('#access_token=abc&expires_in=3600')).toBeNull()
    })

    it('devuelve null para hash vacío', () => {
        expect(parseAuthHashType('')).toBeNull()
    })

    it('devuelve null si el string no empieza con #', () => {
        expect(parseAuthHashType('type=invite')).toBeNull()
    })

    it('devuelve null si type está vacío', () => {
        expect(parseAuthHashType('#type=&access_token=abc')).toBeNull()
    })
})
