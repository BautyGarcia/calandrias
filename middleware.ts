import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Solo proteger rutas de admin (excepto login)
    if (request.nextUrl.pathname.startsWith('/admin') && 
        !request.nextUrl.pathname.startsWith('/admin/login')) {
        
        const authCookie = request.cookies.get('admin-auth')?.value
        const secretKey = process.env.ADMIN_SECRET_KEY

        if (!authCookie || !secretKey) {
            return redirectToLogin(request)
        }

        // Verificar formato de cookie: token.expiresAt
        const parts = authCookie.split('.')
        if (parts.length !== 2) {
            return redirectToLogin(request)
        }

        const [token, expiresAtStr] = parts
        const expiresAt = parseInt(expiresAtStr)

        // Verificar si la sesión expiró
        if (Date.now() > expiresAt) {
            return redirectToLogin(request)
        }

        // Verificar integridad del token usando Web Crypto API
        const username = process.env.ADMIN_USERNAME
        const timestamp = expiresAt - (24 * 60 * 60 * 1000) // Calcular timestamp original
        const sessionData = `${username}-${timestamp}-${expiresAt}`
        
        try {
            const expectedToken = await generateHMAC(sessionData, secretKey)
            
            if (token !== expectedToken) {
                return redirectToLogin(request)
            }
        } catch {
            return redirectToLogin(request)
        }
    }

    return NextResponse.next()
}

async function generateHMAC(data: string, key: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key)
    const dataBuffer = encoder.encode(data)
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)
    const hashArray = Array.from(new Uint8Array(signature))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function redirectToLogin(request: NextRequest) {
    const loginUrl = new URL('/admin/login', request.url)
    
    // Agregar parámetro de redirección para volver después del login
    if (request.nextUrl.pathname !== '/admin/login') {
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    }
    
    const response = NextResponse.redirect(loginUrl)
    
    // Limpiar cookie inválida
    response.cookies.delete('admin-auth')
    
    return response
}

export const config = {
    matcher: ['/admin/:path*']
} 