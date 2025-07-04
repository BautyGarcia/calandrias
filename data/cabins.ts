// Tipo local para los datos de cabañas existentes
export interface CabinFeature {
    icon: string; // String identifier for icon
    label: string;
}

export interface Cabin {
    id: number;
    slug: string;
    name: string;
    subtitle: string;
    description: string;
    price: string;
    capacity: string;
    bedrooms: string;
    bathrooms: string;
    image: string;
    features: CabinFeature[];
    highlights: string[];
}

export const cabinsData: Cabin[] = [
    {
        id: 1,
        slug: "refugio-intimo",
        name: "Cabaña 1",
        subtitle: "Refugio Íntimo",
        description: "Perfecta para parejas que buscan una escapada romántica en medio de la naturaleza.",
        price: "12,000",
        capacity: "2 huéspedes",
        bedrooms: "1 dormitorio",
        bathrooms: "1 baño",
        image: "/cabin1.jpg",
        features: [
            { icon: "Mountain", label: "Vista panorámica" },
            { icon: "Flame", label: "Chimenea interior" },
            { icon: "Wifi", label: "WiFi gratuito" },
            { icon: "Car", label: "Estacionamiento" }
        ],
        highlights: ["Vista a las montañas", "Chimenea romántica", "Terraza privada", "Cocina equipada"]
    },
    {
        id: 2,
        slug: "confort-familiar",
        name: "Cabaña 2",
        subtitle: "Confort Familiar",
        description: "Ideal para familias pequeñas que desean comodidad y aventura en un solo lugar.",
        price: "18,000",
        capacity: "4 huéspedes",
        bedrooms: "2 dormitorios",
        bathrooms: "2 baños",
        image: "/cabin2.jpg",
        features: [
            { icon: "Tv", label: "Entretenimiento" },
            { icon: "Snowflake", label: "Aire acondicionado" },
            { icon: "ChefHat", label: "Cocina completa" },
            { icon: "Flame", label: "Parrilla exterior" }
        ],
        highlights: ["Zona de juegos", "Cocina amplia", "Terraza con parrilla", "Área de descanso"]
    },
    {
        id: 3,
        slug: "experiencia-premium",
        name: "Cabaña 3",
        subtitle: "Experiencia Premium",
        description: "Lujo y naturaleza se combinan para ofrecer una experiencia inolvidable.",
        price: "25,000",
        capacity: "6 huéspedes",
        bedrooms: "3 dormitorios",
        bathrooms: "2 baños",
        image: "/cabin3.jpg",
        features: [
            { icon: "Waves", label: "Pileta privada" },
            { icon: "TreePine", label: "Zona de fogatas" },
            { icon: "Shield", label: "Seguridad 24/7" },
            { icon: "Utensils", label: "Comedor exterior" }
        ],
        highlights: ["Pileta climatizada", "Jacuzzi", "Vista panorámica", "Zona de barbacoa"]
    },
    {
        id: 4,
        slug: "retiro-exclusivo",
        name: "Cabaña 4",
        subtitle: "Retiro Exclusivo",
        description: "La experiencia más completa para grupos que buscan privacidad y lujo absoluto.",
        price: "35,000",
        capacity: "8 huéspedes",
        bedrooms: "4 dormitorios",
        bathrooms: "3 baños",
        image: "/cabin4.jpg",
        features: [
            { icon: "Mountain", label: "Vista 360°" },
            { icon: "Waves", label: "Pileta infinity" },
            { icon: "Flame", label: "Múltiples chimeneas" },
            { icon: "Car", label: "Garaje privado" }
        ],
        highlights: ["Pileta infinity", "Spa privado", "Sala de estar amplia", "Cocina gourmet"]
    }
]

// Función helper para obtener una cabaña por slug
export function getCabinBySlug(slug: string): Cabin | undefined {
    return cabinsData.find(cabin => cabin.slug === slug)
}

// Función helper para obtener todos los slugs
export function getAllCabinSlugs(): string[] {
    return cabinsData.map(cabin => cabin.slug)
} 