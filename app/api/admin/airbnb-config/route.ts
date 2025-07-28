import { NextRequest, NextResponse } from 'next/server'
import {
    getAllAirbnbConfigurations,
    validateAirbnbConfigurations,
    getConfiguredICalUrls
} from '@/utils/cabins'

export async function GET(request: NextRequest) {
    // Verificar autorización
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        const configurations = getAllAirbnbConfigurations()
        const validations = validateAirbnbConfigurations()
        const configuredUrls = getConfiguredICalUrls()

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                totalUrls: configuredUrls.length,
                validConfigurations: validations.filter(v => v.isValid).length,
                invalidConfigurations: validations.filter(v => !v.isValid).length
            },
            configurations,
            validations,
            configuredUrls
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
} 