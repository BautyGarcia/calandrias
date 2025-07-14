import type { ReservationFormData } from '@/types/reservation';
import type { ReservationPaymentData } from '@/types/payment';

/**
 * Adaptador que convierte datos del formulario de reserva a datos de pago
 * Siguiendo Single Responsibility: solo se encarga de la transformación de datos
 */
export class ReservationPaymentAdapter {
    /**
     * Convierte datos del formulario + contexto de reserva a formato de pago
     */
    static formDataToPaymentData(
        formData: ReservationFormData,
        reservationContext: {
            cabinId: string;
            cabinName: string;
            checkIn: Date;
            checkOut: Date;
            totalPrice: number;
        }
    ): ReservationPaymentData {
        return {
            // Datos de la cabaña
            cabinId: reservationContext.cabinId,
            cabinName: reservationContext.cabinName,
            
            // Datos del huésped (del formulario)
            guestName: formData.guestName,
            guestEmail: formData.guestEmail,
            
            // Fechas (del contexto)
            checkIn: reservationContext.checkIn.toISOString().split('T')[0],
            checkOut: reservationContext.checkOut.toISOString().split('T')[0],
            
            // Huéspedes (del formulario)
            adults: formData.adults,
            children: formData.children,
            pets: formData.pets,
            
            // Precio (del contexto)
            totalAmount: reservationContext.totalPrice,
            
            // Solicitudes especiales (del formulario)
            specialRequests: formData.specialRequests,
        };
    }

    /**
     * Valida que los datos del formulario sean compatibles con el sistema de pagos
     */
    static validateFormDataForPayment(formData: ReservationFormData): string[] {
        const errors: string[] = [];

        if (!formData.guestName?.trim()) {
            errors.push('Nombre del huésped es requerido');
        }

        if (!formData.guestEmail?.trim()) {
            errors.push('Email del huésped es requerido');
        }

        if (!formData.adults || formData.adults < 1) {
            errors.push('Debe haber al menos 1 adulto');
        }

        return errors;
    }
} 