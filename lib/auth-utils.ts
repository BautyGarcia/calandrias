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

/**
 * Extrae el parámetro `type` del hash de un callback de Supabase Auth
 * (`#access_token=…&type=invite`). Se usa para adaptar la copy de la página
 * de reset según el flujo (invite vs recovery). Debe leerse ANTES de crear
 * el cliente browser de Supabase, que consume y limpia el hash
 * (detectSessionInUrl). Devuelve null si no hay hash válido o no trae type.
 */
export function parseAuthHashType(hash: string): string | null {
    if (!hash.startsWith('#')) return null
    return new URLSearchParams(hash.slice(1)).get('type') || null
}
