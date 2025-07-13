export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
}

export interface PaymentItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface PaymentPayer {
  name?: string;
  surname?: string;
  email: string;
  phone?: {
    area_code: string;
    number: string;
  };
  identification?: {
    type: string;
    number: string;
  };
}

export interface PaymentBackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface ReservationPaymentData {
  reservationId?: string;
  cabinId: string;
  cabinName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  pets: number;
  totalAmount: number;
  specialRequests?: string;
}

export interface PaymentPreferenceBody {
  items: PaymentItem[];
  payer: PaymentPayer;
  back_urls: PaymentBackUrls;
  auto_return?: 'approved' | 'all';
  payment_methods?: {
    excluded_payment_types?: Array<{ id: string }>;
    excluded_payment_methods?: Array<{ id: string }>;
    installments?: number;
  };
  notification_url?: string;
  external_reference?: string;
  metadata?: Record<string, any>;
}

export type PaymentStatus = 
  | 'pending'      // Esperando pago
  | 'processing'   // Procesando
  | 'approved'     // Aprobado
  | 'rejected'     // Rechazado
  | 'cancelled'    // Cancelado
  | 'refunded'     // Reembolsado
  | 'in_process';  // En proceso

export interface PaymentNotification {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice' | 'point_integration_wh';
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: 'payment.created' | 'payment.updated' | string;
  data: {
    id: string;
  };
}

export interface PaymentData {
  id: string;
  status: PaymentStatus;
  status_detail: string;
  external_reference?: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  date_created: string;
  date_approved?: string;
  metadata: Record<string, any>;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
} 