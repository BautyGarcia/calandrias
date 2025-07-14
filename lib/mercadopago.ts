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
            auto_return: 'approved',
            payment_methods: {
                installments: 1, // Sin cuotas
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
                checkIn: reservationData.checkIn,
                checkOut: reservationData.checkOut,
                adults: reservationData.adults.toString(),
                children: reservationData.children.toString(),
                pets: reservationData.pets.toString(),
                guestName: reservationData.guestName,
                guestEmail: reservationData.guestEmail,
                guestPhone: reservationData.guestPhone || '',
                specialRequests: reservationData.specialRequests || '',
                totalAmount: reservationData.totalAmount.toString(),
            },
        };

        const result = await preference.create({ body: preferenceBody });
        
        if (!result.init_point) {
            throw new Error('Failed to create payment preference');
        }

        return result.init_point;
    },

    // Obtener información de pago
    async getPayment(paymentId: string): Promise<PaymentData> {
        const payment = new Payment(mercadopago);
        const result = await payment.get({ id: paymentId });
        
        return {
            id: String(result.id || ''),
            status: result.status as PaymentStatus,
            status_detail: result.status_detail || '',
            external_reference: result.external_reference,
            metadata: result.metadata,
            transaction_amount: result.transaction_amount || 0,
            transaction_amount_refunded: result.transaction_amount_refunded || 0,
            payment_method_id: result.payment_method_id || '',
            payment_type_id: result.payment_type_id || '',
            payer: {
                email: result.payer?.email || '',
                identification: {
                    type: result.payer?.identification?.type || '',
                    number: result.payer?.identification?.number || '',
                },
            },
            date_approved: result.date_approved || undefined,
            date_created: result.date_created || '',
        };
    },

    // Validar webhook signature (para seguridad)
    validateWebhookSignature(signature: string, data: string): boolean {
        const { WebhookValidator } = require('@/lib/webhook-validator');
        return WebhookValidator.validateSignature(signature, data);
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