'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { swapSortOrder } from '@/lib/sort-order'
import {
    Plus,
    Pencil,
    Trash2,
    ArrowUp,
    ArrowDown,
    Loader2,
    Eye,
    EyeOff,
    Upload,
    ImageOff,
} from 'lucide-react'

type ActionResult = { ok: true } | { ok: false; error: string }
type UploadResult = { ok: true; url: string } | { ok: false; error: string }

export type CrudFieldControl = 'text' | 'textarea' | 'number' | 'select' | 'image'

export interface CrudField {
    name: string
    label: string
    control: CrudFieldControl
    help?: string
    placeholder?: string
    options?: { value: string; label: string }[]
    optional?: boolean
    min?: number
    max?: number
}

export interface CrudItem {
    id: string
    sortOrder: number
    isPublished: boolean
    [key: string]: string | number | boolean | null | undefined
}

type Draft = Record<string, string>

interface SortableCrudListProps {
    items: CrudItem[]
    fields: CrudField[]
    titleField: string
    subtitleField?: string
    addLabel: string
    entityLabel: string
    upsertAction: (input: Record<string, unknown>) => Promise<ActionResult>
    deleteAction: (id: string) => Promise<ActionResult>
    uploadAction?: (form: FormData) => Promise<UploadResult>
}

// Toggle simple (no hay componente switch en components/ui).
function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean
    onChange: (v: boolean) => void
    label: string
}) {
    return (
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3">
            <span
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                    checked ? 'bg-[var(--green-moss)]' : 'bg-[var(--beige-arena)]'
                )}
            >
                <span
                    className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                        checked ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                />
            </span>
            <span className="text-sm text-[var(--brown-earth)]">{label}</span>
        </button>
    )
}

