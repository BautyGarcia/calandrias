"use client"

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DateRange } from './CabinAvailabilityCalendar'

interface SelectedDateRangeProps {
    selectedRange: DateRange
}

export default function SelectedDateRange({ selectedRange }: SelectedDateRangeProps) {
    if (!selectedRange.from) {
        return (
            <div className="p-4 bg-[var(--light-sand)] rounded-lg border border-[var(--beige-arena)]">
                <p className="text-sm text-[var(--slate-gray)] text-center">
                    Selecciona fechas en el calendario
                </p>
            </div>
        )
    }

    return (
        <div className="text-center space-y-4">
            <div className="text-2xl font-serif font-bold text-[var(--brown-earth)]">
                {selectedRange.to ? (
                    <>
                        <div className="flex items-center justify-center gap-4">
                            <span className="bg-[var(--green-moss)] text-white px-4 py-2 rounded">
                                {format(selectedRange.from, 'dd MMM', { locale: es })}
                            </span>
                            <div className="w-8 h-0.5 bg-[var(--green-moss)]"></div>
                            <span className="bg-[var(--green-moss)] text-white px-4 py-2 rounded">
                                {format(selectedRange.to, 'dd MMM', { locale: es })}
                            </span>
                        </div>
                        <div className="text-base text-[var(--slate-gray)] mt-3 font-normal">
                            <span className="bg-[var(--light-sand)] px-3 py-1 rounded">
                                {Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24))} noches
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <span className="bg-[var(--green-moss)] text-white px-6 py-3 rounded">
                            {format(selectedRange.from, 'dd MMM yyyy', { locale: es })}
                        </span>
                        <div className="text-base text-[var(--slate-gray)] mt-4 font-normal">
                            Selecciona la fecha de salida
                        </div>
                    </>
                )}
            </div>
        </div>
    )
} 