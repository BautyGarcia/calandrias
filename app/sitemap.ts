import { MetadataRoute } from 'next'
import { getAllCabinSlugs } from '@/data/cabins'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://las-calandrias.com'

    // Páginas estáticas principales
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/cabanas`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ]

    // Páginas dinámicas de cabañas
    const cabinSlugs = getAllCabinSlugs()
    const cabinPages: MetadataRoute.Sitemap = cabinSlugs.map((slug) => ({
        url: `${baseUrl}/cabanas/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    // Páginas de estado de reserva (indexables para mejor UX)
    const reservationPages: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/reserva-confirmada`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/reserva-pendiente`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/reserva-fallida`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]

    return [...staticPages, ...cabinPages, ...reservationPages]
} 