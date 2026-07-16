'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Mail, Loader2 } from "lucide-react"

function AdminLoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const [loading, setLoading] = useState(false)
    const [resetting, setResetting] = useState(false)
    const searchParams = useSearchParams()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setInfo('')

        try {
            const supabase = createBrowserSupabase()
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            })

            if (signInError) {
                // Mensaje genérico: nunca revelar si el email existe.
                setError('Credenciales incorrectas')
                return
            }

            // Las cookies ya fueron seteadas por el cliente de @supabase/ssr.
            // Navegación completa para que el middleware vea las cookies frescas.
            const redirectTo = searchParams.get('redirect') || '/admin/reservas'
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
            const supabase = createBrowserSupabase()
            await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${process.env.NEXT_PUBLIC_ADMIN_URL}/reset`,
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
                            Ingresar al panel
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={handleLogin} className="space-y-4">
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
                                        placeholder="Ingresá tu contraseña"
                                        className="pl-10 border-[var(--beige-arena)] focus:border-[var(--brown-earth)]"
                                        required
                                        disabled={loading}
                                        autoComplete="current-password"
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
                                        Ingresando...
                                    </>
                                ) : (
                                    'Ingresar al panel'
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={resetting || loading}
                                className="w-full text-sm text-[var(--slate-gray)] hover:text-[var(--brown-earth)] underline underline-offset-4 disabled:opacity-60"
                            >
                                {resetting ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
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
