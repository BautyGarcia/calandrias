'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDays, Home, FileText, Settings, Menu, LogOut } from 'lucide-react'

interface NavItem {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

// Sólo Reservas está construida en esta tarea; el resto resuelve en Tasks 9-11.
const NAV_ITEMS: NavItem[] = [
    { label: 'Reservas', href: '/admin/reservas', icon: CalendarDays },
    { label: 'Cabañas', href: '/admin/cabanas', icon: Home },
    { label: 'Contenido', href: '/admin/contenido', icon: FileText },
    { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
    return (
        <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            active
                                ? 'bg-[var(--brown-earth)] text-white'
                                : 'text-[var(--brown-earth)] hover:bg-[var(--light-sand)]'
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                    </Link>
                )
            })}
        </nav>
    )
}

function LogoutForm({ className }: { className?: string }) {
    return (
        <form action="/api/admin/logout" method="post" className={className}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
                <LogOut className="h-4 w-4" />
                Salir
            </Button>
        </form>
    )
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[var(--soft-cream)]">
            {/* Sidebar fijo (desktop) */}
            <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col md:border-r md:border-[var(--beige-arena)] md:bg-white">
                <div className="px-6 py-5 border-b border-[var(--beige-arena)]">
                    <h1 className="font-serif text-xl font-bold text-[var(--brown-earth)]">Calandrias</h1>
                    <p className="text-xs text-[var(--slate-gray)]">Panel de administración</p>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <NavLinks pathname={pathname} />
                </div>
                <div className="border-t border-[var(--beige-arena)] p-3 space-y-2">
                    <p className="truncate px-2 text-xs text-[var(--slate-gray)]" title={email}>
                        {email}
                    </p>
                    <LogoutForm />
                </div>
            </aside>

            {/* Drawer mobile */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-72 bg-white p-0">
                    <SheetTitle className="px-6 py-5 border-b border-[var(--beige-arena)] font-serif text-xl text-[var(--brown-earth)]">
                        Calandrias
                    </SheetTitle>
                    <div className="flex-1 overflow-y-auto px-3 py-4">
                        <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                    </div>
                    <div className="border-t border-[var(--beige-arena)] p-3 space-y-2">
                        <p className="truncate px-2 text-xs text-[var(--slate-gray)]" title={email}>
                            {email}
                        </p>
                        <LogoutForm />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Contenido */}
            <div className="md:pl-64">
                {/* Topbar mobile */}
                <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--beige-arena)] bg-white px-4 py-3 md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="font-serif text-lg font-bold text-[var(--brown-earth)]">Calandrias</span>
                </header>

                <main className="p-4 md:p-8">{children}</main>
            </div>
        </div>
    )
}
