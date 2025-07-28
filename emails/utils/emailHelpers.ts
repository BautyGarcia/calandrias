import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getCabinDisplayName as getCabinDisplayNameFromConfig } from '@/utils/cabins'

export const formatDate = (date: Date): string => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es })
}

export const formatDateShort = (date: Date): string => {
    return format(date, 'dd MMM yyyy', { locale: es })
}

export const formatPrice = (price: number): string => {
    return price.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })
}

export const calculateNights = (checkIn: Date, checkOut: Date): number => {
    const timeDiff = checkOut.getTime() - checkIn.getTime()
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
}

export const generateReservationCode = (cabinId: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const cabinPrefix = cabinId.substring(0, 3).toUpperCase()
    const year = new Date().getFullYear()

    return `CAL-${year}-${cabinPrefix}${timestamp}`
}

export const validateEmailAddress = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const getCabinDisplayName = (cabinSlug: string): string => {
    return getCabinDisplayNameFromConfig(cabinSlug)
} 