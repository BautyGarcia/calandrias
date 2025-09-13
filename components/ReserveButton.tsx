'use client'

import { Button } from '@/components/ui/button'

export function ReserveButton() {
    // const scrollToCalendar = () => {
    //     const calendarSection = document.getElementById('calendar-section')
    //     if (calendarSection) {
    //         calendarSection.scrollIntoView({ behavior: 'smooth' })
    //     }
    // }

    return (
        <Button
            onClick={() => {}}
            className="w-full cursor-not-allowed opacity-50"
            size="lg"
            disabled={true}
        >
            Reservas temporalmente deshabilitadas
        </Button>
    )
} 