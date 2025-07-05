export interface CabinConfig {
  id: string
  slug: string
  name: string
  displayName: string
  capacity: number
  color: string
  icalUrl?: string
}

export const CABIN_CONFIGS: CabinConfig[] = [
  {
    id: 'refugio-intimo',
    slug: 'refugio-intimo',
    name: 'Refugio Íntimo',
    displayName: 'Refugio Íntimo',
    capacity: 2,
    color: '#22c55e', // green-500
    icalUrl: process.env.AIRBNB_REFUGIO_INTIMO_ICAL
  },
  {
    id: 'confort-familiar',
    slug: 'confort-familiar',
    name: 'Confort Familiar',
    displayName: 'Confort Familiar',
    capacity: 4,
    color: '#3b82f6', // blue-500
    icalUrl: process.env.AIRBNB_CONFORT_FAMILIAR_ICAL
  },
  {
    id: 'experiencia-premium',
    slug: 'experiencia-premium',
    name: 'Experiencia Premium',
    displayName: 'Experiencia Premium',
    capacity: 6,
    color: '#f59e0b', // amber-500
    icalUrl: process.env.AIRBNB_EXPERIENCIA_PREMIUM_ICAL
  },
  {
    id: 'retiro-exclusivo',
    slug: 'retiro-exclusivo',
    name: 'Retiro Exclusivo',
    displayName: 'Retiro Exclusivo',
    capacity: 8,
    color: '#8b5cf6', // violet-500
    icalUrl: process.env.AIRBNB_RETIRO_EXCLUSIVO_ICAL
  }
]

// Funciones utilitarias
export function getCabinConfig(idOrSlug: string): CabinConfig | undefined {
  return CABIN_CONFIGS.find(cabin => 
    cabin.id === idOrSlug || cabin.slug === idOrSlug
  )
}

export function getCabinDisplayName(idOrSlug: string): string {
  const cabin = getCabinConfig(idOrSlug)
  return cabin?.displayName || idOrSlug
}

export function getCabinICalUrl(idOrSlug: string): string | undefined {
  const cabin = getCabinConfig(idOrSlug)
  return cabin?.icalUrl
}

export function getAllCabinIds(): string[] {
  return CABIN_CONFIGS.map(cabin => cabin.id)
}

export function getAllCabinSlugs(): string[] {
  return CABIN_CONFIGS.map(cabin => cabin.slug)
}

// Crear objetos de mapeo para compatibilidad con código existente
export const CABIN_NAMES: Record<string, string> = CABIN_CONFIGS.reduce((acc, cabin) => {
  acc[cabin.id] = cabin.displayName
  return acc
}, {} as Record<string, string>)

export const CABIN_ICAL_URLS: Record<string, string> = CABIN_CONFIGS.reduce((acc, cabin) => {
  if (cabin.icalUrl) {
    acc[cabin.id] = cabin.icalUrl
  }
  return acc
}, {} as Record<string, string>)

// Configuración para Airbnb sync
export const AIRBNB_CABIN_CONFIG = CABIN_CONFIGS.reduce((acc, cabin) => {
  acc[cabin.id] = {
    name: cabin.displayName,
    icalUrl: cabin.icalUrl || ''
  }
  return acc
}, {} as Record<string, { name: string; icalUrl: string }>) 