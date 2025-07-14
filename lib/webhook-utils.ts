import { NextRequest } from 'next/server';

export async function getRawBody(request: NextRequest): Promise<string> {
    try {
        // En Next.js App Router, el body ya viene como stream
        const body = await request.text();
        return body;
    } catch (error) {
        throw new Error('Failed to read request body');
    }
}

export function getSignatureHeader(request: NextRequest): string | null {
    // Intentar diferentes nombres de headers que podría usar MercadoPago
    const possibleHeaders = [
        'x-signature',
        'x-mp-signature', 
        'signature',
        'authorization'
    ];
    
    for (const headerName of possibleHeaders) {
        const value = request.headers.get(headerName);
        if (value) return value;
    }
    
    return null;
} 