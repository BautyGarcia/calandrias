'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { sanitizeRedirect } from '@/lib/auth-utils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Mail, Loader2 } from "lucide-react"

// Path de la pantalla de reset según el host: en admin.<dominio> la URL visible
// es /reset (el middleware la reescribe a /admin/reset).
function resetPath(): string {
    return window.location.pathname.startsWith('/admin') ? '/admin/reset' : '/reset'
}

function AdminLoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const [loading, setLoading] = useState(false)
    const [resetting, setResetting] = useState(false)
    // 'login' | 'signup': el alta reemplaza la invitación por mail de Supabase.
    // Solo los emails de ADMIN_EMAILS pueden crear cuenta (lo valida el server).
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const searchParams = useSearchParams()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setInfo('')

        try {
            const credentials = { email: email.trim(), password }
            const result = mode === 'signup'
                ? await authClient.signUp.email({ ...credentials, name: credentials.email })
                : await authClient.signIn.email(credentials)

            if (result.error) {
                // Mensajes genéricos: nunca revelar si el email existe.
                setError(mode === 'signup'
                    ? 'No se pudo crear la cuenta. Verificá que tu email esté habilitado como administrador y que la contraseña tenga al menos 8 caracteres.'
                    : 'Credenciales incorrectas')
                return
            }

            // Las cookies ya fueron seteadas por la respuesta de /api/auth.
            // Navegación completa para que el middleware vea las cookies frescas.
            const redirectTo = sanitizeRedirect(searchParams.get('redirect'), '/admin/reservas')
            window.location.assign(redirectTo)
        } catch {
            setError('Error de conexión. Intentá nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        setError('')
        setInfo('')

        if (!email.trim()) {
            setError('Ingresá tu email para recuperar la contraseña.')
            return
        }

        setResetting(true)
        try {
            await authClient.requestPasswordReset({
                email: email.trim(),
                redirectTo: `${window.location.origin}${resetPath()}`,
            })
            // Mensaje genérico: no revelar si el email está registrado.
            setInfo('Si el email está registrado, te enviamos un enlace para restablecer la contraseña.')
        } catch {
            setError('No se pudo enviar el email. Intentá nuevamente.')
        } finally {
            setResetting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--soft-cream)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif text-[var(--brown-earth)] font-bold mb-2">
                        Calandrias
                    </h1>
                    <p className="text-[var(--slate-gray)]">
                        Panel de Administración
                    </p>
                </div>

                <Card className="border-[var(--beige-arena)] shadow-lg">
                    <CardHeader className="border-b border-[var(--beige-arena)]">
                        <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            {mode === 'signup' ? 'Crear cuenta de administrador' : 'Ingresar al panel'}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[var(--brown-earth)]">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--slate-gray)]" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        className="pl-10 border-[var(--beige-arena)] focus:border-[var(--brown-earth)]"
                                        required
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[var(--brown-earth)]">
                                    Contraseña
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--slate-gray)]" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : 'Ingresá tu contraseña'}
                                        className="pl-10 border-[var(--beige-arena)] focus:border-[var(--brown-earth)]"
                                        required
                                        minLength={mode === 'signup' ? 8 : undefined}
                                        disabled={loading}
                                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                    />
                                </div>
                            </div>

                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-700">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {info && (
                                <Alert className="border-green-200 bg-green-50">
                                    <AlertDescription className="text-green-700">
                                        {info}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-[var(--brown-earth)] hover:bg-[var(--dark-wood)] text-white"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {mode === 'signup' ? 'Creando cuenta...' : 'Ingresando...'}
                                    </>
                                ) : (
                                    mode === 'signup' ? 'Crear cuenta' : 'Ingresar al panel'
                                )}
                            </Button>

                            {mode === 'login' && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={resetting || loading}
                                    className="w-full text-sm text-[var(--slate-gray)] hover:text-[var(--brown-earth)] underline underline-offset-4 disabled:opacity-60"
                                >
                                    {resetting ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
                                disabled={loading}
                                className="w-full text-sm text-[var(--slate-gray)] hover:text-[var(--brown-earth)] underline underline-offset-4 disabled:opacity-60"
                            >
                                {mode === 'login' ? '¿Primera vez? Creá tu cuenta' : 'Ya tengo cuenta: ingresar'}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center mt-6">
                    <p className="text-sm text-[var(--slate-gray)]">
                        Acceso restringido solo para administradores
                    </p>
                </div>
            </div>
        </div>
    )
}

function LoginLoading() {
    return (
        <div className="min-h-screen bg-[var(--soft-cream)] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brown-earth)]" />
        </div>
    )
}

export default function AdminLogin() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <AdminLoginForm />
        </Suspense>
    )
}
