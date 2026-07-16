import { requireAdmin } from '@/lib/auth'
import {
    getSiteContent,
    getFaqs,
    getReviews,
    getGalleryItems,
} from '@/lib/db/content'
import { ContenidoTabs } from '@/components/admin/ContenidoTabs'
import type {
    HeroContent,
    ServicesContent,
    CtaContent,
    CabinsTeaserContent,
    SeoContent,
} from '@/lib/content-schemas'

// Defaults por si algún bloque todavía no está en la base (evita romper el form).
const HERO_DEFAULT: HeroContent = { title: '', subtitle: '', ctaLabel: '' }
const SERVICES_DEFAULT: ServicesContent = {
    title: '',
    items: [
        { icon: '', title: '', description: '' },
        { icon: '', title: '', description: '' },
        { icon: '', title: '', description: '' },
    ],
}
const CTA_DEFAULT: CtaContent = { title: '', subtitle: '', buttonLabel: '' }
const TEASER_DEFAULT: CabinsTeaserContent = {
    title: '',
    subtitle: '',
    stats: [{ value: '', label: '' }],
    features: [{ title: '', description: '' }],
    ctaLabel: '',
}
const SEO_DEFAULT: SeoContent = { title: '', description: '', keywords: '' }

export default async function ContenidoPage() {
    await requireAdmin()

    const [hero, services, cta, cabinsTeaser, seo, faqs, reviews, gallery] = await Promise.all([
        getSiteContent<HeroContent>('hero'),
        getSiteContent<ServicesContent>('services'),
        getSiteContent<CtaContent>('cta'),
        getSiteContent<CabinsTeaserContent>('cabins_teaser'),
        getSiteContent<SeoContent>('seo'),
        getFaqs(true),
        getReviews(true),
        getGalleryItems(true),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-[var(--brown-earth)]">Contenido</h1>
                <p className="text-sm text-[var(--slate-gray)]">
                    Editá los textos de la web, las preguntas frecuentes, las reseñas y la galería de fotos.
                </p>
            </div>

            <ContenidoTabs
                hero={hero ?? HERO_DEFAULT}
                services={services ?? SERVICES_DEFAULT}
                cta={cta ?? CTA_DEFAULT}
                cabinsTeaser={cabinsTeaser ?? TEASER_DEFAULT}
                seo={seo ?? SEO_DEFAULT}
                faqs={faqs}
                reviews={reviews}
                gallery={gallery}
            />
        </div>
    )
}
