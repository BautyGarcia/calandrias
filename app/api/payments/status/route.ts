import { NextRequest, NextResponse } from 'next/server';
import { paymentApi } from '@/lib/mercadopago';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('payment_id');
        
        if (!paymentId) {
            return NextResponse.json({ error: 'payment_id is required' }, { status: 400 });
        }

        const paymentData = await paymentApi.getPayment(paymentId);

        return NextResponse.json({
            id: paymentData.id,
            status: paymentData.status,
            external_reference: paymentData.external_reference,
            metadata: paymentData.metadata,
            transaction_amount: paymentData.transaction_amount,
            payment_method_id: paymentData.payment_method_id,
            payment_type_id: paymentData.payment_type_id,
            payer: paymentData.payer
        });

    } catch (error) {
        console.error('❌ Error checking payment status:', error);
        return NextResponse.json({
            error: 'Failed to check payment status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 