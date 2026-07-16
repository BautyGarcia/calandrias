"use server";

import { redirect } from 'next/navigation';
import { paymentApi } from '@/lib/mercadopago';
import { checkDateAvailability } from '@/lib/db/reservations';
import { getSiteSettings } from '@/lib/db/content';
import { getCabinBySlug } from '@/lib/db/cabins';
import { computeServerReservationPrice } from '@/lib/reservations/server-price';
import type { ReservationPaymentData } from '@/types/payment';

/**
 * Server Action: Procesar pago desde datos ya preparados (formulario de reservas).
 *
 * No crea la reserva todavía: revalida disponibilidad contra Supabase y, si las
 * fechas siguen libres, genera la preferencia de MercadoPago. La reserva se crea
 * recién en el webhook, cuando el pago queda aprobado (así no se ocupan fechas
 * por pagos que nunca se concretan).
 *
 * SEGURIDAD (este es el único entrypoint vivo de reservas de la UI):
 *  - Gatea el switch `bookingsEnabled` ANTES de cualquier otra cosa: el cliente
 *    NO puede iniciar un checkout si las reservas online están apagadas.
 *  - Recalcula el precio EN EL SERVIDOR desde el precio base de la cabaña e ignora
 *    por completo el monto que venga del cliente (`paymentData.totalAmount`), que
 *    es manipulable. El monto server-side es el que viaja a MercadoPago como
 *    `unit_price` y en el metadata; el webhook luego persiste
 *    `transaction_amount` (lo realmente cobrado), así que la cadena queda correcta.
 */
export async function processReservationPaymentDirect(
    paymentData: ReservationPaymentData
): Promise<never> {
    try {
        // 1. Gate del switch de reservas online. SIEMPRE primero: si está apagado,
        //    no se calcula precio, no se consulta disponibilidad y no se crea
        //    preferencia. El cliente no puede saltear esto.
        const settings = await getSiteSettings();
        if (!settings.bookingsEnabled) {
            redirect('/reserva-fallida?error=bookings_disabled');
        }

        // 2. Resolver la cabaña por slug y recalcular el precio en el servidor.
        //    `cabinId` es el slug de la cabaña.
        const cabin = await getCabinBySlug(paymentData.cabinId);
        if (!cabin) {
            redirect('/reserva-fallida?error=cabin_not_found');
        }

        // Precio autoritativo: se ignora `paymentData.totalAmount` del cliente.
        const { finalPrice, pricePerNight } = computeServerReservationPrice(
            cabin,
            paymentData.checkIn,
            paymentData.checkOut,
        );

        // 3. Revalidar disponibilidad antes de mandar al checkout.
        const availability = await checkDateAvailability(
            paymentData.cabinId,
            paymentData.checkIn,
            paymentData.checkOut,
        );

        if (!availability.isAvailable) {
            throw new Error('Las fechas seleccionadas ya no están disponibles. Por favor, selecciona otras fechas.');
        }

        // 4. Construir los datos de pago con el monto calculado en el servidor.
        //    Se sobreescriben `totalAmount` y `pricePerNight` (también van al
        //    metadata de la preferencia). El monto del cliente queda descartado.
        const serverPaymentData: ReservationPaymentData = {
            ...paymentData,
            totalAmount: finalPrice,
            pricePerNight,
        };

        const checkoutUrl = await paymentApi.createReservationPreference(serverPaymentData);
        redirect(checkoutUrl);

    } catch (error) {
        // Re-lanzar el redirect interno de Next.js (incluye los redirects de
        // bookings_disabled / cabin_not_found lanzados arriba).
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }

        console.error('Error processing direct reservation payment:', error);
        redirect('/reserva-fallida?error=availability_check_failed');
    }
}
