// Helper puro para reordenar listas del backoffice (FAQs, reseñas, galería).
// Mueve el elemento en `from` a la posición `to` desplazando el resto,
// devolviendo una copia nueva (no muta el original). Si los índices son
// inválidos o iguales, devuelve el array original sin cambios.
export function moveItem<T>(items: T[], from: number, to: number): T[] {
    if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= items.length ||
        to >= items.length
    ) {
        return items
    }

    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
}
