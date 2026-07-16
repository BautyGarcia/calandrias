// Utilidades de auth puras, sin dependencias server-only, para poder
// importarlas también desde componentes cliente (ver lib/auth.ts para
// las utilidades que sí requieren el server).

/**
 * Sanitiza un destino de redirección post-login para evitar open redirects.
 * Solo acepta paths same-origin: deben empezar con exactamente un `/`
 * (nunca `//` ni `///`), no deben contener `\` (los navegadores lo tratan
 * como `/`, habilitando `/\evil.com` como protocol-relative), y no deben
 * contener `://` en ningún punto (defensa extra contra esquemas como
 * `javascript:` o URLs absolutas coladas en query params). Tampoco deben
 * contener caracteres de control ASCII (tab, `\n`, `\r`, NUL, etc.): el
 * parser WHATWG de URL de los navegadores los elimina de la cadena completa
 * antes de parsear, así que algo como `/\t/evil.com` pasa los checks de
 * arriba sin cambios pero termina navegando a `//evil.com` (protocol-relative)
 * una vez que el navegador lo normaliza. Cualquier otro caso devuelve el
 * fallback.
 */
export function sanitizeRedirect(raw: string | null, fallback: string): string {
    if (!raw) return fallback
    if (!raw.startsWith('/')) return fallback
    if (raw.startsWith('//')) return fallback
    if (raw.includes('\\')) return fallback
    if (raw.includes('://')) return fallback
    // eslint-disable-next-line no-control-regex -- intencional: detectar chars de control ASCII
    if (/[\x00-\x1f\x7f]/.test(raw)) return fallback
    return raw
}
