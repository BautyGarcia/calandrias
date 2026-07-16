import { z } from 'zod'

// ---------------------------------------------------------------
// Schema de la configuración editable del sitio (site_settings).
// Vive fuera de la server action ('use server' sólo puede exportar
// funciones async) para poder reusarlo y testearlo.
// ---------------------------------------------------------------

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const siteSettingsSchema = z.object({
    // Interruptor maestro del flujo de reservas online.
    bookingsEnabled: z.boolean(),
    // Número de WhatsApp usado en toda la web (links wa.me): sólo dígitos,
    // con código de país y sin el signo "+".
    whatsapp: z
        .string()
        .trim()
        .min(1, 'Ingresá el número de WhatsApp')
        .regex(/^\d+$/, 'El WhatsApp debe contener sólo números (código de país incluido, sin +)'),
    phone: z.string().trim().min(1, 'Ingresá el teléfono de contacto'),
    email: z.string().trim().min(1, 'Ingresá el email de contacto').email('El email no es válido'),
    address: z.string().trim().min(1, 'Ingresá la dirección'),
    checkinTime: z.string().trim().regex(timeRegex, 'Horario de check-in inválido (usá HH:MM)'),
    checkoutTime: z.string().trim().regex(timeRegex, 'Horario de check-out inválido (usá HH:MM)'),
})

export type SiteSettingsPatch = z.infer<typeof siteSettingsSchema>
