import {
    Mountain,
    Tv,
    Snowflake,
    Flame,
    Shield,
    Wifi,
    ChefHat,
    Car,
    Waves,
    TreePine,
    Utensils,
    LucideIcon
} from "lucide-react"

// Icon mapping from string identifiers to actual components
const iconMap: Record<string, LucideIcon> = {
    Mountain,
    Tv,
    Snowflake,
    Flame,
    Shield,
    Wifi,
    ChefHat,
    Car,
    Waves,
    TreePine,
    Utensils
}

// Component to render icon by string identifier
interface IconProps {
    name: string
    className?: string
    size?: number
}

export function Icon({ name, className, size }: IconProps) {
    const IconComponent = iconMap[name]
    
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in icon map`)
        return null
    }
    
    return <IconComponent className={className} size={size} />
}

// Utility function to get icon component by name
export function getIcon(name: string): LucideIcon | null {
    return iconMap[name] || null
}

export default Icon 