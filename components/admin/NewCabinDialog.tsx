'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { slugifyCabinName } from '@/lib/cabin-form'
import { createCabinAction } from '@/app/admin/(panel)/cabanas/actions'

// Botón "Nueva cabaña" + dialog de alta: pide nombre (el slug se autogenera
// y se puede retocar solo acá — después queda fijo porque identifica la
// cabaña en la URL pública y en las reservas). Crea la cabaña oculta y
// redirige al editor para completar contenido, fotos y precios.
export function NewCabinDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [slugTouched, setSlugTouched] = useState(false)
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    function reset() {
        setName('')
        setSlug('')
        setSlugTouched(false)
        setError('')
    }

    function handleNameChange(value: string) {
        setName(value)
        if (!slugTouched) setSlug(slugifyCabinName(value))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        startTransition(async () => {
            const result = await createCabinAction({ name, slug })
            if (result.ok) {
                setOpen(false)
                reset()
                router.push(`/admin/cabanas/${result.slug}`)
            } else {
                setError(result.error)
            }
        })
    }

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva cabaña
            </Button>

            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nueva cabaña</DialogTitle>
                        <DialogDescription>
                            Se crea oculta para que la completes tranquilo; la publicás desde el
                            editor cuando esté lista.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-cabin-name">Nombre</Label>
                            <Input
                                id="new-cabin-name"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Cabaña El Ombú"
                                autoFocus
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-cabin-slug">Dirección en la web (slug)</Label>
                            <Input
                                id="new-cabin-slug"
                                value={slug}
                                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value) }}
                                placeholder="cabana-el-ombu"
                                disabled={isPending}
                            />
                            <p className="text-xs text-[var(--slate-gray)]">
                                La cabaña se verá en calandrias.com.ar/cabanas/<span className="font-medium">{slug || '…'}</span>.
                                No se puede cambiar después.
                            </p>
                        </div>

                        {error && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertDescription className="text-red-700">{error}</AlertDescription>
                            </Alert>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending || !name.trim() || !slug.trim()}>
                                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Crear y completar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
