// Imagen mínima: sólo lo que la app consume (antes StrapiMedia)
export interface CabinImage {
  url: string;
  alternativeText?: string | null;
}

// Iconos disponibles para features
export type CabinFeatureIcon = 
  | "Mountain" 
  | "Waves" 
  | "Flame" 
  | "Car" 
  | "Wifi" 
  | "ChefHat" 
  | "TreePine" 
  | "Utensils";

export interface CabinFeature {
  id: number;
  icon: CabinFeatureIcon;
  label: string;
}

export interface CabinAmenities {
  id: number;
  kitchen: boolean;
  air_conditioning: string;
  pool_shared: boolean;
}

export interface CabinRating {
  id: number;
  score: number;
  review_count: number;
}

export type Month = 
  | "enero"
  | "febrero"
  | "marzo"
  | "abril"
  | "mayo"
  | "junio"
  | "julio"
  | "agosto"
  | "septiembre"
  | "octubre"
  | "noviembre"
  | "diciembre";

export interface CabinPricingOverride {
  id: number;
  mes: Month;
  precio_override?: number;
  descuento_dia_semana_override?: number;
}

export interface Cabin {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  setting: string;
  capacity: string;
  bedrooms: string;
  bathrooms: string;
  image: CabinImage;
  thumbnail: CabinImage;
  features: CabinFeature[];
  highlights: string[];
  amenities: CabinAmenities;
  rating: CabinRating;
  nearby_attractions: string[];
  precio_base_noche: number;
  descuento_dia_semana_default: number;
  overrides_mensuales: CabinPricingOverride[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  // Campo privado para sincronización con Airbnb (solo backend)
  airbnb_ical_url?: string;
}

// Helper para calcular precio de un mes específico
export function getPrecioParaMes(cabin: Cabin, mes: Month): {
  precio: number;
  descuento_dia_semana: number;
} {
  const override = cabin.overrides_mensuales.find(o => o.mes === mes);
  
  return {
    precio: override?.precio_override ?? cabin.precio_base_noche,
    descuento_dia_semana: override?.descuento_dia_semana_override ?? cabin.descuento_dia_semana_default
  };
}
