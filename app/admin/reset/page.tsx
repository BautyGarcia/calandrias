'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2 } from "lucide-react"

// Pantalla de nueva contraseña. better-auth verifica el token del mail en
// /api/auth/reset-password/:token y redirige acá con `?token=...` (o con
// `?error=INVALID_TOKEN` si venció o no es válido).
function AdminResetForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)
    const [loading, setLoading] = useState(false)

    const loginPath = typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')
        ? '/login'
        : '/admin/login'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.')
            return
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.')
            return
        }
        if (!token) return

        setLoading(true)
        try {
            const { error: resetError } = await authClient.resetPassword({ newPassword: password, token })
            if (resetError) {
                setError('No se pudo actualizar la contraseña. El enlace pudo haber expirado.')
                return
            }
            setDone(true)
        } catch {
            setError('Error de conexión. Intentá nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--soft-cream)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif text-[var(--brown-earth)] font-bold mb-2">
                        Calandrias
                    </h1>
                    <p className="text-[var(--slate-gray)]">Restablecer contraseña</p>
                </div>

                <Card className="border-[var(--beige-arena)] shadow-lg">
                    <CardHeader className="border-b border-[var(--beige-arena)]">
                        <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Nueva contraseña
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6">
                        {!token ? (
                            <Alert className="border-amber-200 bg-amber-50">
                                <AlertDescription className="text-amber-800">
                                    El enlace de recuperación no es válido o ya expiró. Volvé a{' '}
                                    <a href={loginPath} className="underline underline-offset-4">
                                        iniciar sesión
                                    </a>{' '}
                                    y solicitá uno nuevo.
                                </AlertDescription>
                            </Alert>
                        ) : done ? (
                            <Alert className="border-green-200 bg-green-50">
                                <AlertDescription className="text-green-700">
                                    Tu contraseña fue actualizada. Ya podés{' '}
                                    <a href={loginPath} className="underline underline-offset-4">
                                        ingresar al panel
                                    </a>.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[var(--brown-earth)]">
                                        Nueva contraseña
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--slate-gray)]" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            className="pl-10 border-[var(--beige-arena)] focus:border-[var(--brown-earth)]"
                                            required
                                            disabled={loading}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm" className="text-[var(--brown-earth)]">
                                        Confirmar contraseña
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--slate-gray)]" />
                                        <Input
                                            id="confirm"
                                            type="password"
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            placeholder="Repetí la contraseña"
                                            className="pl-10 border-[var(--beige-arena)] focus:border-[var(--brown-earth)]"
                                            required
                                            disabled={loading}
                                            autoComplete="new-password"
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

                                <Button
                                    type="submit"
                                    className="w-full bg-[var(--brown-earth)] hover:bg-[var(--dark-wood)] text-white"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar contraseña'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ResetLoading() {
    return (
        <div className="min-h-screen bg-[var(--soft-cream)] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brown-earth)]" />
        </div>
    )
}

export default function AdminResetPage() {
    return (
        <Suspense fallback={<ResetLoading />}>
            <AdminResetForm />
        </Suspense>
    )
}
