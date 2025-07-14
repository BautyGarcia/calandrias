import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type {
    PaymentPreferenceBody,
    ReservationPaymentData,
    PaymentData,
    PaymentStatus
} from '@/types/payment';

// Configuración de MercadoPago
const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN is not configured in environment variables');
}



const mercadopago = new MercadoPagoConfig({
    accessToken: accessToken,
    options: {
        timeout: 5000,
        idempotencyKey: 'any_idempotency_key',
    }
});

export const paymentApi = {
    // Crear preferencia de pago para reserva
    async createReservationPreference(reservationData: ReservationPaymentData): Promise<string> {
        const preference = new Preference(mercadopago);

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const preferenceBody: PaymentPreferenceBody = {
            items: [{
                id: `reservation-${reservationData.cabinId}`,
                title: `Reserva ${reservationData.cabinName}`,
                description: `Del ${reservationData.checkIn} al ${reservationData.checkOut} - ${reservationData.adults} huéspedes`,
                quantity: 1,
                unit_price: reservationData.totalAmount,
                currency_id: 'ARS',
            }],
            payer: {
                email: reservationData.guestEmail,
                name: reservationData.guestName.split(' ')[0] || 'Test',
                surname: reservationData.guestName.split(' ').slice(1).join(' ') || 'User',
            },
            back_urls: {
                success: `${baseUrl}/reserva-confirmada`,
                failure: `${baseUrl}/reserva-fallida`,
                pending: `${baseUrl}/reserva-pendiente`,
            },
            payment_methods: {
                installments: 12, // Hasta 12 cuotas
                excluded_payment_types: [],
                excluded_payment_methods: [],
            },
            notification_url: `${baseUrl}/api/payments/webhook`,
            external_reference: reservationData.reservationId || `temp-${Date.now()}`,
            metadata: {
                // Toda la información de la reserva en metadata
                reservationId: reservationData.reservationId,
                cabinId: reservationData.cabinId,
                cabinName: reservationData.cabinName,
                guestName: reservationData.guestName,
                guestEmail: reservationData.guestEmail,
                checkIn: reservationData.checkIn,
                checkOut: reservationData.checkOut,
                adults: reservationData.adults,
                children: reservationData.children,
                pets: reservationData.pets,
                totalAmount: reservationData.totalAmount,
                specialRequests: reservationData.specialRequests,
            },
        };

        try {
            const result = await preference.create({ body: preferenceBody });
            return result.init_point!;
        } catch (error) {
            console.error('Error creating MercadoPago preference:', error);
            throw new Error('No se pudo crear la preferencia de pago');
        }
    },

    // Obtener información de un pago
    async getPayment(paymentId: string): Promise<PaymentData> {
        const payment = new Payment(mercadopago);

        try {
            const result = await payment.get({ id: paymentId });
            // Convertir el resultado del SDK al formato que necesitamos
            return {
                id: String(result.id),
                status: result.status as PaymentStatus,
                status_detail: result.status_detail || '',
                external_reference: result.external_reference || undefined,
                payment_method_id: result.payment_method_id || '',
                payment_type_id: result.payment_type_id || '',
                transaction_amount: result.transaction_amount || 0,
                transaction_amount_refunded: result.transaction_amount_refunded || 0,
                date_created: result.date_created || '',
                date_approved: result.date_approved || undefined,
                metadata: result.metadata || {},
                payer: {
                    email: result.payer?.email || '',
                    identification: {
                        type: result.payer?.identification?.type || '',
                        number: result.payer?.identification?.number || '',
                    },
                },
            } as PaymentData;
        } catch (error) {
            console.error('Error getting payment:', error);
            throw new Error('No se pudo obtener la información del pago');
        }
    },

    // Validar webhook signature (para seguridad)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    validateWebhookSignature(_signature: string, _data: string): boolean {
        // Implementar validación de firma webhook si es necesario
        // Por ahora devolvemos true, pero en producción deberíamos validar
        return true;
    }
};

// Funciones utilitarias
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(amount);
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 