import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ReservationFailedContent() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="font-semibold text-red-800 mb-2">
                            ❌ El pago no se pudo procesar
                        </h3>
                        <p className="text-red-700">
                            Tu reserva no ha sido confirmada porque el pago no se completó exitosamente.
                            Esto puede suceder por varios motivos y no se ha realizado ningún cargo.
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4">
                            🔍 Posibles causas
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
                        <h4 className="font-semibold mb-4">
                            💡 ¿Qué puedes hacer?
                        </h4>
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h5 className="font-medium text-blue-800 mb-2">Intentar nuevamente</h5>
                                <p className="text-blue-700 text-sm mb-3">
                                    Puedes volver a intentar el proceso de reserva. Asegúrate de verificar
                                    los datos de tu tarjeta antes de continuar.
                                </p>
                                <Button asChild className="w-full">
                                    <Link href="/cabanas">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Intentar de nuevo
                                    </Link>
                                </Button>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h5 className="font-medium text-yellow-800 mb-2">Contactar soporte</h5>
                                <p className="text-yellow-700 text-sm mb-3">
                                    Si el problema persiste, nuestro equipo puede ayudarte a completar
                                    tu reserva por otros medios.
                                </p>
                                <Button variant="outline" className="w-full">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Contactar por WhatsApp
                                </Button>
                            </div>
                        </div>
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