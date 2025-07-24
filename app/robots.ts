import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
        sitemap: 'https://las-calandrias.com/sitemap.xml',
        host: 'https://las-calandrias.com',
    }
} 