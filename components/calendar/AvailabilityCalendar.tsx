"use client"

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Users
} from "lucide-react"
import { CalendarEvent, CabinInfo, CalendarDay } from '@/types/calendar'
import {
    getCalendarMonth,
    getCabinAvailabilityForDate,
    formatCalendarDate,
    AVAILABILITY_COLORS
} from '@/utils/calendar'

interface AvailabilityCalendarProps {
    events: CalendarEvent[]
    cabins: CabinInfo[]
    onDateSelect?: (date: Date) => void
    selectedDate?: Date | null
}

export default function AvailabilityCalendar({
    events,
    cabins,
    onDateSelect,
    selectedDate
}: AvailabilityCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const calendarMonth = useMemo(() => {
        return getCalendarMonth(currentDate.getFullYear(), currentDate.getMonth())
    }, [currentDate])

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    const handleDateClick = (date: Date) => {
        if (onDateSelect) {
            onDateSelect(date)
        }
    }

    return (
        <Card className="bg-white border-[var(--beige-arena)]">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Calendario de Disponibilidad
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Hoy
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-medium text-[var(--brown-earth)] min-w-[200px] text-center">
                            {monthNames[calendarMonth.month]} {calendarMonth.year}
                        </span>
                        <Button variant="outline" size="sm" onClick={goToNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: AVAILABILITY_COLORS.available }}
                        />
                        <span>Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: AVAILABILITY_COLORS.reserved }}
                        />
                        <span>Reservado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: AVAILABILITY_COLORS.blocked }}
                        />
                        <span>Bloqueado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: AVAILABILITY_COLORS.maintenance }}
                        />
                        <span>Mantenimiento</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {dayNames.map(day => (
                        <div
                            key={day}
                            className="p-2 text-center text-sm font-medium text-[var(--slate-gray)] border-b border-[var(--beige-arena)]"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {calendarMonth.days.map((day, index) => (
                        <CalendarDayCell
                            key={index}
                            day={day}
                            cabins={cabins}
                            events={events}
                            isSelected={!!(selectedDate &&
                                day.date.getDate() === selectedDate.getDate() &&
                                day.date.getMonth() === selectedDate.getMonth() &&
                                day.date.getFullYear() === selectedDate.getFullYear()
                            )}
                            onClick={() => handleDateClick(day.date)}
                        />
                    ))}
                </div>

                {/* Selected Date Info */}
                {selectedDate && (
                    <div className="mt-6 p-4 bg-[var(--soft-cream)] rounded-lg">
                        <h3 className="font-medium text-[var(--brown-earth)] mb-3">
                            {formatCalendarDate(selectedDate)}
                        </h3>
                        <div className="space-y-2">
                            {cabins.map(cabin => {
                                const availability = getCabinAvailabilityForDate(selectedDate, cabin.id, events)
                                const dayEvents = events.filter(event =>
                                    event.cabinId === cabin.id &&
                                    selectedDate >= new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate()) &&
                                    selectedDate < new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate())
                                )

                                return (
                                    <div key={cabin.id} className="flex items-center justify-between p-2 bg-white rounded border border-[var(--beige-arena)]">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: AVAILABILITY_COLORS[availability] }}
                                            />
                                            <span className="font-medium">{cabin.name}</span>
                                            <span className="text-sm text-[var(--slate-gray)] flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {cabin.capacity}
                                            </span>
                                        </div>

                                        {dayEvents.length > 0 && dayEvents[0].details && (
                                            <div className="text-sm text-[var(--slate-gray)]">
                                                {dayEvents[0].details.reservationCode && (
                                                    <span className="font-mono">{dayEvents[0].details.reservationCode}</span>
                                                )}
                                                {dayEvents[0].details.guestName && (
                                                    <span className="ml-2">{dayEvents[0].details.guestName}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface CalendarDayCellProps {
    day: CalendarDay
    cabins: CabinInfo[]
    events: CalendarEvent[]
    isSelected: boolean
    onClick: () => void
}

function CalendarDayCell({ day, cabins, events, isSelected, onClick }: CalendarDayCellProps) {
    const cabinAvailabilities = cabins.map(cabin => ({
        cabin,
        availability: getCabinAvailabilityForDate(day.date, cabin.id, events)
    }))

    return (
        <div
            className={`
        min-h-[80px] p-1 border border-[var(--beige-arena)] cursor-pointer hover:bg-[var(--soft-cream)] transition-colors
        ${!day.isCurrentMonth ? 'opacity-40' : ''}
        ${day.isToday ? 'ring-2 ring-[var(--green-moss)]' : ''}
        ${isSelected ? 'bg-[var(--light-sand)]' : ''}
      `}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${day.isToday ? 'font-bold text-[var(--green-moss)]' : 'text-[var(--brown-earth)]'}`}>
                    {day.date.getDate()}
                </span>
            </div>

            {/* Cabin Availability Indicators */}
            <div className="space-y-0.5">
                {cabinAvailabilities.map(({ cabin, availability }) => (
                    <div
                        key={cabin.id}
                        className="flex items-center gap-1"
                    >
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: AVAILABILITY_COLORS[availability] }}
                            title={`${cabin.name}: ${availability}`}
                        />
                        <span className="text-xs text-[var(--slate-gray)] truncate">
                            {cabin.name.split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
} 