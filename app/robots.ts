import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calandrias.com.ar'

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/cabanas',
                    '/cabanas/*',
                    '/reserva-confirmada',
                    '/reserva-pendiente',
                    '/reserva-fallida',
                ],
                disallow: [
                    '/api/*',
                    '/admin/*',
                    '/app/*',
                    '/_next/*',
                    '/private/*',
                    '*.json',
                    '/test*',
                    '/debug*',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: [
                    '/',
                    '/cabanas',
                    '/cabanas/*',
                ],
                disallow: [
                    '/api/*',
                    '/admin/*',
                    '/reserva-confirmada',
                    '/reserva-pendiente',
                    '/reserva-fallida',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    }
} 