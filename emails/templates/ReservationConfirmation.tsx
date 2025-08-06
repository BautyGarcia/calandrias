import { Text, Section, Button } from '@react-email/components'
import EmailLayout from '../components/EmailLayout'
import { formatDate, formatPrice, calculateNights } from '../utils/emailHelpers'

export interface ReservationConfirmationData {
  guestName: string
  guestEmail: string
  cabinName: string
  checkIn: Date
  checkOut: Date
  totalPrice: number
  reservationCode: string
  paymentId?: string // Opcional ahora, no lo mostramos
}

interface ReservationConfirmationProps {
  data: ReservationConfirmationData
}

export default function ReservationConfirmation({ data }: ReservationConfirmationProps) {
  const nights = calculateNights(data.checkIn, data.checkOut)

  return (
    <EmailLayout preview={`Confirmación de reserva ${data.reservationCode} - ${data.cabinName}`}>
      {/* Saludo personal */}
      <Section className="mb-8">
        <Text className="text-2xl font-bold text-brown-earth font-serif m-0 mb-4">
          Estimado/a {data.guestName}
        </Text>
        <Text className="text-base text-slate-gray m-0 leading-relaxed">
          Nos complace confirmar su reserva en Las Calandrias. Hemos recibido su pago exitosamente 
          y su estadía está garantizada.
        </Text>
      </Section>

      {/* Detalles de la reserva */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-brown-earth font-serif m-0 mb-6">
          Detalles de su reserva
        </Text>
        
        <Section className="mb-4">
          <Section className="flex justify-between py-3 border-b border-beige-arena/20">
            <Text className="text-sm font-medium text-slate-gray m-0">Cabaña:</Text>
            <Text className="text-sm font-bold text-brown-earth m-0">{data.cabinName}</Text>
          </Section>
          
          <Section className="flex justify-between py-3 border-b border-beige-arena/20">
            <Text className="text-sm font-medium text-slate-gray m-0">Check-in:</Text>
            <Text className="text-sm font-bold text-brown-earth m-0">{formatDate(data.checkIn)}</Text>
          </Section>
          
          <Section className="flex justify-between py-3 border-b border-beige-arena/20">
            <Text className="text-sm font-medium text-slate-gray m-0">Check-out:</Text>
            <Text className="text-sm font-bold text-brown-earth m-0">{formatDate(data.checkOut)}</Text>
          </Section>
          
          <Section className="flex justify-between py-3 border-b border-beige-arena/20">
            <Text className="text-sm font-medium text-slate-gray m-0">Noches:</Text>
            <Text className="text-sm font-bold text-brown-earth m-0">{nights} {nights === 1 ? 'noche' : 'noches'}</Text>
          </Section>
          
          <Section className="flex justify-between py-3 bg-soft-cream/50 px-4 rounded-lg">
            <Text className="text-base font-bold text-brown-earth m-0">Total abonado:</Text>
            <Text className="text-base font-bold text-brown-earth m-0">{formatPrice(data.totalPrice)}</Text>
          </Section>
        </Section>
      </Section>

      {/* Información importante */}
      <Section className="bg-green-moss/5 p-6 rounded-lg border-l-4 border-green-moss mb-8">
        <Text className="text-lg font-bold text-brown-earth font-serif m-0 mb-4">
          Información importante
        </Text>
        <Section className="mb-3">
          <Text className="text-sm text-slate-gray m-0">
            <strong>Check-in:</strong> A partir de las 15:00 hs
          </Text>
        </Section>
        <Section className="mb-3">
          <Text className="text-sm text-slate-gray m-0">
            <strong>Check-out:</strong> Hasta las 11:00 hs
          </Text>
        </Section>
        <Section className="mb-0">
          <Text className="text-sm text-slate-gray m-0">
            <strong>Ubicación:</strong> Ruta Provincial 30, Km 8, Tandil, Buenos Aires
          </Text>
        </Section>
      </Section>

      {/* Contacto */}
      <Section className="text-center mb-8">
        <Text className="text-base text-brown-earth m-0 mb-4 font-medium">
          ¿Consultas sobre su reserva?
        </Text>
        <Button
          href="https://wa.me/5492494027920"
          className="bg-green-moss text-white px-8 py-3 rounded-lg font-medium no-underline"
          style={{
            backgroundColor: '#3F6C29',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            fontWeight: '500',
            display: 'inline-block'
          }}
        >
          Contactar por WhatsApp
        </Button>
      </Section>

      {/* Despedida */}
      <Section className="text-center">
        <Text className="text-base text-slate-gray m-0 leading-relaxed">
          Esperamos brindarle una experiencia inolvidable en las sierras de Tandil.
        </Text>
        <Text className="text-sm text-slate-gray/70 m-0 mt-4 font-medium">
          Atentamente,<br />
          El equipo de Las Calandrias
        </Text>
      </Section>
    </EmailLayout>
  )
} 