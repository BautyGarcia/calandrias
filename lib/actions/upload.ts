import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

// Lógica compartida de subida de imágenes al bucket `images`.
// La usan `uploadImageAction` (cabañas) y `uploadGalleryImageAction` (contenido).
// IMPORTANTE: el caller DEBE haber llamado `requireAdmin()` antes de invocar esto.

export type UploadResult = { ok: true; url: string } | { ok: false; error: string }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

// Normaliza el nombre del archivo a algo seguro para una ruta de Storage.
export function sanitizeFileName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

// Valida mime/tamaño y sube al bucket `images` bajo `dirPrefix/`.
// Devuelve la URL pública o un error en español.
export async function uploadImageToBucket(
    file: File,
    dirPrefix: string
): Promise<UploadResult> {
    if (!ALLOWED_MIME.includes(file.type)) {
        return { ok: false, error: 'Formato no permitido. Subí una imagen JPG, PNG o WEBP.' }
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return { ok: false, error: 'La imagen supera los 5 MB. Probá con una más liviana.' }
    }

    const sanitized = sanitizeFileName(file.name) || 'imagen'
    const path = `${dirPrefix}/${Date.now()}-${sanitized}`

    try {
        const supabase = createAdminClient()
        const buffer = Buffer.from(await file.arrayBuffer())
        const { error } = await supabase.storage
            .from('images')
            .upload(path, buffer, { contentType: file.type, upsert: false })
        if (error) return { ok: false, error: 'No se pudo subir la imagen. Intentá nuevamente.' }

        const { data } = supabase.storage.from('images').getPublicUrl(path)
        return { ok: true, url: data.publicUrl }
    } catch {
        return { ok: false, error: 'No se pudo subir la imagen. Intentá nuevamente.' }
    }
}
