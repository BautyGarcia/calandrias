import { requireAdmin } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

// Layout del backoffice autenticado. `requireAdmin()` es defensa en profundidad
// (además del check por acción): redirige a /admin/login si no hay sesión admin.
// No envuelve /admin/login ni /admin/reset porque esos viven fuera del route group.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
    const { email } = await requireAdmin()
    return <AdminShell email={email}>{children}</AdminShell>
}
