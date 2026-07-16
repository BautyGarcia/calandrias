import { NextRequest, NextResponse } from 'next/server'
import { paymentApi } from '@/lib/mercadopago'
import { createReservation, generateReservationCode } from '@/lib/db/reservations'
import { metadataToReservationInput } from '@/lib/payments/metadata'
import { EmailService } from '@/lib/email-service'
import { ReservationConfirmationData } from '@/emails/templates/ReservationConfirmation'
import type { PaymentNotification } from '@/types/payment'
import type { ReservationInput } from '@/types/db'

export async function POST(request: NextRequest) {
    try {
        // ================================
        // 🔐 VALIDACIÓN DE SEGURIDAD
        // ================================

        // Extraer headers de seguridad
        const xSignature = request.headers.get('x-signature');
        const xRequestId = request.headers.get('x-request-id');

        const url = new URL(request.url);
        const dataId = url.searchParams.get('id') || url.searchParams.get('data.id');

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
            return NextResponse.json({ error: 'MP_WEBHOOK_SECRET not configured' }, { status: 401 });
        }

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

        // Obtener datos de la reserva desde metadata (snake_case, como llega de MP)
        const metadata = paymentData.metadata;

        if (!metadata || !metadata.cabin_id || !metadata.guest_name || !metadata.guest_email) {
            console.error('❌ Required reservation data not found in payment metadata');
            return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 });
        }

        let result: {
            status: string;
            reservationId?: string;
            paymentStatus?: string;
            amount?: number;
            paymentId?: string;
            message?: string;
        } = { status: 'processing' };

        switch (paymentData.status) {
            case 'approved': {
                // Construir la reserva confirmada a partir del metadata + datos del pago.
                const reservationInput: ReservationInput = metadataToReservationInput(metadata, {
                    paymentId: paymentData.id,
                    transactionAmount: paymentData.transaction_amount,
                    dateApproved: paymentData.date_approved || new Date().toISOString(),
                    // MP no expone `preference_id` en el objeto de pago (sólo `order.id`,
                    // que es el merchant order, no la preferencia). Sólo se puede
                    // completar `paymentMethod` con lo que sí trae el pago.
                    paymentMethodId: paymentData.payment_method_id || undefined,
                });
                reservationInput.reservationCode = generateReservationCode();

                let createdReservation: Awaited<ReturnType<typeof createReservation>> | null = null;

                try {
                    // La constraint de solapamiento traduce el conflicto a Error('DATE_CONFLICT').
                    createdReservation = await createReservation(reservationInput);
                } catch (createError) {
                    const isConflict = createError instanceof Error && createError.message === 'DATE_CONFLICT';

                    if (!isConflict) {
                        // Error no relacionado a fechas: NUNCA perder un pago aprobado.
                        // Fallback a reserva pendiente para revisión manual.
                        console.error('❌ Error creating confirmed reservation, falling back to pending:', createError);
                    } else {
                        console.error('❌ Date conflict during payment confirmation, falling back to pending review');
                    }

                    // Fallback: registrar la reserva como `pending` para no perder el pago.
                    const pendingInput: ReservationInput = {
                        ...reservationInput,
                        state: 'pending',
                        specialRequests: `CONFLICTO DE FECHAS - revisar. ${reservationInput.specialRequests ?? ''}`.trim(),
                    };

                    try {
                        createdReservation = await createReservation(pendingInput);
                        console.warn('⚠️ Paid reservation stored as PENDING for manual review:', {
                            reservationId: createdReservation.id,
                            paymentId: paymentData.id,
                        });
                    } catch (fallbackError) {
                        // Si hasta el fallback pendiente falla, logueamos fuerte y devolvemos 200.
                        // Un 500 haría que MP reintente indefinidamente; el pago igual es
                        // recuperable desde el dashboard de MercadoPago con este paymentId.
                        console.error('🚨 CRITICAL: could not persist paid reservation (confirmed AND pending failed). Recover manually from MP dashboard.', {
                            paymentId: paymentData.id,
                            amount: paymentData.transaction_amount,
                            metadata,
                            error: fallbackError,
                        });
                        return NextResponse.json(
                            {
                                status: 'reservation_persist_failed',
                                message: 'Payment approved but reservation could not be persisted; recover from MP dashboard',
                                paymentId: paymentData.id,
                            },
                            { status: 200 }
                        );
                    }
                }

                const isConfirmed = createdReservation.state === 'confirmed';
                result = {
                    status: isConfirmed ? 'reservation_created' : 'reservation_pending_conflict',
                    reservationId: createdReservation.id,
                    paymentStatus: 'approved',
                    amount: paymentData.transaction_amount,
                };

                console.log(
                    isConfirmed
                        ? '✅ Reservation created successfully:'
                        : '⚠️ Reservation stored as pending (conflict):',
                    createdReservation.id,
                );

                // 📧 Enviar email de confirmación sólo si la reserva quedó confirmada.
                if (isConfirmed) {
                    try {
                        const emailData: ReservationConfirmationData = {
                            guestName: String(metadata.guest_name),
                            guestEmail: String(metadata.guest_email),
                            cabinName: String(metadata.cabin_name || `Cabaña ${metadata.cabin_id}`),
                            checkIn: new Date(String(metadata.check_in)),
                            checkOut: new Date(String(metadata.check_out)),
                            totalPrice: paymentData.transaction_amount,
                            reservationCode: createdReservation.reservationCode || createdReservation.id,
                            paymentId: paymentData.id,
                        };

                        await EmailService.sendReservationConfirmation(emailData, {
                            to: String(metadata.guest_email),
                        });

                        console.log('✅ Confirmation email sent successfully to:', metadata.guest_email);
                    } catch (emailError) {
                        // No fallar el webhook por errores de email: la reserva ya está creada.
                        console.error('❌ Failed to send confirmation email (reservation still valid):', emailError);
                    }
                }
                break;
            }

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
