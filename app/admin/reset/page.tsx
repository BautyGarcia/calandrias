'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { parseAuthHashTokens, parseAuthHashType } from '@/lib/auth-utils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2 } from "lucide-react"

export default function AdminResetPage() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)
    const [loading, setLoading] = useState(false)
    // null = comprobando, true/false = hay o no una sesión de recuperación.
    const [hasSession, setHasSession] = useState<boolean | null>(null)
    // El hash se consume al crear el cliente (detectSessionInUrl); leemos el
    // type antes para saber si es una invitación o un reset.
    const [isInvite, setIsInvite] = useState(false)

    useEffect(() => {
        const hash = window.location.hash
        setIsInvite(parseAuthHashType(hash) === 'invite')
        // El cliente browser usa flowType pkce y auth-js rechaza los hashes
        // implicit de los links de email, así que detectSessionInUrl no crea
        // la sesión: parseamos los tokens y la seteamos explícitamente.
        const tokens = parseAuthHashTokens(hash)
        const supabase = createBrowserSupabase()
        const session = tokens
            ? supabase.auth.setSession(tokens).then(({ data, error }) => {
                if (!error && data.session) {
                    // Sacamos los tokens de la URL para que no queden en el
                    // historial ni se reintente un setSession con tokens usados.
                    window.history.replaceState(null, '', window.location.pathname + window.location.search)
                    return true
                }
                return false
            })
            : supabase.auth.getSession().then(({ data }) => !!data.session)
        session.then(setHasSession)
    }, [])

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

        setLoading(true)
        try {
            const supabase = createBrowserSupabase()
            const { error: updateError } = await supabase.auth.updateUser({ password })
            if (updateError) {
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
                    <p className="text-[var(--slate-gray)]">
                        {isInvite ? 'Creá tu contraseña para acceder al panel' : 'Restablecer contraseña'}
                    </p>
                </div>

                <Card className="border-[var(--beige-arena)] shadow-lg">
                    <CardHeader className="border-b border-[var(--beige-arena)]">
                        <CardTitle className="text-[var(--brown-earth)] flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            {isInvite ? 'Bienvenido/a — creá tu contraseña' : 'Nueva contraseña'}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6">
                        {hasSession === null ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-[var(--brown-earth)]" />
                            </div>
                        ) : hasSession === false ? (
                            <Alert className="border-amber-200 bg-amber-50">
                                <AlertDescription className="text-amber-800">
                                    {isInvite
                                        ? 'El enlace de invitación no es válido o ya expiró. Pedile al administrador que te envíe una nueva invitación, o usá "¿Olvidaste tu contraseña?" en la pantalla de ingreso.'
                                        : <>El enlace de recuperación no es válido o ya expiró. Volvé a{' '}
                                            <a href="/admin/login" className="underline underline-offset-4">
                                                iniciar sesión
                                            </a>{' '}
                                            y solicitá uno nuevo.</>}
                                </AlertDescription>
                            </Alert>
                        ) : done ? (
                            <Alert className="border-green-200 bg-green-50">
                                <AlertDescription className="text-green-700">
                                    {isInvite ? 'Tu contraseña fue creada.' : 'Tu contraseña fue actualizada.'} Ya podés{' '}
                                    <a href="/admin/login" className="underline underline-offset-4">
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
