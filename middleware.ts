import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_HOST_PREFIX = 'admin.'

// Rutas del backoffice accesibles sin sesión: login y el flujo de recuperación
// de contraseña (que trae el token en el hash de la URL, invisible para el server).
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/reset']

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    const host = request.headers.get('host') ?? ''
    const isAdminHost = host.startsWith(ADMIN_HOST_PREFIX)

    // Colapsamos slashes repetidos (`//admin/x`, `///admin/x`) antes de cualquier
    // decisión: el gate y el rewrite no deben depender de si Next normaliza o no
    // el path por su cuenta antes de invocar el middleware.
    const pathname = url.pathname.replace(/\/{2,}/g, '/')

    // En el host admin, admin.<dominio>/foo mapea a /admin/foo (transparente).
    // Un request directo a /admin/... (en cualquier host) ya es el path efectivo,
    // por lo que nunca generamos /admin/admin/...
    const needsRewrite = isAdminHost && !pathname.startsWith('/admin')
    const effectivePath = needsRewrite
        ? `/admin${pathname === '/' ? '' : pathname}`
        : pathname

    // Solo /admin/* se protege; el resto del sitio pasa sin tocar Supabase.
    if (!effectivePath.startsWith('/admin')) {
        return NextResponse.next()
    }

    const buildResponse = () => {
        if (needsRewrite) {
            const target = url.clone()
            target.pathname = effectivePath
            return NextResponse.rewrite(target, { request })
        }
        return NextResponse.next({ request })
    }

    // Refresca la sesión de Supabase (getUser renueva los tokens vencidos).
    let response = buildResponse()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = buildResponse()
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()

    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => effectivePath === p || effectivePath.startsWith(p + '/'))
    if (!user && !isPublicAdminPath) {
        const loginUrl = url.clone()
        // En el host admin la URL visible es /login (se reescribe a /admin/login);
        // en el dominio principal el login vive en /admin/login.
        loginUrl.pathname = isAdminHost ? '/login' : '/admin/login'
        return NextResponse.redirect(loginUrl)
    }
    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)'],
}
