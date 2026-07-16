import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export function isAdminEmail(email: string | undefined): boolean {
    if (!email) return false
    const allowed = (process.env.ADMIN_EMAILS || '')
        .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    return allowed.includes(email.trim().toLowerCase())
}

export async function requireAdmin(): Promise<{ email: string }> {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) redirect('/admin/login')
    return { email: user.email! }
}
