import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Cliente service_role: bypasea RLS. SOLO importable desde código server.
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    )
}
