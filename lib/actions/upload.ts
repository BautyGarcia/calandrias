import 'server-only'
import { publicUrl, putObject } from '@/lib/s3'

// Lógica compartida de subida de imágenes al bucket S3 del proyecto (dbm).
// Las claves van bajo el prefijo `images/` (el bucket homónimo de Supabase se
// importó con ese prefijo) y se sirven por S3_PUBLIC_BASE_URL.
// La usan `uploadImageAction` (cabañas) y `uploadGalleryImageAction` (contenido).
// IMPORTANTE: el caller DEBE haber llamado `requireAdmin()` antes de invocar esto.

export type UploadResult = { ok: true; url: string } | { ok: false; error: string }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET_PREFIX = 'images'

// Normaliza el nombre del archivo a algo seguro para una clave de S3.
export function sanitizeFileName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

// Valida mime/tamaño y sube bajo `images/<dirPrefix>/`.
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
    const key = `${BUCKET_PREFIX}/${dirPrefix}/${Date.now()}-${sanitized}`

    try {
        const body = new Uint8Array(await file.arrayBuffer())
        await putObject(key, body, file.type)
        return { ok: true, url: publicUrl(key) }
    } catch {
        return { ok: false, error: 'No se pudo subir la imagen. Intentá nuevamente.' }
    }
}
