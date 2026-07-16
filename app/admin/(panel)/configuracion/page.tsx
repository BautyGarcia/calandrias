import { requireAdmin } from '@/lib/auth'
import { getSiteSettings } from '@/lib/db/content'
import { ConfiguracionForm } from '@/components/admin/ConfiguracionForm'

export default async function ConfiguracionPage() {
    await requireAdmin()

    const settings = await getSiteSettings()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-[var(--brown-earth)]">Configuración</h1>
                <p className="text-sm text-[var(--slate-gray)]">
                    Activá o desactivá las reservas online y editá los datos de contacto que se muestran en toda la web.
                </p>
            </div>

            <ConfiguracionForm settings={settings} />
        </div>
    )
}
