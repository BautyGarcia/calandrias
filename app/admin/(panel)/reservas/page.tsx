import { requireAdmin } from '@/lib/auth'
import { getReservations } from '@/lib/db/reservations'
import { getCabins } from '@/lib/db/cabins'
import { ReservationsTable } from '@/components/admin/ReservationsTable'
import { toReservationView, sortByCheckIn, reservationStats } from '@/lib/reservations-view'

// Server Component: hace las lecturas (server-only) y pasa datos serializables
// a los Client Components. El layout ya llama requireAdmin(); lo reforzamos acá.
export default async function ReservasPage() {
    await requireAdmin()

    const [reservations, cabins] = await Promise.all([getReservations(), getCabins()])

    const views = sortByCheckIn(reservations.map(toReservationView))
    const cabinOptions = cabins.map((c) => ({ slug: c.slug, name: c.name }))

    // 'YYYY-MM' del mes en curso (UTC, consistente con el formato de checkIn).
    const monthKey = new Date().toISOString().slice(0, 7)
    const stats = reservationStats(views, monthKey)

    return <ReservationsTable reservations={views} cabins={cabinOptions} stats={stats} />
}
