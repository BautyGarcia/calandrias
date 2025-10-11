import { NextRequest, NextResponse } from 'next/server'
import { StrapiAPI } from '@/lib/strapi'

/**
 * API Endpoint protegido para obtener configuraciones de sync de Airbnb
 * Solo accesible con CRON_SECRET para uso interno del servidor
 * Las URLs de iCal nunca se exponen al frontend público
 */
export async function GET(request: NextRequest) {
    try {
        // Verificar autorización estricta
        const authHeader = request.headers.get('authorization')
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
        
        if (!authHeader || authHeader !== expectedAuth) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Obtener configuraciones desde Strapi
        const strapiAPI = new StrapiAPI()
        const configs = await strapiAPI.getAirbnbSyncConfigs()
        
        return NextResponse.json({
            success: true,
            configs,
            count: configs.length
        })
        
    } catch (error) {
        console.error('Error fetching sync configs:', error)
        return NextResponse.json(
            {
                error: 'Error fetching cabin sync configurations',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

