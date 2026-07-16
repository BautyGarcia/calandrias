'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, Loader2, ImageOff } from 'lucide-react'
import { uploadImageAction } from '@/app/admin/(panel)/cabanas/actions'

interface ImageUploadFieldProps {
    label: string
    slug: string
    value: string
    onChange: (url: string) => void
}

// Campo de imagen: preview + subida a Storage (via uploadImageAction).
// La URL resultante se guarda en el estado del formulario.
export function ImageUploadField({ label, slug, value, onChange }: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setError('')

        const data = new FormData()
        data.set('file', file)
        data.set('slug', slug)

        startTransition(async () => {
            const result = await uploadImageAction(data)
            if (result.ok) {
                onChange(result.url)
            } else {
                setError(result.error)
            }
            if (inputRef.current) inputRef.current.value = ''
        })
    }

    return (
        <div className="space-y-3">
            <Label>{label}</Label>

            <div className="flex items-start gap-4">
                <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-sm border border-[var(--beige-arena)] bg-[var(--light-sand)]">
                    {value ? (
                        <Image src={value} alt={label} fill className="object-cover" sizes="160px" unoptimized />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--slate-gray)]">
                            <ImageOff className="h-6 w-6" />
                        </div>
                    )}
                    {isPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--brown-earth)]" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFile}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => inputRef.current?.click()}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Subir imagen
                    </Button>
                    <p className="text-xs text-[var(--slate-gray)]">JPG, PNG o WEBP. Hasta 5 MB.</p>
                </div>
            </div>

            {error && <p className="text-xs text-[var(--terracotta)]">{error}</p>}
        </div>
    )
}
