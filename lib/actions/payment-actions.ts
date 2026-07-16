"use server";

import { redirect } from 'next/navigation';
import { paymentApi } from '@/lib/mercadopago';
import { checkDateAvailability } from '@/lib/db/reservations';
import type { ReservationPaymentData } from '@/types/payment';

/**
 * Server Action: Procesar pago desde datos ya preparados (formulario de reservas).
 *
 * No crea la reserva todavía: revalida disponibilidad contra Supabase y, si las
 * fechas siguen libres, genera la preferencia de MercadoPago. La reserva se crea
 * recién en el webhook, cuando el pago queda aprobado (así no se ocupan fechas
 * por pagos que nunca se concretan).
 */
export async function processReservationPaymentDirect(
    paymentData: ReservationPaymentData
): Promise<never> {
    try {
        // Revalidar disponibilidad antes de mandar al checkout.
        // `cabinId` es el slug de la cabaña.
        const availability = await checkDateAvailability(
            paymentData.cabinId,
            paymentData.checkIn,
            paymentData.checkOut,
        );

        if (!availability.isAvailable) {
            throw new Error('Las fechas seleccionadas ya no están disponibles. Por favor, selecciona otras fechas.');
        }

        // El precio ya viene calculado con descuentos desde CabinCalendarSection;
        // no se recalcula acá para evitar doble aplicación de descuentos.
        const checkoutUrl = await paymentApi.createReservationPreference(paymentData);
        redirect(checkoutUrl);

    } catch (error) {
        // Re-lanzar el redirect interno de Next.js.
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        console.error('Error processing direct reservation payment:', error);
        redirect('/reserva-fallida?error=availability_check_failed');
    }
}
