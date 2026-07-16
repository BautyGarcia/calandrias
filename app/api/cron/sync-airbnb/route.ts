import { NextRequest, NextResponse } from 'next/server'
import { runAirbnbSync } from '@/lib/airbnb-sync'

// Cron diario (06:00 UTC, ver vercel.json). Protegido con CRON_SECRET.
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        const results = await runAirbnbSync()
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results,
        })
    } catch (error) {
        console.error('Error en sync de Airbnb:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        )
    }
}
