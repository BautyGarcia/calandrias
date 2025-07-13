import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Home, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentInfo from './PaymentInfo';

function ReservationConfirmedContent() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-green-600">
                        ¡Reserva Confirmada!
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                        Tu pago ha sido procesado exitosamente
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="font-semibold text-green-800 mb-2">
                            🎉 ¡Excelente! Tu reserva está confirmada
                        </h3>
                        <p className="text-green-700">
                            Hemos recibido tu pago y tu reserva ha sido procesada exitosamente.
                            En breve recibirás un email de confirmación con todos los detalles de tu estadía.
                        </p>
                    </div>

                    <Suspense fallback={
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <p className="text-gray-600">Cargando información del pago...</p>
                        </div>
                    }>
                        <PaymentInfo />
                    </Suspense>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Próximos pasos
                        </h4>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <Mail className="w-5 h-5 mr-2 mt-0.5 text-blue-500" />
                                <span>
                                    <strong>Email de confirmación:</strong> Recibirás un email con el código de reserva
                                    y las instrucciones para el check-in
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Calendar className="w-5 h-5 mr-2 mt-0.5 text-blue-500" />
                                <span>
                                    <strong>Información adicional:</strong> Te contactaremos 48hs antes de tu llegada
                                    para coordinar el check-in
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
                            ¿Tienes alguna pregunta? <br />
                            Contáctanos por WhatsApp o email y te ayudaremos de inmediato.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReservaConfirmadaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
            </div>
        }>
            <ReservationConfirmedContent />
        </Suspense>
    );
} 