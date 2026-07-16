// Utilidades de auth puras, sin dependencias server-only, para poder
// importarlas también desde componentes cliente (ver lib/auth.ts para
// las utilidades que sí requieren el server).

/**
 * Sanitiza un destino de redirección post-login para evitar open redirects.
 * Solo acepta paths same-origin: deben empezar con exactamente un `/`
 * (nunca `//` ni `///`), no deben contener `\` (los navegadores lo tratan
 * como `/`, habilitando `/\evil.com` como protocol-relative), y no deben
 * contener `://` en ningún punto (defensa extra contra esquemas como
 * `javascript:` o URLs absolutas coladas en query params). Cualquier otro
 * caso devuelve el fallback.
 */
export function sanitizeRedirect(raw: string | null, fallback: string): string {
    if (!raw) return fallback
    if (!raw.startsWith('/')) return fallback
    if (raw.startsWith('//')) return fallback
    if (raw.includes('\\')) return fallback
    if (raw.includes('://')) return fallback
    return raw
}
