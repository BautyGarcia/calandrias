import { NextRequest, NextResponse } from 'next/server'

// TEMPORAL (Task 5 -> Task 6): la sincronización con Airbnb dependía del cliente
// externo ya retirado. Este endpoint se reescribe sobre Supabase en el Task 6.
// Se mantiene la verificación de CRON_SECRET para no exponer el placeholder.
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    return NextResponse.json({ error: 'En migración' }, { status: 503 })
}
