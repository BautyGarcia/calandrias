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
    id: 'retiro-exclusivo',
    slug: 'retiro-exclusivo',
    name: 'Retiro Exclusivo',
    displayName: 'Retiro Exclusivo',
    capacity: 8,
    color: '#8b5cf6', // violet-500
    icalUrl: process.env.AIRBNB_RETIRO_EXCLUSIVO_ICAL
  },
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

// Mapeo dinámico de URLs de iCal a cabinIds
// Esto permite que cada URL de Airbnb se mapee a una cabaña específica
export const AIRBNB_URL_TO_CABIN_MAPPING: Record<string, string> = {
  // Mapeo por URL exacta de iCal
  [process.env.AIRBNB_RETIRO_EXCLUSIVO_ICAL || '']: 'retiro-exclusivo',
  [process.env.AIRBNB_REFUGIO_INTIMO_ICAL || '']: 'refugio-intimo',
  [process.env.AIRBNB_CONFORT_FAMILIAR_ICAL || '']: 'confort-familiar',
  [process.env.AIRBNB_EXPERIENCIA_PREMIUM_ICAL || '']: 'experiencia-premium',
}

// Función para obtener cabinId por URL de iCal
export function getCabinIdByICalUrl(icalUrl: string): string | undefined {
  return AIRBNB_URL_TO_CABIN_MAPPING[icalUrl]
}

// Función para obtener todas las URLs de iCal configuradas
export function getConfiguredICalUrls(): string[] {
  return Object.keys(AIRBNB_URL_TO_CABIN_MAPPING).filter(url => url !== '')
}

// Función para obtener configuración de Airbnb por URL
export function getAirbnbConfigByUrl(icalUrl: string): { cabinId: string; name: string } | undefined {
  const cabinId = getCabinIdByICalUrl(icalUrl)
  if (!cabinId) return undefined
  
  const cabin = getCabinConfig(cabinId)
  if (!cabin) return undefined
  
  return {
    cabinId,
    name: cabin.displayName
  }
}

// Función para agregar una nueva URL de iCal al mapeo
export function addICalUrlMapping(icalUrl: string, cabinId: string): void {
  if (icalUrl && cabinId) {
    AIRBNB_URL_TO_CABIN_MAPPING[icalUrl] = cabinId
  }
}

// Función para remover una URL de iCal del mapeo
export function removeICalUrlMapping(icalUrl: string): void {
  delete AIRBNB_URL_TO_CABIN_MAPPING[icalUrl]
}

// Función para obtener todas las configuraciones de Airbnb
export function getAllAirbnbConfigurations(): Array<{
  cabinId: string
  cabinName: string
  icalUrl: string
}> {
  return getConfiguredICalUrls().map(icalUrl => {
    const config = getAirbnbConfigByUrl(icalUrl)
    return {
      cabinId: config?.cabinId || 'unknown',
      cabinName: config?.name || 'Unknown Cabin',
      icalUrl
    }
  })
}

// Función para validar que todas las URLs están configuradas correctamente
export function validateAirbnbConfigurations(): Array<{
  cabinId: string
  cabinName: string
  icalUrl: string
  isValid: boolean
  error?: string
}> {
  return getConfiguredICalUrls().map(icalUrl => {
    const config = getAirbnbConfigByUrl(icalUrl)
    
    if (!config) {
      return {
        cabinId: 'unknown',
        cabinName: 'Unknown Cabin',
        icalUrl,
        isValid: false,
        error: 'Cabin configuration not found'
      }
    }
    
    const cabin = getCabinConfig(config.cabinId)
    if (!cabin) {
      return {
        cabinId: config.cabinId,
        cabinName: config.name,
        icalUrl,
        isValid: false,
        error: 'Cabin not found in configuration'
      }
    }
    
    return {
      cabinId: config.cabinId,
      cabinName: config.name,
      icalUrl,
      isValid: true
    }
  })
} 