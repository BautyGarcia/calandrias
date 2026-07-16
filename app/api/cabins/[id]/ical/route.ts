import { NextRequest, NextResponse } from 'next/server'

/**
 * TEMPORAL (Task 5 -> Task 6): la exportación de iCal por cabaña dependía del
 * cliente externo ya retirado. La generación de iCal sobre Supabase forma parte
 * del trabajo de sincronización con Airbnb del Task 6.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await params
    return NextResponse.json({ error: 'En migración' }, { status: 503 })
}
