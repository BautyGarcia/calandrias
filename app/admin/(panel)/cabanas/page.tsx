import Link from 'next/link'
import Image from 'next/image'
import { requireAdmin } from '@/lib/auth'
import { getAllCabinsAdmin } from '@/lib/db/cabins'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageOff, Pencil } from 'lucide-react'

const arsFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

// Server Component: lista TODAS las cabañas (incluidas las ocultas) como cards
// que enlazan a la edición. El layout ya llama requireAdmin(); lo reforzamos acá.
export default async function CabanasPage() {
    await requireAdmin()

    const cabins = await getAllCabinsAdmin()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-[var(--brown-earth)]">Cabañas</h1>
                <p className="text-sm text-[var(--slate-gray)]">
                    Editá el contenido, las fotos, los precios y la sincronización con Airbnb de cada cabaña.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cabins.map((cabin) => (
                    <Link key={cabin.slug} href={`/admin/cabanas/${cabin.slug}`} className="group">
                        <Card className="overflow-hidden p-0 transition-shadow group-hover:shadow-xl">
                            <div className="relative h-40 w-full bg-[var(--light-sand)]">
                                {cabin.thumbnail.url || cabin.image.url ? (
                                    <Image
                                        src={cabin.thumbnail.url || cabin.image.url}
                                        alt={cabin.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 100vw, 33vw"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[var(--slate-gray)]">
                                        <ImageOff className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="absolute right-2 top-2">
                                    {cabin.publishedAt !== '' ? (
                                        <Badge className="bg-[var(--green-moss)] text-white">Visible</Badge>
                                    ) : (
                                        <Badge className="bg-[var(--slate-gray)] text-white">Oculta</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="font-serif text-lg font-bold text-[var(--brown-earth)]">
                                        {cabin.name}
                                    </h2>
                                    <Pencil className="h-4 w-4 shrink-0 text-[var(--slate-gray)] transition-colors group-hover:text-[var(--brown-earth)]" />
                                </div>
                                <p className="text-sm text-[var(--slate-gray)]">{cabin.subtitle}</p>
                                <p className="pt-1 text-sm font-medium text-[var(--brown-earth)]">
                                    {arsFormatter.format(cabin.precio_base_noche)} / noche
                                </p>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {cabins.length === 0 && (
                <p className="text-sm text-[var(--slate-gray)]">Todavía no hay cabañas cargadas.</p>
            )}
        </div>
    )
}
