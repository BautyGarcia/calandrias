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
    },
    {
        id: 2,
        slug: "confort-familiar",
        name: "Las Calandrias de Tandil 4",
        subtitle: "Confort Familiar",
        description: "Espaciosa y confortable, la Cabaña 4 se destaca por sus dos habitaciones y dos baños completos, ideal para familias o grupos que buscan comodidad.",
        setting: "Espaciosa y confortable, la Cabaña 4 se destaca por sus dos habitaciones y dos baños completos, ideal para familias o grupos que buscan comodidad. Su estufa salamandra aporta calidez y un ambiente acogedor. Cuenta con cocina equipada, ropa blanca, aire frío/calor y acceso a parque compartido con fogón y sector de descanso. Todo pensado para disfrutar de la tranquilidad de Tandil.",
        price: "150",
        capacity: "6 huéspedes",
        bedrooms: "2 dormitorios",
        bathrooms: "2 baños",
        image: "/cabin1.jpg",
        thumbnail: "/cabins/cab1/thumbnail.jpg",
        features: [
            { icon: "Mountain", label: "Vista a las montañas" },
            { icon: "ChefHat", label: "Cocina equipada" },
            { icon: "Wifi", label: "WiFi gratuito" },
            { icon: "Car", label: "Estacionamiento gratis" },
            { icon: "Waves", label: "Pileta compartida" },
            { icon: "Flame", label: "Chimenea interior" },
            { icon: "Utensils", label: "Parrilla" },
            { icon: "TreePine", label: "Zona para comer al aire libre" }
        ],
        highlights: [
            "2 dormitorios",
            "2 baños completos",
            "Chimenea salamandra",
            "Pileta compartida",
            "Aire frío/calor",
            "Parque compartido"
        ],
        detailed_capacity: {
            max_guests: 6,
            bedrooms: 2,
            bathrooms: 2
        },
        amenities: {
            kitchen: true,
            linens: true,
            wood_stove: true,
            air_conditioning: "frío/calor",
            pool_shared: true,
            garden: true,
            barbecue: true,
            game_zone: false,
            pets_allowed: true
        },
        rating: {
            score: 5.0,
            review_count: 1
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