import { NextRequest, NextResponse } from 'next/server'
import { getPublicAvailability } from '@/lib/db/reservations'

export async function GET(request: NextRequest) {
    const cabin = request.nextUrl.searchParams.get('cabin')
    if (!cabin) return NextResponse.json({ error: 'cabin requerido' }, { status: 400 })
    const ranges = await getPublicAvailability(cabin)
    return NextResponse.json({ ranges }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } })
}
