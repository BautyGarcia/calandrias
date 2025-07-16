import { NextRequest, NextResponse } from 'next/server';
import { paymentApi } from '@/lib/mercadopago';
import { StrapiAPI } from '@/lib/strapi';
import type { PaymentNotification } from '@/types/payment';

export async function POST(request: NextRequest) {
    try {
        // ================================
        // 🔐 VALIDACIÓN DE SEGURIDAD
        // ================================
        
        // Extraer headers de seguridad
        const xSignature = request.headers.get('x-signature');
        const xRequestId = request.headers.get('x-request-id');
        
        // Extraer query parameter data.id - MercadoPago puede enviar tanto 'id' como 'data.id'
        const url = new URL(request.url);
        const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

        // Verificar presencia de headers requeridos
        if (!xSignature || !xRequestId || !dataId) {
            console.error('❌ Missing required security headers or data.id');
            return NextResponse.json(
                { error: 'Missing required security headers' },
                { status: 401 }
            );
        }

        // Verificar si MP_WEBHOOK_SECRET está configurado
        const webhookSecret = process.env.MP_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('❌ MP_WEBHOOK_SECRET not configured - skipping signature validation');
            console.log('⚠️ SECURITY WARNING: Webhook signature validation disabled');
            // En desarrollo, continuar sin validación
            // En producción, esto debería fallar
        } else {
            // Validar firma del webhook solo si tenemos la clave secreta
            const isValidSignature = paymentApi.validateWebhookSignature(
                xSignature,
                xRequestId,
                dataId
            );

            if (!isValidSignature) {
                console.error('❌ Invalid webhook signature - possible security threat');
                return NextResponse.json(
                    { error: 'Invalid webhook signature' },
                    { status: 401 }
                );
            }
        }

        // ================================
        // 📦 PROCESAMIENTO DE NOTIFICACIÓN
        // ================================

        // Leer el cuerpo de la notificación
        const notification: PaymentNotification = await request.json();

        // Validar que sea una notificación de pago
        if (notification.type !== 'payment') {
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        // Obtener información del pago desde MercadoPago
        const paymentId = notification.data.id;
        const paymentData = await paymentApi.getPayment(paymentId);

        // Obtener datos de la reserva desde metadata
        const metadata = paymentData.metadata;

        if (!metadata || !metadata.cabin_id || !metadata.guest_name || !metadata.guest_email) {
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
                    result = {
                        status: 'conflict_detected',
                        message: 'Payment approved but dates no longer available',
                        paymentId: paymentData.id,
                        conflictingReservations: conflicts.map(c => c.id.toString())
                    };
                } else {
                    try {
                        // Crear la reserva
                        const createdReservation = await strapiApi.createReservation(reservationData);
                        
                        result = {
                            status: 'reservation_created',
                            reservationId: createdReservation.documentId,
                            paymentStatus: 'approved',
                            amount: paymentData.transaction_amount
                        };
                        
                        console.log('✅ Reservation created successfully:', createdReservation.documentId);
                    } catch (strapiError) {
                        console.error('❌ Error creating reservation in Strapi:', strapiError);
                        result = {
                            status: 'strapi_error',
                            message: 'Payment approved but reservation creation failed',
                            paymentId: paymentData.id
                        };
                    }
                }
                break;

            case 'rejected':
            case 'cancelled':
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
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    return NextResponse.json({
        status: 'webhook_endpoint_active',
        timestamp: new Date().toISOString(),
        message: 'MercadoPago webhook endpoint is ready to receive notifications',
        security: webhookSecret ? 'Signature validation enabled' : 'Signature validation disabled (MP_WEBHOOK_SECRET not configured)',
        environment: process.env.NODE_ENV
    });
} 