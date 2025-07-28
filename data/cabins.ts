// Tipo local para los datos de cabañas existentes
export interface CabinFeature {
    icon: string; // String identifier for icon
    label: string;
}

export interface CabinCapacity {
    max_guests: number;
    bedrooms: number;
    bathrooms: number;
}

export interface CabinAmenities {
    kitchen: boolean;
    linens: boolean;
    wood_stove: boolean;
    air_conditioning: string;
    pool_shared: boolean;
    garden: boolean;
    barbecue: boolean;
    game_zone: boolean;
    pets_allowed: boolean;
}

export interface CabinRating {
    score: number;
    review_count: number;
}

export interface Cabin {
    id: number;
    slug: string;
    name: string;
    subtitle: string;
    description: string;
    setting: string; // Descripción del entorno
    price: string;
    capacity: string;
    bedrooms: string;
    bathrooms: string;
    image: string;
    thumbnail: string; // Imagen de portada
    features: CabinFeature[];
    highlights: string[];
    // Nueva información detallada
    detailed_capacity: CabinCapacity;
    amenities: CabinAmenities;
    rating: CabinRating;
    nearby_attractions: string[];
}

export const cabinsData: Cabin[] = [
    {
        id: 1,
        slug: "retiro-exclusivo",
        name: "Las Calandrias de Tandil 1",
        subtitle: "Retiro Exclusivo",
        description: "Cabaña entera rodeada de naturaleza en entorno tranquilo con parque compartido, fogón y zona de relax perfecta para parejas o familias pequeñas.",
        setting: "Cálida y funcional, la Cabaña 1 ofrece un espacio ideal para descansar en pareja o en familia. Cuenta con cocina equipada, ropa blanca, estufa a leña y aire acondicionado frío/calor. Rodeada de naturaleza y con acceso a un parque compartido con fogón y zona de relax. A pocos minutos del centro de Tandil, combina comodidad y tranquilidad en un entorno natural.",
        price: "100",
        capacity: "4 huéspedes",
        bedrooms: "1 dormitorio",
        bathrooms: "1 baño",
        image: "/cabin4.jpg",
        thumbnail: "/cabins/cab4/thumbnail.jpg", // Imagen de portada
        features: [
            { icon: "Mountain", label: "Vista a las sierras" },
            { icon: "Waves", label: "Pileta compartida" },
            { icon: "Flame", label: "Fogón" },
            { icon: "Car", label: "Estacionamiento" },
            { icon: "Wifi", label: "WiFi gratuito" },
            { icon: "ChefHat", label: "Cocina equipada" },
            { icon: "TreePine", label: "Parque y jardín" },
            { icon: "Utensils", label: "Parrilla" }
        ],
        highlights: [
            "Fogón", 
            "Pileta compartida", 
            "Zona de juegos", 
            "Admite mascotas",
            "Aire frío/calor",
            "Parque compartido"
        ],
        // Nueva información detallada de Airbnb
        detailed_capacity: {
            max_guests: 4,
            bedrooms: 1,
            bathrooms: 1
        },
        amenities: {
            kitchen: true,
            linens: true,
            wood_stove: true,
            air_conditioning: "frío/calor",
            pool_shared: true,
            garden: true,
            barbecue: true,
            game_zone: true,
            pets_allowed: true
        },
        rating: {
            score: 5.0,
            review_count: 3
        },
        nearby_attractions: [
            "Piedra Movediza",
            "Parque Independencia"
        ]
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