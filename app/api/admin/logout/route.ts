import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

// Cierre de sesión. `requireAdmin()` mantiene la regla "toda ruta admin exige
// sesión válida"; si no la hay, redirige a login (destino equivalente al de un
// logout, así que el usuario termina igual). signOut sólo borra las cookies del
// propio cliente: no lee ni expone dato alguno del usuario.
export async function POST(request: NextRequest) {
    await requireAdmin()

    const supabase = await createServerSupabase()
    await supabase.auth.signOut()

    // Navegación completa a login (302) para que el middleware vea las cookies
    // ya borradas por signOut.
    return NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 })
}
