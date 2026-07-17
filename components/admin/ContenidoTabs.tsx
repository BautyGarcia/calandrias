'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FileText, HelpCircle, Star, Images } from 'lucide-react'
import { SiteTextsEditor } from '@/components/admin/SiteTextsEditor'
import { SortableCrudList, type CrudField, type CrudItem } from '@/components/admin/SortableCrudList'
import {
    upsertFaqAction,
    deleteFaqAction,
    upsertReviewAction,
    deleteReviewAction,
    upsertGalleryItemAction,
    deleteGalleryItemAction,
    uploadGalleryImageAction,
    uploadReviewAvatarAction,
    reorderFaqsAction,
    reorderReviewsAction,
    reorderGalleryAction,
} from '@/app/admin/(panel)/contenido/actions'
import type { Faq, Review, GalleryItem } from '@/types/db'
import type {
    HeroContent,
    ServicesContent,
    CtaContent,
    CabinsTeaserContent,
    SeoContent,
} from '@/lib/content-schemas'

type Tab = 'textos' | 'faqs' | 'resenas' | 'galeria'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'textos', label: 'Textos', icon: FileText },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'resenas', label: 'Reseñas', icon: Star },
    { id: 'galeria', label: 'Galería', icon: Images },
]

const FAQ_FIELDS: CrudField[] = [
    { name: 'question', label: 'Pregunta', control: 'text', placeholder: '¿Cómo realizo una reserva?' },
    { name: 'answer', label: 'Respuesta', control: 'textarea' },
]

const REVIEW_FIELDS: CrudField[] = [
    { name: 'name', label: 'Nombre', control: 'text' },
    { name: 'location', label: 'Ubicación', control: 'text', placeholder: 'Buenos Aires' },
    { name: 'text', label: 'Reseña', control: 'textarea' },
    { name: 'rating', label: 'Puntaje (1 a 5)', control: 'number', min: 1, max: 5 },
    { name: 'avatarUrl', label: 'Foto del huésped (opcional)', control: 'image', optional: true },
]

const GALLERY_FIELDS: CrudField[] = [
    { name: 'title', label: 'Título', control: 'text' },
    { name: 'description', label: 'Descripción', control: 'textarea' },
    { name: 'imageUrl', label: 'Imagen', control: 'image' },
    {
        name: 'span',
        label: 'Tamaño en la grilla',
        control: 'select',
        help: 'Cómo se muestra en la galería.',
        options: [
            { value: 'col-span-1 row-span-2', label: 'Normal' },
            { value: 'col-span-2 row-span-2', label: 'Ancho' },
        ],
    },
]

interface ContenidoTabsProps {
    hero: HeroContent
    services: ServicesContent
    cta: CtaContent
    cabinsTeaser: CabinsTeaserContent
    seo: SeoContent
    faqs: Faq[]
    reviews: Review[]
    gallery: GalleryItem[]
}

export function ContenidoTabs({
    hero,
    services,
    cta,
    cabinsTeaser,
    seo,
    faqs,
    reviews,
    gallery,
}: ContenidoTabsProps) {
    const [tab, setTab] = useState<Tab>('textos')

    return (
        <div>
            <div className="mb-6 flex flex-wrap gap-1 rounded-md bg-[var(--light-sand)] p-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn(
                            'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                            tab === id
                                ? 'bg-white text-[var(--brown-earth)] shadow-sm'
                                : 'text-[var(--slate-gray)] hover:text-[var(--brown-earth)]'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'textos' && (
                <SiteTextsEditor hero={hero} services={services} cta={cta} cabinsTeaser={cabinsTeaser} seo={seo} />
            )}

            {tab === 'faqs' && (
                <SortableCrudList
                    items={faqs as unknown as CrudItem[]}
                    fields={FAQ_FIELDS}
                    titleField="question"
                    subtitleField="answer"
                    addLabel="Agregar pregunta"
                    entityLabel="pregunta"
                    upsertAction={upsertFaqAction}
                    deleteAction={deleteFaqAction}
                    reorderAction={reorderFaqsAction}
                />
            )}

            {tab === 'resenas' && (
                <SortableCrudList
                    items={reviews as unknown as CrudItem[]}
                    fields={REVIEW_FIELDS}
                    titleField="name"
                    subtitleField="location"
                    thumbnailField="avatarUrl"
                    addLabel="Agregar reseña"
                    entityLabel="reseña"
                    upsertAction={upsertReviewAction}
                    deleteAction={deleteReviewAction}
                    reorderAction={reorderReviewsAction}
                    uploadAction={uploadReviewAvatarAction}
                />
            )}

            {tab === 'galeria' && (
                <SortableCrudList
                    items={gallery as unknown as CrudItem[]}
                    fields={GALLERY_FIELDS}
                    titleField="title"
                    subtitleField="description"
                    thumbnailField="imageUrl"
                    addLabel="Agregar imagen"
                    entityLabel="imagen"
                    upsertAction={upsertGalleryItemAction}
                    deleteAction={deleteGalleryItemAction}
                    reorderAction={reorderGalleryAction}
                    uploadAction={uploadGalleryImageAction}
                />
            )}
        </div>
    )
}