function ImageDraftField({
    label,
    value,
    onChange,
    uploadAction,
}: {
    label: string
    value: string
    onChange: (url: string) => void
    uploadAction: (form: FormData) => Promise<UploadResult>
}) {
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setError('')
        const data = new FormData()
        data.set('file', file)
        startTransition(async () => {
            const result = await uploadAction(data)
            if (result.ok) onChange(result.url)
            else setError(result.error)
            e.target.value = ''
        })
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-start gap-4">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-sm border border-[var(--beige-arena)] bg-[var(--light-sand)]">
                    {value ? (
                        <Image src={value} alt={label} fill className="object-cover" sizes="128px" unoptimized />
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
                    <label className="inline-block">
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
                        <span className={cn('inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--beige-arena)] px-3 py-1.5 text-sm font-medium text-[var(--brown-earth)] hover:bg-[var(--light-sand)]', isPending && 'pointer-events-none opacity-60')}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Subir imagen
                        </span>
                    </label>
                    <p className="text-xs text-[var(--slate-gray)]">JPG, PNG o WEBP. Hasta 5 MB.</p>
                    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="o pegá una URL de imagen" className="text-xs" />
                </div>
            </div>
            {error && <p className="text-xs text-[var(--terracotta)]">{error}</p>}
        </div>
    )
}

export function SortableCrudList({
    items,
    fields,
    titleField,
    subtitleField,
    addLabel,
    entityLabel,
    upsertAction,
    deleteAction,
    uploadAction,
}: SortableCrudListProps) {
    const router = useRouter()
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const [busyId, setBusyId] = useState<string | null>(null)

    // Dialog de edición/alta.
    const [editing, setEditing] = useState<CrudItem | null>(null)
    const [isNew, setIsNew] = useState(false)
    const [draft, setDraft] = useState<Draft>({})
    const [draftPublished, setDraftPublished] = useState(true)
    const [dialogError, setDialogError] = useState('')

    // Confirmación de borrado.
    const [deleteTarget, setDeleteTarget] = useState<CrudItem | null>(null)

    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder)

    function emptyDraft(): Draft {
        const d: Draft = {}
        for (const f of fields) d[f.name] = ''
        return d
    }

    function draftFromItem(item: CrudItem): Draft {
        const d: Draft = {}
        for (const f of fields) {
            const v = item[f.name]
            d[f.name] = v === null || v === undefined ? '' : String(v)
        }
        return d
    }

    function itemToInput(item: CrudItem): Record<string, unknown> {
        const input: Record<string, unknown> = {
            id: item.id,
            sortOrder: item.sortOrder,
            isPublished: item.isPublished,
        }
        for (const f of fields) input[f.name] = item[f.name]
        return input
    }

    function openAdd() {
        setIsNew(true)
        setEditing(null)
        setDraft(emptyDraft())
        setDraftPublished(true)
        setDialogError('')
    }

    function openEdit(item: CrudItem) {
        setIsNew(false)
        setEditing(item)
        setDraft(draftFromItem(item))
        setDraftPublished(item.isPublished)
        setDialogError('')
    }

    function closeDialog() {
        setEditing(null)
        setIsNew(false)
    }

    const dialogOpen = isNew || editing !== null

    function handleSaveDialog() {
        setDialogError('')
        const nextSortOrder = isNew
            ? (items.reduce((max, i) => Math.max(max, i.sortOrder), 0) + 1)
            : editing!.sortOrder

        const input: Record<string, unknown> = {
            sortOrder: nextSortOrder,
            isPublished: draftPublished,
        }
        if (!isNew && editing) input.id = editing.id
        for (const f of fields) input[f.name] = draft[f.name] ?? ''

        startTransition(async () => {
            const result = await upsertAction(input)
            if (result.ok) {
                closeDialog()
                router.refresh()
            } else {
                setDialogError(result.error)
            }
        })
    }

    function handleTogglePublished(item: CrudItem) {
        setError('')
        setBusyId(item.id)
        startTransition(async () => {
            const result = await upsertAction({ ...itemToInput(item), isPublished: !item.isPublished })
            if (!result.ok) setError(result.error)
            setBusyId(null)
            router.refresh()
        })
    }

    function handleMove(index: number, direction: -1 | 1) {
        const target = index + direction
        if (target < 0 || target >= sorted.length) return
        const swapped = swapSortOrder(sorted, index, target)
        const a = swapped[index]
        const b = swapped[target]
        setError('')
        setBusyId(sorted[index].id)
        startTransition(async () => {
            const r1 = await upsertAction(itemToInput(a))
            const r2 = await upsertAction(itemToInput(b))
            if (!r1.ok) setError(r1.error)
            else if (!r2.ok) setError(r2.error)
            setBusyId(null)
            router.refresh()
        })
    }

    function handleDeleteConfirmed() {
        const item = deleteTarget
        if (!item) return
        setError('')
        setBusyId(item.id)
        setDeleteTarget(null)
        startTransition(async () => {
            const result = await deleteAction(item.id)
            if (!result.ok) setError(result.error)
            setBusyId(null)
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button type="button" onClick={openAdd}>
                    <Plus className="h-4 w-4" />
                    {addLabel}
                </Button>
            </div>

            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                {sorted.map((item, index) => {
                    const busy = isPending && busyId === item.id
                    return (
                        <Card key={item.id} className="flex items-center gap-3 p-3">
                            <div className="flex flex-col">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    aria-label="Subir"
                                    disabled={index === 0 || isPending}
                                    onClick={() => handleMove(index, -1)}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    aria-label="Bajar"
                                    disabled={index === sorted.length - 1 || isPending}
                                    onClick={() => handleMove(index, 1)}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className={cn('truncate text-sm font-medium', item.isPublished ? 'text-[var(--brown-earth)]' : 'text-[var(--slate-gray)]')}>
                                    {String(item[titleField] ?? '')}
                                </p>
                                {subtitleField && (
                                    <p className="truncate text-xs text-[var(--slate-gray)]">
                                        {String(item[subtitleField] ?? '')}
                                    </p>
                                )}
                            </div>

                            {busy && <Loader2 className="h-4 w-4 animate-spin text-[var(--brown-earth)]" />}

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={item.isPublished ? 'Ocultar' : 'Publicar'}
                                title={item.isPublished ? 'Visible en la web' : 'Oculto'}
                                disabled={isPending}
                                onClick={() => handleTogglePublished(item)}
                            >
                                {item.isPublished ? (
                                    <Eye className="h-4 w-4 text-[var(--green-moss)]" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-[var(--slate-gray)]" />
                                )}
                            </Button>
                            <Button type="button" variant="ghost" size="icon" aria-label="Editar" disabled={isPending} onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4 text-[var(--brown-earth)]" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" aria-label="Eliminar" disabled={isPending} onClick={() => setDeleteTarget(item)}>
                                <Trash2 className="h-4 w-4 text-[var(--terracotta)]" />
                            </Button>
                        </Card>
                    )
                })}

                {sorted.length === 0 && (
                    <p className="py-6 text-center text-sm text-[var(--slate-gray)]">Todavía no hay elementos.</p>
                )}
            </div>

            {/* Dialog alta / edición */}
            <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isNew ? `Nueva ${entityLabel}` : `Editar ${entityLabel}`}</DialogTitle>
                        <DialogDescription>Completá los datos y guardá los cambios.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {fields.map((f) => (
                            <div key={f.name} className="space-y-2">
                                {f.control !== 'image' && <Label htmlFor={`field-${f.name}`}>{f.label}</Label>}
                                {f.control === 'text' && (
                                    <Input
                                        id={`field-${f.name}`}
                                        value={draft[f.name] ?? ''}
                                        placeholder={f.placeholder}
                                        onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))}
                                    />
                                )}
                                {f.control === 'number' && (
                                    <Input
                                        id={`field-${f.name}`}
                                        type="number"
                                        min={f.min}
                                        max={f.max}
                                        value={draft[f.name] ?? ''}
                                        placeholder={f.placeholder}
                                        onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))}
                                    />
                                )}
                                {f.control === 'textarea' && (
                                    <Textarea
                                        id={`field-${f.name}`}
                                        rows={4}
                                        value={draft[f.name] ?? ''}
                                        placeholder={f.placeholder}
                                        onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))}
                                    />
                                )}
                                {f.control === 'select' && (
                                    <Select
                                        value={draft[f.name] ?? ''}
                                        onValueChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
                                    >
                                        <SelectTrigger id={`field-${f.name}`}>
                                            <SelectValue placeholder="Elegí una opción" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(f.options ?? []).map((o) => (
                                                <SelectItem key={o.value} value={o.value}>
                                                    {o.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {f.control === 'image' && uploadAction && (
                                    <ImageDraftField
                                        label={f.label}
                                        value={draft[f.name] ?? ''}
                                        onChange={(url) => setDraft((d) => ({ ...d, [f.name]: url }))}
                                        uploadAction={uploadAction}
                                    />
                                )}
                                {f.help && f.control !== 'image' && (
                                    <p className="text-xs text-[var(--slate-gray)]">{f.help}</p>
                                )}
                            </div>
                        ))}

                        <div className="rounded-sm border border-[var(--beige-arena)] p-3">
                            <Toggle checked={draftPublished} onChange={setDraftPublished} label="Visible en la web" />
                        </div>

                        {dialogError && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertDescription className="text-red-700">{dialogError}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleSaveDialog} disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmación de borrado */}
            <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent showCloseButton={false} className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminar {entityLabel}</DialogTitle>
                        <DialogDescription>
                            ¿Seguro que querés eliminar este elemento? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Volver
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirmed}>
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
