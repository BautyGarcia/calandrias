import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isAdminEmail } from '@/lib/auth'

describe('isAdminEmail', () => {
    const original = process.env.ADMIN_EMAILS

    beforeEach(() => {
        process.env.ADMIN_EMAILS = 'Admin@Calandrias.com'
    })

    afterEach(() => {
        process.env.ADMIN_EMAILS = original
    })

    it('returns false for undefined email', () => {
        expect(isAdminEmail(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
        expect(isAdminEmail('')).toBe(false)
    })

    it('matches case-insensitively', () => {
        expect(isAdminEmail('ADMIN@calandrias.COM')).toBe(true)
        expect(isAdminEmail('admin@calandrias.com')).toBe(true)
    })

    it('trims surrounding whitespace on the input', () => {
        expect(isAdminEmail('  admin@calandrias.com  ')).toBe(true)
    })

    it('returns false when ADMIN_EMAILS is empty', () => {
        process.env.ADMIN_EMAILS = ''
        expect(isAdminEmail('admin@calandrias.com')).toBe(false)
    })

    it('returns false when ADMIN_EMAILS is unset', () => {
        delete process.env.ADMIN_EMAILS
        expect(isAdminEmail('admin@calandrias.com')).toBe(false)
    })

    it('supports multiple comma-separated emails with stray whitespace', () => {
        process.env.ADMIN_EMAILS = ' one@x.com , Two@Y.com ,three@z.com '
        expect(isAdminEmail('two@y.com')).toBe(true)
        expect(isAdminEmail('three@z.com')).toBe(true)
        expect(isAdminEmail('nobody@x.com')).toBe(false)
    })

    it('ignores empty entries between commas', () => {
        process.env.ADMIN_EMAILS = 'a@x.com,,b@x.com'
        expect(isAdminEmail('b@x.com')).toBe(true)
        expect(isAdminEmail('')).toBe(false)
    })
})
