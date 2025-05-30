"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarEvent } from '@/types/calendar'
import { getCabinAvailabilityForDate } from '@/utils/calendar'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isAfter, isBefore, parseISO, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface CabinAvailabilityCalendarProps {
    cabinId: string
    cabinName: string
    events: CalendarEvent[]
}

interface DateRange {
    from: Date | null
    to: Date | null
}

const AVAILABILITY_COLORS = {
    available: 'hover:bg-[var(--soft-cream)] hover:border-[var(--green-moss)] text-[var(--brown-earth)] border-[var(--beige-arena)]',
    reserved: 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed',
    blocked: 'bg-[var(--slate-gray)]/10 border-[var(--slate-gray)]/30 text-[var(--slate-gray)] cursor-not-allowed',
    maintenance: 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed'
}

export default function CabinAvailabilityCalendar({ cabinId, cabinName, events }: CabinAvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedRange, setSelectedRange] = useState<DateRange>({ from: null, to: null })
    const [hoverDate, setHoverDate] = useState<Date | null>(null)

    // Generate calendar days for current month
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const navigateToPreviousMonth = () => {
        setCurrentMonth(prev => subMonths(prev, 1))
    }

    const navigateToNextMonth = () => {
        setCurrentMonth(prev => addMonths(prev, 1))
    }

    const getDateAvailability = (date: Date) => {
        const availability = getCabinAvailabilityForDate(date, cabinId, events)
        return availability
    }

    const isDateInRange = (date: Date, range: DateRange) => {
        if (!range.from || !range.to) return false
        return (isAfter(date, range.from) || isSameDay(date, range.from)) &&
            (isBefore(date, range.to) || isSameDay(date, range.to))
    }

    const isDateRangeEnd = (date: Date, range: DateRange) => {
        return range.from && range.to && (isSameDay(date, range.from) || isSameDay(date, range.to))
    }

    const isValidRange = (startDate: Date, endDate: Date) => {
        const daysInRange = eachDayOfInterval({ start: startDate, end: endDate })
        return daysInRange.every(date => getDateAvailability(date) === 'available')
    }

    const handleDateClick = (date: Date) => {
        const availability = getDateAvailability(date)

        // Don't allow selection of unavailable dates
        if (availability !== 'available') {
            return
        }

        if (!selectedRange.from || (selectedRange.from && selectedRange.to)) {
            // Start new selection
            setSelectedRange({ from: date, to: null })
        } else if (selectedRange.from && !selectedRange.to) {
            // Complete the range
            if (isSameDay(date, selectedRange.from)) {
                // Same date clicked, deselect
                setSelectedRange({ from: null, to: null })
            } else if (isAfter(date, selectedRange.from)) {
                // Check if the range is valid (no reserved dates in between)
                if (isValidRange(selectedRange.from, date)) {
                    setSelectedRange({ from: selectedRange.from, to: date })
                } else {
                    // Invalid range, start new selection from this date
                    setSelectedRange({ from: date, to: null })
                }
            } else {
                // Earlier date, make it the new start
                setSelectedRange({ from: date, to: null })
            }
        }
    }

    const getDateStyles = (date: Date) => {
        const availability = getDateAvailability(date)
        const isCurrentMonth = isSameMonth(date, currentMonth)
        const isToday = isSameDay(date, new Date())
        const isSelected = selectedRange.from && isSameDay(date, selectedRange.from)
        const isEndSelected = selectedRange.to && isSameDay(date, selectedRange.to)
        const isInRange = isDateInRange(date, selectedRange)

        let baseClasses = `
            relative w-12 h-12 border-2 flex items-center justify-center text-sm font-semibold
            transition-all duration-300 select-none shadow-sm
        `

        // Availability styles
        if (availability === 'available') {
            baseClasses += ` ${AVAILABILITY_COLORS.available} cursor-pointer hover:shadow-md hover:scale-105`
        } else {
            baseClasses += ` ${AVAILABILITY_COLORS[availability]}`
        }

        // Month dimming
        if (!isCurrentMonth) {
            baseClasses += ' opacity-40'
        }

        // Selection styles
        if (isSelected || isEndSelected) {
            baseClasses += ' !bg-[var(--green-moss)] !text-white !border-[var(--green-moss)] shadow-lg scale-105'
        } else if (isInRange && availability === 'available') {
            baseClasses += ' !bg-[var(--green-moss)]/20 !border-[var(--green-moss)]/40 !text-[var(--brown-earth)]'
        }

        // Today highlight
        if (isToday && !isSelected && !isEndSelected && !isInRange) {
            baseClasses += ' ring-2 ring-[var(--green-moss)]/50 bg-[var(--light-sand)]'
        }

        // Hover effect for range selection
        if (selectedRange.from && !selectedRange.to && hoverDate && availability === 'available') {
            const hoverRange = { from: selectedRange.from, to: hoverDate }
            if (isDateInRange(date, hoverRange) && isValidRange(selectedRange.from, hoverDate)) {
                baseClasses += ' !bg-[var(--green-moss)]/10 !border-[var(--green-moss)]/30'
            }
        }

        return baseClasses
    }

    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] // Spanish short weekdays

    return (
        <div className="space-y-8">
            {/* Calendar Header */}
            <div className="flex items-center justify-between bg-[var(--soft-cream)] p-4 border border-[var(--beige-arena)]">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateToPreviousMonth}
                    className="p-3 hover:bg-[var(--light-sand)] text-[var(--brown-earth)]"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <h3 className="text-xl font-serif font-bold text-[var(--brown-earth)] capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h3>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateToNextMonth}
                    className="p-3 hover:bg-[var(--light-sand)] text-[var(--brown-earth)]"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white p-6 border border-[var(--beige-arena)] shadow-lg">
                <div className="grid grid-cols-7 gap-3 place-items-center">
                    {/* Week day headers */}
                    {weekDays.map((day, index) => (
                        <div
                            key={index}
                            className="w-full h-12 flex items-center justify-center text-sm font-bold text-[var(--brown-earth)] uppercase bg-[var(--soft-cream)]"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((date) => (
                        <button
                            key={date.toISOString()}
                            onClick={() => handleDateClick(date)}
                            onMouseEnter={() => setHoverDate(date)}
                            onMouseLeave={() => setHoverDate(null)}
                            className={getDateStyles(date)}
                            disabled={getDateAvailability(date) !== 'available'}
                        >
                            {format(date, 'd')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Range Display */}
            {selectedRange.from && (
                <Card className="bg-[var(--soft-cream)] border-[var(--beige-arena)] shadow-lg">
                    <CardContent className="p-6">
                        <div className="text-center space-y-3">
                            <div className="w-12 h-1 bg-[var(--green-moss)] mx-auto"></div>
                            <p className="text-sm font-medium text-[var(--slate-gray)] uppercase tracking-wide">
                                Fechas seleccionadas
                            </p>
                            <div className="text-2xl font-serif font-bold text-[var(--brown-earth)]">
                                {selectedRange.to ? (
                                    <>
                                        <div className="flex items-center justify-center gap-4">
                                            <span className="bg-[var(--green-moss)] text-white px-4 py-2">
                                                {format(selectedRange.from, 'dd MMM', { locale: es })}
                                            </span>
                                            <div className="w-8 h-0.5 bg-[var(--green-moss)]"></div>
                                            <span className="bg-[var(--green-moss)] text-white px-4 py-2">
                                                {format(selectedRange.to, 'dd MMM', { locale: es })}
                                            </span>
                                        </div>
                                        <div className="text-base text-[var(--slate-gray)] mt-3 font-normal">
                                            <span className="bg-[var(--light-sand)] px-3 py-1">
                                                {Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24))} noches
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="bg-[var(--green-moss)] text-white px-6 py-3">
                                            {format(selectedRange.from, 'dd MMM yyyy', { locale: es })}
                                        </span>
                                        <div className="text-base text-[var(--slate-gray)] mt-4 font-normal">
                                            Selecciona la fecha de salida
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 