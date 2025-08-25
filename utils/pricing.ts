import { PricingBreakdown } from '@/types/pricing';

/**
 * Calcula el precio total con descuento del 15% para días de semana (Lunes-Jueves)
 * @param pricePerNight Precio base por noche
 * @param checkIn Fecha de check-in
 * @param checkOut Fecha de check-out
 * @returns Desglose completo de precios con descuentos aplicados
 */
export function calculatePriceWithWeekdayDiscount(
  pricePerNight: number,
  checkIn: Date,
  checkOut: Date
): PricingBreakdown {
  const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  let weekdayNights = 0;
  let weekendNights = 0;
  
  // Iterar por cada noche para determinar si es día de semana o fin de semana
  const currentDate = new Date(checkIn);
  for (let i = 0; i < totalNights; i++) {
    const dayOfWeek = currentDate.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    
    // Días de semana con descuento: Lunes (1), Martes (2), Miércoles (3), Jueves (4)
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      weekdayNights++;
    } else {
      weekendNights++;
    }
    
    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calcular precios
  const weekdayPrice = pricePerNight * 0.85; // 15% de descuento
  const weekendPrice = pricePerNight; // Precio completo
  
  const weekdayTotal = weekdayNights * weekdayPrice;
  const weekendTotal = weekendNights * weekendPrice;
  const finalPrice = weekdayTotal + weekendTotal;
  
  const basePrice = totalNights * pricePerNight;
  const weekdayDiscount = (weekdayNights * pricePerNight) - weekdayTotal;
  const hasDiscount = weekdayNights > 0;
  
  return {
    totalNights,
    weekdayNights,
    weekendNights,
    basePrice,
    weekdayDiscount,
    finalPrice,
    hasDiscount,
    pricePerNight
  };
}

/**
 * Formatea el precio en pesos argentinos
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Calcula el porcentaje de descuento aplicado
 */
export function calculateDiscountPercentage(basePrice: number, finalPrice: number): number {
  if (basePrice === 0) return 0;
  return Math.round(((basePrice - finalPrice) / basePrice) * 100);
}
