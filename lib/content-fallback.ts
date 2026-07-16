// ---------------------------------------------------------------
// withFallback: devuelve el valor editable del CMS, o el default
// hardcodeado cuando el CMS no tiene dato (null/undefined) o el
// string está vacío. Garantiza que la web pública nunca renderice
// un texto en blanco si un bloque de contenido todavía no existe.
// ---------------------------------------------------------------

export function withFallback<T>(value: T | null | undefined, fallback: T): T {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'string' && value.trim() === '') return fallback
    return value
}
