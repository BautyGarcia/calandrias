import {
    Mountain,
    Waves,
    Flame,
    Car,
    Wifi,
    ChefHat,
    TreePine,
    Utensils,
    LucideIcon
} from "lucide-react"
import { CabinFeatureIcon } from "@/types/cabin"

// Icon mapping from CabinFeatureIcon to Lucide components
export const CABIN_FEATURE_ICONS: Record<CabinFeatureIcon, LucideIcon> = {
    Mountain,
    Waves,
    Flame,
    Car,
    Wifi,
    ChefHat,
    TreePine,
    Utensils
}

// Component to render icon by CabinFeatureIcon identifier
interface CabinIconProps {
    name: CabinFeatureIcon
    className?: string
    size?: number
}

export function CabinIcon({ name, className, size }: CabinIconProps) {
    const IconComponent = CABIN_FEATURE_ICONS[name]
    
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in CABIN_FEATURE_ICONS map`)
        return null
    }
    
    return <IconComponent className={className} size={size} />
}

// Utility function to get cabin feature icon component by name
export function getCabinFeatureIcon(name: CabinFeatureIcon): LucideIcon | null {
    return CABIN_FEATURE_ICONS[name] || null
}

// Legacy support - Component to render icon by string identifier
interface IconProps {
    name: string
    className?: string
    size?: number
}

export function Icon({ name, className, size }: IconProps) {
    const IconComponent = CABIN_FEATURE_ICONS[name as CabinFeatureIcon]
    
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in icon map`)
        return null
    }
    
    return <IconComponent className={className} size={size} />
}

// Utility function to get icon component by name (legacy)
export function getIcon(name: string): LucideIcon | null {
    return CABIN_FEATURE_ICONS[name as CabinFeatureIcon] || null
}

export default Icon 