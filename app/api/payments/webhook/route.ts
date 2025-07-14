import { NextRequest, NextResponse } from 'next/server';
import { paymentApi } from '@/lib/mercadopago';
import { StrapiAPI } from '@/lib/strapi';
import { WebhookValidator } from '@/lib/webhook-validator';
import { getRawBody, getSignatureHeader } from '@/lib/webhook-utils';
import type { PaymentNotification } from '@/types/payment';

export async function POST(request: NextRequest) {
    try {
        // 1. Obtener raw body para validación de signature
        const rawBody = await getRawBody(request);
        
        // 2. Validar signature del webhook (solo en producción)
        if (process.env.NODE_ENV === 'production') {
            const signatureHeader = getSignatureHeader(request);
            
            if (!signatureHeader) {
                return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
            }
            
            const signature = WebhookValidator.extractSignatureFromHeader(signatureHeader);
            if (!signature || !WebhookValidator.validateSignature(signature, rawBody)) {
                return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
            }
        }
        
        // 3. Parsear la notificación
        const notification: PaymentNotification = JSON.parse(rawBody);

        // Validar que sea una notificación de pago
        if (notification.type !== 'payment') {
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        // Obtener información del pago desde MercadoPago
        const paymentId = notification.data.id;
        const paymentData = await paymentApi.getPayment(paymentId);

        // Obtener datos de la reserva desde metadata
        const metadata = paymentData.metadata;
        if (!metadata || !metadata.cabinId || !metadata.guestName || !metadata.guestEmail) {
            console.error('❌ Required reservation data not found in payment metadata');
            return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 });
        }

        // Procesar según el estado del pago
        const strapiApi = new StrapiAPI();
        let result: {
            status: string;
            reservationId?: string;
            paymentStatus?: string;
            amount?: number;
            paymentId?: string;
            message?: string;
            conflictingReservations?: string[];
        } = { status: 'processing' };

        switch (paymentData.status) {
            case 'approved':
                // Crear reserva confirmada cuando el pago es aprobado
                const reservationData = {
                    cabinId: metadata.cabin_id,
                    checkIn: metadata.check_in,
                    checkOut: metadata.check_out,
                    guestName: metadata.guest_name,
                    guestEmail: metadata.guest_email,
                    guestPhone: metadata.guest_phone || '',
                    adults: parseInt(metadata.adults) || 1,
                    children: parseInt(metadata.children) || 0,
                    pets: parseInt(metadata.pets) || 0,
                    specialRequests: metadata.special_requests || '',
                    totalPrice: paymentData.transaction_amount,
                    currency: 'ARS',
                    status: 'confirmed' as const,
                    source: 'direct' as const,
                    // Datos del pago
                    paymentStatus: 'approved' as const,
                    mpPaymentId: paymentData.id,
                    paymentMethod: paymentData.payment_method_id,
                    paidAmount: paymentData.transaction_amount,
                    paymentDate: paymentData.date_approved || new Date().toISOString(),
                };

                // Verificar disponibilidad nuevamente antes de crear
                const existingReservations = await strapiApi.getReservations();
                const checkInDate = new Date(metadata.check_in);
                const checkOutDate = new Date(metadata.check_out);
                
                const conflicts = existingReservations.filter(reservation => {
                    if (reservation.cabinId !== metadata.cabin_id) return false;
                    if (reservation.status === 'cancelled') return false;
                    
                    const resCheckIn = new Date(reservation.checkIn);
                    const resCheckOut = new Date(reservation.checkOut);
                    
                    return (checkInDate < resCheckOut && checkOutDate > resCheckIn);
                });

                if (conflicts.length > 0) {
                    console.error('❌ Date conflict detected during payment confirmation');
                    // En caso de conflicto, registrar el error pero no fallar el webhook
                    // MercadoPago ya procesó el pago, necesitamos manejarlo
                    result = {
                        status: 'conflict_detected',
                        message: 'Payment approved but dates no longer available',
                        paymentId: paymentData.id,
                        conflictingReservations: conflicts.map(c => c.id.toString())
                    };
                } else {
                    // Crear la reserva
                    const createdReservation = await strapiApi.createReservation(reservationData);
                    
                    result = {
                        status: 'reservation_created',
                        reservationId: createdReservation.documentId,
                        paymentStatus: 'approved',
                        amount: paymentData.transaction_amount
                    };
                }
                break;

            case 'rejected':
            case 'cancelled':
                // No crear reserva para pagos rechazados
                result = {
                    status: 'payment_rejected',
                    paymentStatus: paymentData.status,
                    message: 'No reservation created due to payment failure'
                };
                break;

            case 'pending':
            case 'in_process':
            case 'processing':
            default:
                // Para pagos pendientes, no crear reserva aún
                result = {
                    status: 'payment_pending',
                    paymentStatus: paymentData.status,
                    message: 'Reservation will be created when payment is confirmed'
                };
                break;
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('❌ Error processing webhook:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Endpoint GET para verificar que el webhook está funcionando
export async function GET() {
    return NextResponse.json({
        status: 'webhook_endpoint_active',
        timestamp: new Date().toISOString(),
        message: 'MercadoPago webhook endpoint is ready to receive notifications'
    });
} 