'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, CreditCard, Clock } from 'lucide-react';

interface PaymentInfo {
    id?: string;
    status?: string;
    external_reference?: string;
    payment_method_id?: string;
    transaction_amount?: number;
    payment_type_id?: string;
}

export default function PaymentInfo() {
    const searchParams = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const payment_id = searchParams.get('payment_id');
        const payment_type = searchParams.get('payment_type');
        const merchant_order_id = searchParams.get('merchant_order_id');
        const site_transaction_id = searchParams.get('site_transaction_id');

        // Mostrar información básica de la URL
        if (payment_id || payment_type || merchant_order_id) {
            // Si tenemos payment_id, intentar obtener más información
            if (payment_id) {
                fetch(`/api/payments/status?payment_id=${payment_id}`)
                    .then(res => res.json())
                    .then(data => {
                        setPaymentInfo(data);
                        setLoading(false);
                    })
                    .catch(error => {
                        console.error('Error fetching payment info:', error);
                        setPaymentInfo({
                            id: payment_id,
                            status: 'approved', // Asumimos aprobado si llegamos aquí
                            payment_method_id: payment_type || 'unknown'
                        });
                        setLoading(false);
                    });
            } else {
                setPaymentInfo({
                    id: site_transaction_id || 'unknown',
                    status: 'approved',
                    payment_method_id: payment_type || 'unknown'
                });
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    if (loading) {
        return (
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center text-blue-800">
                        <Clock className="w-5 h-5 mr-2" />
                        Verificando pago...
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-blue-700">Obteniendo información del pago...</p>
                </CardContent>
            </Card>
        );
    }

    if (!paymentInfo) {
        return (
            <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                    <CardTitle className="flex items-center text-yellow-800">
                        <Info className="w-5 h-5 mr-2" />
                        Información del pago
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-yellow-700">
                        No se encontraron detalles específicos del pago, pero tu reserva fue procesada exitosamente.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
        }
    };

    return (
        <Card className="bg-green-50 border-green-200">
            <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Información del pago
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">ID de pago</p>
                        <p className="font-semibold text-green-800">{paymentInfo.id}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Estado</p>
                        <div className="mt-1">
                            {getStatusBadge(paymentInfo.status || 'unknown')}
                        </div>
                    </div>
                    {paymentInfo.transaction_amount && (
                        <div>
                            <p className="text-sm text-gray-600">Monto</p>
                            <p className="font-semibold text-green-800">
                                ${paymentInfo.transaction_amount.toLocaleString('es-AR')} ARS
                            </p>
                        </div>
                    )}
                    {paymentInfo.payment_method_id && (
                        <div>
                            <p className="text-sm text-gray-600">Método de pago</p>
                            <p className="font-semibold text-green-800">{paymentInfo.payment_method_id}</p>
                        </div>
                    )}
                </div>
                
                {paymentInfo.external_reference && (
                    <div>
                        <p className="text-sm text-gray-600">Referencia de reserva</p>
                        <p className="font-semibold text-green-800">{paymentInfo.external_reference}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 