// Resuelve la URL de una imagen de cabaña. Las imágenes viven como rutas
// locales (`/cabin4.jpg`) o URLs absolutas (`https://...supabase.co/...`);
// en ambos casos se devuelven tal cual.
export function imageUrl(path: string | null | undefined): string {
    if (!path) return ''
    if (path.startsWith('/') || path.startsWith('http')) return path
    return `/${path}`
}
