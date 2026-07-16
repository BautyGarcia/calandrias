import { describe, expect, it } from 'vitest'
import { sanitizeRedirect } from '@/lib/auth-utils'

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
})
