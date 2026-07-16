// Fixture congelado con el slug + name de las cabañas sembradas en
// supabase/seed.sql. Reemplaza la dependencia del test hacia el archivo
// (deprecado y eliminado) `data/cabins.ts`.
export const seedCabins = [
    { slug: 'retiro-exclusivo', name: 'Las Calandrias de Tandil 1' },
    { slug: 'confort-familiar', name: 'Las Calandrias de Tandil 4' },
    { slug: 'experiencia-premium', name: 'Las Calandrias de Tandil 5' },
] as const
