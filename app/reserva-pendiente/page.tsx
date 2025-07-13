import { Suspense } from 'react';
import Link from 'next/link';
import { Clock, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ReservationPendingContent() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-12 h-12 text-yellow-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-yellow-600">
                        Pago Pendiente
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                        Tu pago está siendo procesado
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="font-semibold text-yellow-800 mb-2">
                            ⏳ Tu pago está siendo verificado
                        </h3>
                        <p className="text-yellow-700">
                            Hemos recibido tu solicitud de pago y está siendo procesada. Dependiendo del método
                            de pago elegido, este proceso puede tomar desde unos minutos hasta 2 días hábiles.
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4">
                            📋 ¿Qué sucede ahora?
                        </h4>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <Clock className="w-5 h-5 mr-2 mt-0.5 text-yellow-500" />
                                <span>
                                    <strong>Verificación:</strong> MercadoPago está verificando tu pago
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Mail className="w-5 h-5 mr-2 mt-0.5 text-blue-500" />
                                <span>
                                    <strong>Notificación:</strong> Te enviaremos un email cuando se confirme el pago
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Home className="w-5 h-5 mr-2 mt-0.5 text-green-500" />
                                <span>
                                    <strong>Confirmación:</strong> Una vez aprobado, tu reserva estará confirmada
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4">
                            ⏰ Tiempos de procesamiento típicos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h5 className="font-medium text-blue-800 mb-1">Tarjetas de crédito/débito</h5>
                                <p className="text-blue-700 text-sm">Hasta 24 horas</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h5 className="font-medium text-purple-800 mb-1">Transferencia bancaria</h5>
                                <p className="text-purple-700 text-sm">1-2 días hábiles</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h5 className="font-medium text-green-800 mb-1">Efectivo (Rapipago/Pago Fácil)</h5>
                                <p className="text-green-700 text-sm">Hasta 24 horas</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h5 className="font-medium text-orange-800 mb-1">Otros medios</h5>
                                <p className="text-orange-700 text-sm">Variable</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="font-semibold text-blue-800 mb-2">
                            📧 Mantente atento a tu email
                        </h4>
                        <p className="text-blue-700 text-sm">
                            Te enviaremos actualizaciones sobre el estado de tu pago y confirmación de reserva
                            al email que proporcionaste durante el proceso.
                        </p>
                    </div>

                    <div className="border-t pt-6 flex flex-col sm:flex-row gap-4">
                        <Button asChild className="flex-1">
                            <Link href="/cabanas">
                                <Home className="w-4 h-4 mr-2" />
                                Ver más cabañas
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">
                                Volver al inicio
                            </Link>
                        </Button>
                    </div>

                    <div className="text-center text-sm text-gray-500 border-t pt-6">
                        <p>
                            <strong>¿Necesitas ayuda?</strong><br />
                            Si tienes dudas sobre tu pago o reserva, no dudes en contactarnos.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReservaPendientePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600"></div>
            </div>
        }>
            <ReservationPendingContent />
        </Suspense>
    );
} 