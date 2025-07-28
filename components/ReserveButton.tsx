'use client'

import { Button } from '@/components/ui/button'

export function ReserveButton() {
    const scrollToCalendar = () => {
        const calendarSection = document.getElementById('calendar-section')
        if (calendarSection) {
            calendarSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <Button
            onClick={scrollToCalendar}
            className="w-full cursor-pointer"
            size="lg"
        >
            Reservar Ahora
        </Button>
    )
} 