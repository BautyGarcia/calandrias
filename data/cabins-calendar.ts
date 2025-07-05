import { CabinInfo } from '@/types/calendar'
import { CABIN_CONFIGS } from '@/utils/cabins'

// Exportar CALENDAR_CABINS basado en la configuración centralizada
export const CALENDAR_CABINS: CabinInfo[] = CABIN_CONFIGS.map(cabin => ({
  id: cabin.id,
  name: cabin.name,
  slug: cabin.slug,
  capacity: cabin.capacity,
  color: cabin.color
})) 