import { NextRequest, NextResponse } from 'next/server';
import { paymentApi } from '@/lib/mercadopago';
import { StrapiAPI } from '@/lib/strapi';
import type { PaymentNotification } from '@/types/payment';

export async function POST(request: NextRequest) {
    try {
        // Leer el cuerpo de la notificación
        const notification: PaymentNotification = await request.json();

        // Validar que sea una notificación de pago
        if (notification.type !== 'payment') {
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        // Obtener información del pago desde MercadoPago
        const paymentId = notification.data.id;
        const paymentData = await paymentApi.getPayment(paymentId);

        // Extraer el ID de la reserva desde metadata o external_reference
        const reservationId = paymentData.metadata?.reservationId || paymentData.external_reference;

        if (!reservationId) {
            console.error('❌ No reservation ID found in payment metadata');
            return NextResponse.json({ error: 'No reservation ID found' }, { status: 400 });
        }

        // Actualizar estado de la reserva en Strapi
        const strapiApi = new StrapiAPI();

        let reservationStatus: 'confirmed' | 'pending' | 'cancelled';
        const paymentStatus = paymentData.status;

        // Mapear estados de MercadoPago a estados de reserva
        switch (paymentData.status) {
            case 'approved':
                reservationStatus = 'confirmed';
                break;
            case 'rejected':
            case 'cancelled':
                reservationStatus = 'cancelled';
                break;
            case 'pending':
            case 'in_process':
            case 'processing':
            default:
                reservationStatus = 'pending';
                break;
        }

        // Preparar datos de actualización
        const updateData = {
            status: reservationStatus,
            paymentStatus: paymentStatus,
            mpPaymentId: paymentData.id,
            paymentMethod: paymentData.payment_method_id,
            paidAmount: paymentData.transaction_amount,
            paymentDate: paymentData.date_approved || new Date().toISOString(),
        };

        // Buscar la reserva por documentId
        const reservations = await strapiApi.getReservations();
        const reservation = reservations.find(r => r.documentId === reservationId);

        if (!reservation) {
            console.error(`❌ Reservation not found: ${reservationId}`);
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // Actualizar la reserva
        await strapiApi.updateReservation(reservation.id, updateData);
        console.log(`✅ Reservation ${reservationId} updated successfully`);

        // Log adicional para debugging
        console.log('📊 Update summary:', {
            reservationId,
            oldStatus: reservation.status,
            newStatus: reservationStatus,
            paymentStatus,
            amount: paymentData.transaction_amount
        });

        return NextResponse.json({
            status: 'success',
            reservationId,
            paymentStatus,
            reservationStatus
        }, { status: 200 });

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