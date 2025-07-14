"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
    User, 
    Mail, 
    Phone, 
    Users, 
    MessageSquare, 
    Loader2, 
    CheckCircle2,
    AlertTriangle,
    Calendar
} from "lucide-react"
import { ReservationFormData, ReservationSummary } from '@/types/reservation'

interface ReservationFormProps {
    reservationSummary: ReservationSummary
    onSubmit: (formData: ReservationFormData) => Promise<void>
    onCalendarRefresh?: () => Promise<void>
    isLoading?: boolean
}

interface ConflictAlert {
  error: string
  conflictingReservations?: Array<{
    id: string | number
    checkIn: string
    checkOut: string
    source: string
    guestName: string
  }>
}

// Componente para mostrar alertas de éxito
function SuccessAlert() {
  return (
    <Alert className="border-[var(--green-moss)] bg-[var(--soft-cream)]">
      <CheckCircle2 className="h-4 w-4 text-[var(--green-moss)]" />
      <AlertTitle className="text-[var(--green-moss)]">¡Reserva confirmada!</AlertTitle>
      <AlertDescription className="text-[var(--slate-gray)]">
        Tu reserva ha sido procesada exitosamente. Te hemos enviado un email de confirmación con todos los detalles. Revisa tu bandeja de entrada y spam. Nos pondremos en contacto contigo pronto.
      </AlertDescription>
    </Alert>
  )
}

