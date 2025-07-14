import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Home, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ReservationConfirmedContent() {
    return (
        <div className="min-h-screen bg-[var(--light-sand)] flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-[var(--light-sand)] border-2 border-[var(--beige-arena)]">
                <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-2 border-[var(--beige-arena)]">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-green-600">
                        Reserva Confirmada
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                        Tu pago ha sido procesado exitosamente
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="text-center">
                        <p className="text-lg text-[var(--slate-gray)]">
                            Hemos recibido tu pago y tu reserva ha sido procesada exitosamente.
                            En breve recibirás un email de confirmación con todos los detalles de tu estadía.
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Próximos pasos
                        </h4>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start">
                                <span>
                                    <strong>Email de confirmación:</strong> Recibirás un email con el código de reserva
                                    y las instrucciones para el check-in
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