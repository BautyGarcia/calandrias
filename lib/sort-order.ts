// Helper puro para reordenar listas del backoffice (FAQs, reseñas, galería).
// Intercambia los valores de `sortOrder` de los items en `indexA`/`indexB`
// devolviendo una copia nueva (no muta el original). Si los índices son
// inválidos o iguales, devuelve el array original sin cambios.
export function swapSortOrder<T extends { sortOrder: number }>(
    items: T[],
    indexA: number,
    indexB: number
): T[] {
    if (
        indexA === indexB ||
        indexA < 0 ||
        indexB < 0 ||
        indexA >= items.length ||
        indexB >= items.length
    ) {
        return items
    }

    const next = items.map((item) => ({ ...item }))
    const tmp = next[indexA].sortOrder
    next[indexA].sortOrder = next[indexB].sortOrder
    next[indexB].sortOrder = tmp
    return next
}
