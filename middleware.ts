import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_HOST_PREFIX = 'admin.'

// Rutas del backoffice accesibles sin sesión: login y el flujo de recuperación
// de contraseña (que llega con el token en la query string desde el mail).
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/reset']

export function middleware(request: NextRequest) {
    const url = request.nextUrl
    const host = request.headers.get('host') ?? ''
    const isAdminHost = host.startsWith(ADMIN_HOST_PREFIX)

    // Colapsamos slashes repetidos (`//admin/x`, `///admin/x`) antes de cualquier
    // decisión: el gate y el rewrite no deben depender de si Next normaliza o no
    // el path por su cuenta antes de invocar el middleware.
    const pathname = url.pathname.replace(/\/{2,}/g, '/')

    // En el host admin, admin.<dominio>/foo mapea a /admin/foo (transparente).
    // Un request directo a /admin/... (en cualquier host) ya es el path efectivo,
    // por lo que nunca generamos /admin/admin/... Las rutas /api/* tampoco se
    // reescriben: viven en su path real en ambos hosts (p. ej. /api/auth/*,
    // /api/admin/logout, que se protege sola con requireAdmin).
    const needsRewrite = isAdminHost && !pathname.startsWith('/admin') && !pathname.startsWith('/api')
    const effectivePath = needsRewrite
        ? `/admin${pathname === '/' ? '' : pathname}`
        : pathname

    // Solo /admin/* se protege; el resto del sitio pasa sin tocar nada.
    if (!effectivePath.startsWith('/admin')) {
        return NextResponse.next()
    }

    // Chequeo optimista: existencia de la cookie de sesión de better-auth. La
    // validación real (sesión vigente + allowlist) la hace requireAdmin() en el
    // layout del panel y en cada action/route.
    const hasSessionCookie = Boolean(getSessionCookie(request))
    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => effectivePath === p || effectivePath.startsWith(p + '/'))
    if (!hasSessionCookie && !isPublicAdminPath) {
        const loginUrl = url.clone()
        // En el host admin la URL visible es /login (se reescribe a /admin/login);
        // en el dominio principal el login vive en /admin/login.
        loginUrl.pathname = isAdminHost ? '/login' : '/admin/login'
        loginUrl.search = ''
        return NextResponse.redirect(loginUrl)
    }

    if (needsRewrite) {
        const target = url.clone()
        target.pathname = effectivePath
        return NextResponse.rewrite(target)
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)'],
}
