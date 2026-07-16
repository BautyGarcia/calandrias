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

/**
 * Extrae los tokens de sesión del hash de un callback de Supabase Auth.
 * Los links de email de Supabase (invite/recovery) usan el flujo implicit
 * (tokens en el hash), pero el cliente browser de @supabase/ssr se crea con
 * flowType 'pkce' y auth-js RECHAZA hashes implicit en modo pkce ("Not a
 * valid PKCE flow url"), por lo que detectSessionInUrl nunca crea la sesión.
 * La página debe parsear los tokens con esto y llamar setSession() explícito.
 */
export function parseAuthHashTokens(hash: string): { access_token: string; refresh_token: string } | null {
    if (!hash.startsWith('#')) return null
    const params = new URLSearchParams(hash.slice(1))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) return null
    return { access_token, refresh_token }
}