// Componente para mostrar alertas de conflicto
function ConflictAlert({ error, conflictingReservations }: ConflictAlert) {
  if (!conflictingReservations || conflictingReservations.length === 0) {
    return (
      <Alert className="border-[var(--beige-arena)] bg-[var(--soft-cream)]">
        <AlertTriangle className="h-4 w-4 text-[var(--brown-earth)]" />
        <AlertTitle className="text-[var(--brown-earth)]">No se pudo procesar la reserva</AlertTitle>
        <AlertDescription className="text-[var(--slate-gray)]">
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-[var(--beige-arena)] bg-[var(--soft-cream)]">
      <Calendar className="h-4 w-4 text-[var(--brown-earth)]" />
      <AlertTitle className="text-[var(--brown-earth)]">Fechas no disponibles</AlertTitle>
      <AlertDescription className="text-[var(--slate-gray)]">
        <p>Las fechas seleccionadas fueron reservadas mientras se procesaba tu solicitud. Por favor, selecciona otras fechas disponibles en el calendario.</p>
      </AlertDescription>
    </Alert>
  )
}

export default function ReservationForm({ onSubmit, onCalendarRefresh, isLoading = false }: Omit<ReservationFormProps, 'reservationSummary'> & { onCalendarRefresh?: () => Promise<void> }) {
    const [formData, setFormData] = useState<ReservationFormData>({
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        adults: 1,
        children: 0,
        pets: 0,
        specialRequests: ''
    })

    const [errors, setErrors] = useState<Partial<ReservationFormData>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [conflictError, setConflictError] = useState<ConflictAlert | null>(null)

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.guestName.trim()) {
            newErrors.guestName = 'El nombre es requerido'
        }

        if (!formData.guestEmail.trim()) {
            newErrors.guestEmail = 'El email es requerido'
        } else if (!/\S+@\S+\.\S+/.test(formData.guestEmail)) {
            newErrors.guestEmail = 'Email no válido'
        }

        if (formData.adults < 1) {
            newErrors.adults = 'Debe haber al menos 1 adulto'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsSubmitting(true)
        setSubmissionStatus('idle')
        setConflictError(null)

        try {
            await onSubmit(formData)
            setSubmissionStatus('success')
            
            // Actualizar calendario tras éxito
            if (onCalendarRefresh) {
                await onCalendarRefresh()
            }
        } catch (error) {
            console.error('Error submitting reservation:', error)
            setSubmissionStatus('error')
            
            // Actualizar calendario tras error (para mostrar conflictos actualizados)
            if (onCalendarRefresh) {
                await onCalendarRefresh()
            }
            
            // Verificar si es un error de conflicto con detalles
            if (error && typeof error === 'object' && 'conflictingReservations' in error) {
                setConflictError(error as ConflictAlert)
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar la reserva'
                setConflictError({ error: errorMessage })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (field: keyof ReservationFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    return (
        <Card className="border-[var(--beige-arena)]">
            <CardHeader className="border-b border-[var(--beige-arena)]">
                <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Huésped
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información Personal */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[var(--brown-earth)]">Datos Personales</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="guestName" className="text-[var(--dark-wood)]">
                                    Nombre Completo *
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-[var(--slate-gray)]" />
                                    <Input
                                        id="guestName"
                                        type="text"
                                        placeholder="Tu nombre completo"
                                        value={formData.guestName}
                                        onChange={(e) => handleInputChange('guestName', e.target.value)}
                                        disabled={submissionStatus === 'success'}
                                        className={`pl-10 ${errors.guestName ? 'border-red-500' : ''}`}
                                    />
                                </div>
                                {errors.guestName && (
                                    <p className="text-sm text-red-500">{errors.guestName}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guestEmail" className="text-[var(--dark-wood)]">
                                    Email *
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--slate-gray)]" />
                                    <Input
                                        id="guestEmail"
                                        type="email"
                                        placeholder="tu@email.com"
                                        value={formData.guestEmail}
                                        onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                                        disabled={submissionStatus === 'success'}
                                        className={`pl-10 ${errors.guestEmail ? 'border-red-500' : ''}`}
                                    />
                                </div>
                                {errors.guestEmail && (
                                    <p className="text-sm text-red-500">{errors.guestEmail}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guestPhone" className="text-[var(--dark-wood)]">
                                Teléfono (opcional)
                            </Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-[var(--slate-gray)]" />
                                <Input
                                    id="guestPhone"
                                    type="tel"
                                    placeholder="+54 9 11 1234-5678"
                                    value={formData.guestPhone}
                                    onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                                    disabled={submissionStatus === 'success'}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Información de Huéspedes */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-[var(--brown-earth)] flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Huéspedes
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="adults" className="text-[var(--dark-wood)]">
                                    Adultos *
                                </Label>
                                <Select
                                    value={formData.adults.toString()}
                                    onValueChange={(value) => handleInputChange('adults', parseInt(value))}
                                    disabled={submissionStatus === 'success'}
                                >
                                    <SelectTrigger className={errors.adults ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Adultos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num} {num === 1 ? 'adulto' : 'adultos'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.adults && (
                                    <p className="text-sm text-red-500">{errors.adults}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="children" className="text-[var(--dark-wood)]">
                                    Niños
                                </Label>
                                <Select
                                    value={formData.children.toString()}
                                    onValueChange={(value) => handleInputChange('children', parseInt(value))}
                                    disabled={submissionStatus === 'success'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Niños" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[0, 1, 2, 3, 4, 5, 6].map(num => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num} {num === 1 ? 'niño' : 'niños'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pets" className="text-[var(--dark-wood)]">
                                    Mascotas
                                </Label>
                                <Select
                                    value={formData.pets.toString()}
                                    onValueChange={(value) => handleInputChange('pets', parseInt(value))}
                                    disabled={submissionStatus === 'success'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Mascotas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[0, 1, 2, 3, 4].map(num => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num} {num === 1 ? 'mascota' : 'mascotas'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Solicitudes Especiales */}
                    <div className="space-y-2">
                        <Label htmlFor="specialRequests" className="text-[var(--dark-wood)] flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Solicitudes Especiales (opcional)
                        </Label>
                        <Textarea
                            id="specialRequests"
                            placeholder="¿Hay algo especial que debamos saber? (celebración, accesibilidad, alergias alimentarias, etc.)"
                            value={formData.specialRequests}
                            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                            disabled={submissionStatus === 'success'}
                            className="min-h-[100px] resize-none"
                        />
                        <p className="text-xs text-[var(--slate-gray)]">
                            Esta información nos ayuda a preparar mejor tu estadía
                        </p>
                    </div>

                    {/* Botón de Envío */}
                    <div className="pt-4 border-t border-[var(--beige-arena)]">
                        {submissionStatus === 'success' && (
                            <div className="mb-4">
                                <SuccessAlert />
                            </div>
                        )}

                        {submissionStatus === 'error' && conflictError && (
                            <div className="mb-4">
                                <ConflictAlert 
                                    error={conflictError.error}
                                    conflictingReservations={conflictError.conflictingReservations}
                                />
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || isSubmitting || (submissionStatus === 'error' && !!conflictError) || submissionStatus === 'success'}
                            className="w-full bg-[var(--green-moss)] hover:bg-[var(--forest-green)] text-white font-medium py-3"
                        >
                            {(isLoading || isSubmitting) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Redirigiendo a pago...
                                </>
                            ) : submissionStatus === 'success' ? (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Reserva Confirmada
                                </>
                            ) : submissionStatus === 'error' && conflictError ? (
                                'Selecciona otras fechas'
                            ) : (
                                'Reservar y Pagar'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
} 