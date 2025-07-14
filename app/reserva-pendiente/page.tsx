import { Suspense } from 'react';
import Link from 'next/link';
import { Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ReservationPendingContent() {
    return (
        <div className="min-h-screen bg-[var(--light-sand)] flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-[var(--light-sand)] border-2 border-[var(--beige-arena)]">
                <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-2 border-[var(--beige-arena)]">
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
                    <div className="text-center">
                        <p className="text-lg text-[var(--slate-gray)]">
                            Hemos recibido tu solicitud de pago y está siendo procesada. Dependiendo del método
                            de pago elegido, este proceso puede tomar desde unos minutos hasta 2 días hábiles.
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4">
                            ¿Qué sucede ahora?
                        </h4>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <Clock className="w-5 h-5 mr-2 mt-0.5 text-yellow-500" />
                                <span>
                                    <strong>Verificación:</strong> MercadoPago está verificando tu pago
                                </span>
                            </li>
                            <li className="flex items-start">
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