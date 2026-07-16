import { describe, it, expect } from 'vitest'
import { siteSettingsSchema } from '@/lib/settings-schema'

const validPatch = {
    bookingsEnabled: false,
    whatsapp: '5492494027920',
    phone: '+54 9 2494 02-7920',
    email: 'Lascalandrias123@gmail.com',
    address: 'Ronca-Hue 50, B7000 Tandil, Provincia de Buenos Aires',
    checkinTime: '15:00',
    checkoutTime: '11:00',
}

describe('siteSettingsSchema', () => {
    it('acepta un patch válido', () => {
        expect(siteSettingsSchema.safeParse(validPatch).success).toBe(true)
    })

    it('acepta bookingsEnabled true', () => {
        expect(siteSettingsSchema.safeParse({ ...validPatch, bookingsEnabled: true }).success).toBe(true)
    })

    it('rechaza un email inválido', () => {
        expect(siteSettingsSchema.safeParse({ ...validPatch, email: 'no-es-email' }).success).toBe(false)
    })

    it('rechaza whatsapp vacío', () => {
        expect(siteSettingsSchema.safeParse({ ...validPatch, whatsapp: '' }).success).toBe(false)
    })

    it('rechaza whatsapp con caracteres no numéricos', () => {
        expect(siteSettingsSchema.safeParse({ ...validPatch, whatsapp: '+54 9 2494' }).success).toBe(false)
    })

    it('rechaza dirección vacía', () => {
        expect(siteSettingsSchema.safeParse({ ...validPatch, address: '   ' }).success).toBe(false)
    })

    it('rechaza un horario mal formado', () => {
        expect(siteSettingsSchema.safeParse({ ...validPatch, checkinTime: '25:99' }).success).toBe(false)
    })

    it('rechaza bookingsEnabled no booleano', () => {
        expect(siteSettingsSchema.safeParse({ ...validPatch, bookingsEnabled: 'yes' }).success).toBe(false)
    })
})
