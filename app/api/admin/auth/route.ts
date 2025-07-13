import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json()

        // Validar credenciales contra variables de entorno
        const validUsername = process.env.ADMIN_USERNAME
        const validPassword = process.env.ADMIN_PASSWORD
        const secretKey = process.env.ADMIN_SECRET_KEY

        if (!validUsername || !validPassword || !secretKey) {
            return NextResponse.json(
                { success: false, error: 'Configuración de admin incompleta' },
                { status: 500 }
            )
        }

        if (username !== validUsername || password !== validPassword) {
            return NextResponse.json(
                { success: false, error: 'Credenciales incorrectas' },
                { status: 401 }
            )
        }

        // Generar token de sesión seguro
        const timestamp = Date.now()
        const expiresAt = timestamp + (24 * 60 * 60 * 1000) // 24 horas

        const sessionData = `${username}-${timestamp}-${expiresAt}`
        const sessionToken = await generateHMAC(sessionData, secretKey)

        const cookieValue = `${sessionToken}.${expiresAt}`

        // Crear respuesta con cookie segura
        const response = NextResponse.json({
            success: true,
            message: 'Autenticación exitosa'
        })

        response.cookies.set('admin-auth', cookieValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 24 horas en segundos
            path: '/admin'
        })

        return response

    } catch (error) {
        console.error('Error en autenticación admin:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

export async function DELETE() {
    // Endpoint para logout - limpiar cookie
    const response = NextResponse.json({
        success: true,
        message: 'Sesión cerrada'
    })

    response.cookies.delete('admin-auth')

    return response
} 