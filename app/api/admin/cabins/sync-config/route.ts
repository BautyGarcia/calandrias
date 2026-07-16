import { NextRequest, NextResponse } from 'next/server'

/**
 * TEMPORAL (Task 5 -> Task 6): las configuraciones de sync de Airbnb vivían en el
 * backend externo ya retirado. Se reescribe sobre Supabase en el Task 6.
 * Se conserva la verificación estricta de CRON_SECRET.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (!authHeader || authHeader !== expectedAuth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'En migración' }, { status: 503 })
}
