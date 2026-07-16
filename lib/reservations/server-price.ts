import type { Cabin } from '@/types/cabin'
import { calculatePriceForDateRange } from '@/utils/pricing'

// Parsea un string YYYY-MM-DD a un Date LOCAL (sin corrimiento de día por UTC),
// igual que `createDateFromString` de utils/calendar.ts (construcción de 3 args).
// NO usar `new Date('YYYY-MM-DD')`: eso interpreta la fecha como UTC y corre el
// día en zonas horarias negativas (UTC-3), rompiendo el cálculo de noches.
export function createLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

/**
 * Precio AUTORITATIVO del lado del servidor para un rango de fechas.
 *
 * Se calcula SIEMPRE desde el precio base de la cabaña (nunca desde un monto que
 * mande el cliente), por lo que no duplica descuentos: `calculatePriceForDateRange`
 * parte del precio base y aplica los descuentos de día de semana / overrides.
 *
 * Devuelve el total (`finalPrice`) y el promedio por noche (`pricePerNight`) para
 * poder sobrescribir tanto el `unit_price` como el metadata de la preferencia.
 */
export function computeServerReservationPrice(
    cabin: Cabin,
    checkIn: string,
    checkOut: string,
): { finalPrice: number; pricePerNight: number } {
    const breakdown = calculatePriceForDateRange(
        cabin,
        createLocalDate(checkIn),
        createLocalDate(checkOut),
    )
    return {
        finalPrice: breakdown.finalPrice,
        pricePerNight: breakdown.averagePricePerNight,
    }
}
