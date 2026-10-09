import { headers } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/better-auth'
import { requireAdmin } from '@/lib/auth'

// Cierre de sesión. `requireAdmin()` mantiene la regla "toda ruta admin exige
// sesión válida"; si no la hay, redirige a login (destino equivalente al de un
// logout, así que el usuario termina igual). signOut revoca la sesión en la DB
// y borra las cookies (plugin nextCookies).
export async function POST(request: NextRequest) {
    await requireAdmin()

    await auth.api.signOut({ headers: await headers() })

    // Navegación completa a login (303). En el host admin la URL canónica del
    // login es /login (el middleware la reescribe a /admin/login).
    const isAdminHost = (request.headers.get('host') ?? '').startsWith('admin.')
    return NextResponse.redirect(
        new URL(isAdminHost ? '/login' : '/admin/login', request.url),
        { status: 303 }
    )
}
