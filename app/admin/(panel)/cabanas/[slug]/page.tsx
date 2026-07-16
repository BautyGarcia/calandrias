import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getCabinForAdmin, getAirbnbIcalUrl } from '@/lib/db/cabins'
import { CabinForm } from '@/components/admin/CabinForm'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
    params: Promise<{ slug: string }>
}

// Server Component: carga la cabaña (incluida si está oculta) y su URL de Airbnb,
// y delega la edición al Client Component con tabs.
export default async function EditCabinPage({ params }: PageProps) {
    await requireAdmin()

    const { slug } = await params
    const cabin = await getCabinForAdmin(slug)
    if (!cabin) notFound()

    const airbnbUrl = await getAirbnbIcalUrl(cabin.documentId)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <Link
                    href="/admin/cabanas"
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--slate-gray)] hover:text-[var(--brown-earth)]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Cabañas
                </Link>
                <h1 className="mt-2 font-serif text-2xl font-bold text-[var(--brown-earth)]">{cabin.name}</h1>
                <p className="text-sm text-[var(--slate-gray)]">
                    Editá el contenido de la cabaña. Recordá guardar los cambios.
                </p>
            </div>

            <CabinForm cabin={cabin} airbnbUrl={airbnbUrl} siteUrl={siteUrl} />
        </div>
    )
}
