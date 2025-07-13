"use server";

import { redirect } from 'next/navigation';
import { paymentApi } from '@/lib/mercadopago';
import type { ReservationPaymentData } from '@/types/payment';
import { StrapiAPI } from '@/lib/strapi';
import { z } from 'zod';

// Schema de validación para el formulario de pago
const PaymentFormSchema = z.object({
    cabinId: z.string().min(1, 'ID de cabaña requerido'),
    cabinName: z.string().min(1, 'Nombre de cabaña requerido'),
    checkIn: z.string().min(1, 'Fecha de entrada requerida'),
    checkOut: z.string().min(1, 'Fecha de salida requerida'),
    adults: z.number().min(1, 'Mínimo 1 adulto'),
    children: z.number().min(0),
    pets: z.number().min(0),
    guestName: z.string().min(2, 'Nombre requerido'),
    guestEmail: z.string().email('Email inválido'),
    guestPhone: z.string().optional(),
    specialRequests: z.string().optional(),
    totalAmount: z.number().min(1, 'Monto total requerido'),
});

export type PaymentFormData = z.infer<typeof PaymentFormSchema>;

/**
 * Server Action: Procesar pago de reserva
 * Crea una reserva temporal en Strapi y genera preferencia de MercadoPago
 */
export async function processReservationPayment(formData: FormData): Promise<never> {
    try {
        // Extraer y validar datos del formulario
        const rawData = {
            cabinId: formData.get('cabinId') as string,
            cabinName: formData.get('cabinName') as string,
            checkIn: formData.get('checkIn') as string,
            checkOut: formData.get('checkOut') as string,
            adults: Number(formData.get('adults')),
            children: Number(formData.get('children')),
            pets: Number(formData.get('pets')),
            guestName: formData.get('guestName') as string,
            guestEmail: formData.get('guestEmail') as string,
            guestPhone: formData.get('guestPhone') as string,
            specialRequests: formData.get('specialRequests') as string,
            totalAmount: Number(formData.get('totalAmount')),
        };

        // Validar datos
        const validatedData = PaymentFormSchema.parse(rawData);

        // 1. Crear reserva temporal en Strapi con estado 'pending'
        const reservationData = {
            cabinId: validatedData.cabinId,
            checkIn: validatedData.checkIn, // Strapi espera string, no Date
            checkOut: validatedData.checkOut,
            guestName: validatedData.guestName,
            guestEmail: validatedData.guestEmail,
            guestPhone: validatedData.guestPhone,
            adults: validatedData.adults,
            children: validatedData.children,
            pets: validatedData.pets,
            specialRequests: validatedData.specialRequests,
            totalPrice: validatedData.totalAmount,
            currency: 'ARS',
            status: 'pending' as const,
            source: 'direct' as const,
        };

        const strapiApi = new StrapiAPI();
        const reservation = await strapiApi.createReservation(reservationData);

        // 2. Preparar datos para MercadoPago
        const paymentData: ReservationPaymentData = {
            reservationId: reservation.documentId,
            cabinId: validatedData.cabinId,
            cabinName: validatedData.cabinName,
            guestName: validatedData.guestName,
            guestEmail: validatedData.guestEmail,
            checkIn: validatedData.checkIn,
            checkOut: validatedData.checkOut,
            adults: validatedData.adults,
            children: validatedData.children,
            pets: validatedData.pets,
            totalAmount: validatedData.totalAmount,
            specialRequests: validatedData.specialRequests,
        };

        // 3. Crear preferencia en MercadoPago
        const checkoutUrl = await paymentApi.createReservationPreference(paymentData);

        // 4. Redireccionar al checkout de MercadoPago
        redirect(checkoutUrl);

    } catch (error) {
        // Si es un error de redirect de Next.js, re-lanzarlo
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        
        console.error('Error processing reservation payment:', error);

        // En caso de error, redireccionar a página de error
        redirect('/reserva-fallida?error=processing_error');
    }
}

/**
 * Server Action: Procesar pago rápido (para testing)
 * Versión simplificada para pruebas de desarrollo
 */
export async function processQuickPayment(
    cabinId: string,
    totalAmount: number,
    guestEmail: string,
    guestName: string
): Promise<never> {
    try {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 7); // Una semana desde hoy

        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 2); // 2 noches

        const paymentData: ReservationPaymentData = {
            cabinId,
            cabinName: `Cabaña ${cabinId}`,
            guestName,
            guestEmail,
            checkIn: checkIn.toISOString().split('T')[0],
            checkOut: checkOut.toISOString().split('T')[0],
            adults: 2,
            children: 0,
            pets: 0,
            totalAmount,
        };

        const checkoutUrl = await paymentApi.createReservationPreference(paymentData);
        redirect(checkoutUrl);

    } catch (error) {
        // Si es un error de redirect de Next.js, re-lanzarlo
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        
        console.error('Error processing quick payment:', error);
        redirect('/reserva-fallida?error=quick_payment_error');
    }
}