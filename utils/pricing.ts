import { PricingBreakdown } from '@/types/pricing';
import { Cabin, Month, getPrecioParaMes } from '@/types/cabin';

// Mapeo de número de mes a nombre en español
const MONTH_NAMES: Month[] = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

/**
 * Obtiene el mes en español desde un Date
 */
function getMonthName(date: Date): Month {
  return MONTH_NAMES[date.getMonth()];
}

/**
 * @deprecated - Usar calculatePriceForDateRange con Cabin object instead
 * Calcula el precio total con descuento del 15% para días de semana (Lunes-Jueves)
 * @param pricePerNight Precio base por noche
 * @param checkIn Fecha de check-in
 * @param checkOut Fecha de check-out
 * @returns Desglose completo de precios con descuentos aplicados
 */
export function calculatePriceWithWeekdayDiscount(
  pricePerNight: number,
  checkIn: Date,
  checkOut: Date,
  discountPercentage: number = 0.15
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
  const weekdayPrice = pricePerNight * (1 - discountPercentage);
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
 * Calcula el precio para un rango de fechas considerando overrides mensuales
 * @param cabin Datos de la cabaña desde Strapi
 * @param checkIn Fecha de check-in
 * @param checkOut Fecha de check-out
 * @returns Desglose completo de precios con descuentos y overrides aplicados
 */
export function calculatePriceForDateRange(
  cabin: Cabin,
  checkIn: Date,
  checkOut: Date
): PricingBreakdown & {
  nightlyPrices: Array<{
    date: Date;
    price: number;
    isWeekday: boolean;
    discount: number;
    month: Month;
  }>;
  averagePricePerNight: number;
} {
  const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  let weekdayNights = 0;
  let weekendNights = 0;
  let totalBeforeDiscount = 0;
  let totalAfterDiscount = 0;

  const nightlyPrices: Array<{
    date: Date;
    price: number;
    isWeekday: boolean;
    discount: number;
    month: Month;
  }> = [];

  // Iterar por cada noche
  const currentDate = new Date(checkIn);
  for (let i = 0; i < totalNights; i++) {
    const dayOfWeek = currentDate.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 4;
    const monthName = getMonthName(currentDate);

    // Obtener precio y descuento para este mes
    const { precio, descuento_dia_semana } = getPrecioParaMes(cabin, monthName);

    // Calcular precio de esta noche (descuento viene como porcentaje: 10, 15, etc.)
    const nightPrice = isWeekday ? precio * (1 - (descuento_dia_semana / 100)) : precio;
    const discount = isWeekday ? precio * (descuento_dia_semana / 100) : 0;

    nightlyPrices.push({
      date: new Date(currentDate),
      price: nightPrice,
      isWeekday,
      discount,
      month: monthName
    });

    totalBeforeDiscount += precio;
    totalAfterDiscount += nightPrice;

    if (isWeekday) {
      weekdayNights++;
    } else {
      weekendNights++;
    }

    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const weekdayDiscount = totalBeforeDiscount - totalAfterDiscount;
  const hasDiscount = weekdayDiscount > 0;
  const averagePricePerNight = totalNights > 0 ? totalAfterDiscount / totalNights : 0;

  return {
    totalNights,
    weekdayNights,
    weekendNights,
    basePrice: totalBeforeDiscount,
    weekdayDiscount,
    finalPrice: totalAfterDiscount,
    hasDiscount,
    pricePerNight: averagePricePerNight,
    nightlyPrices,
    averagePricePerNight
  };
}

/**
 * Obtiene el precio mínimo de una cabaña considerando todos los meses
 * Útil para mostrar "desde: $X" en las cards
 * @param cabin Datos de la cabaña desde Strapi
 * @returns Precio mínimo por noche (ya con descuento de día de semana aplicado)
 */
export function getMinimumPrice(cabin: Cabin): number {
  let minPrice = cabin.precio_base_noche;

  // Revisar overrides mensuales
  if (cabin.overrides_mensuales && cabin.overrides_mensuales.length > 0) {
    cabin.overrides_mensuales.forEach(override => {
      if (override.precio_override !== undefined && override.precio_override < minPrice) {
        minPrice = override.precio_override;
      }
    });
  }

  // Aplicar el mejor descuento de día de semana posible (descuento viene como porcentaje: 10, 15, etc.)
  let maxDiscount = cabin.descuento_dia_semana_default;

  if (cabin.overrides_mensuales && cabin.overrides_mensuales.length > 0) {
    cabin.overrides_mensuales.forEach(override => {
      if (override.descuento_dia_semana_override !== undefined &&
        override.descuento_dia_semana_override > maxDiscount) {
        maxDiscount = override.descuento_dia_semana_override;
      }
    });
  }

  // Retornar el precio mínimo con el máximo descuento aplicado (convertir porcentaje a decimal)
  return minPrice * (1 - (maxDiscount / 100));
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
