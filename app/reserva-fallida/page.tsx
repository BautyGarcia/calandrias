import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ReservationFailedContent() {
    return (
        <div className="min-h-screen bg-[var(--light-sand)] flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-[var(--light-sand)] border-2 border-[var(--beige-arena)]">
                <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-2 border-[var(--beige-arena)]">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-red-600">
                        Pago No Procesado
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                        No se pudo completar tu reserva
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="text-center">
                        <p className="text-lg text-[var(--slate-gray)]">
                            Tu reserva no ha sido confirmada porque el pago no se completó exitosamente.
                            Esto puede suceder por varios motivos y no se ha realizado ningún cargo.
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4">
                            Posibles causas
                        </h4>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside">
                            <li>Datos de tarjeta incorrectos o tarjeta vencida</li>
                            <li>Fondos insuficientes en la cuenta</li>
                            <li>Límites de la tarjeta excedidos</li>
                            <li>Problemas de conectividad durante el proceso</li>
                            <li>Cancelación del proceso de pago</li>
                        </ul>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center">
                            <Phone className="w-5 h-5 mr-2" />
                            ¿Necesitas ayuda?
                        </h4>
                        <p className="text-gray-600 mb-4">
                            Si continúas teniendo problemas, puedes intentar con otro método de pago
                            o contactarnos para asistencia personalizada.
                        </p>
                    </div>

                    <div className="border-t pt-6 flex flex-col sm:flex-row gap-4">
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/cabanas">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver a cabañas
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">
                                Ir al inicio
                            </Link>
                        </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500 border-t pt-6">
                        <p>
                            <strong>Tranquilo, no se realizó ningún cargo.</strong><br />
                            Puedes intentar nuevamente cuando quieras o contactarnos para asistencia.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReservaFallidaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        }>
            <ReservationFailedContent />
        </Suspense>
    );
} 