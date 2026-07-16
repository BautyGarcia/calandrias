import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// Cierre de sesión. Provablemente inofensivo sin `requireAdmin()`: sólo puede
// cerrar la sesión del propio cliente (borra sus cookies) y no lee ni expone
// dato alguno del usuario. signOut es idempotente aunque no haya sesión.
export async function POST(request: NextRequest) {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()

    // Navegación completa a login (302) para que el middleware vea las cookies
    // ya borradas por signOut.
    return NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 })
}
