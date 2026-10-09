import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/better-auth'
import { isAdminEmail } from '@/lib/auth-utils'

export { isAdminEmail }

// Única puerta de entrada del backoffice: sesión válida de better-auth cuyo
// email esté en la allowlist ADMIN_EMAILS. Toda server action y route handler
// del panel debe llamarla primero (el middleware solo hace un chequeo
// optimista por cookie).
export async function requireAdmin(): Promise<{ email: string }> {
    const session = await auth.api.getSession({ headers: await headers() })
    const email = session?.user.email
    if (!session || !isAdminEmail(email)) redirect('/admin/login')
    return { email: email! }
}
