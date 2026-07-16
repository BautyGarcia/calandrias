'use client'

import { Input } from '@/components/ui/input'
import type { PricingRow } from '@/lib/cabin-form'

interface PricingGridProps {
    rows: PricingRow[]
    basePrice: number
    baseDiscount: number
    onChange: (index: number, field: 'precio' | 'descuento', value: string) => void
}

const MONTH_LABEL: Record<string, string> = {
    enero: 'Enero',
    febrero: 'Febrero',
    marzo: 'Marzo',
    abril: 'Abril',
    mayo: 'Mayo',
    junio: 'Junio',
    julio: 'Julio',
    agosto: 'Agosto',
    septiembre: 'Septiembre',
    octubre: 'Octubre',
    noviembre: 'Noviembre',
    diciembre: 'Diciembre',
}

// Grilla de 12 meses. Celda vacía = hereda el valor base (placeholder gris).
export function PricingGrid({ rows, basePrice, baseDiscount, onChange }: PricingGridProps) {
    return (
        <div className="overflow-x-auto rounded-sm border border-[var(--beige-arena)]">
            <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                    <tr className="bg-[var(--light-sand)] text-left text-[var(--brown-earth)]">
                        <th className="px-3 py-2 font-medium">Mes</th>
                        <th className="px-3 py-2 font-medium">Precio por noche</th>
                        <th className="px-3 py-2 font-medium">Descuento entre semana (%)</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={row.mes} className="border-t border-[var(--beige-arena)]">
                            <td className="px-3 py-1.5 text-[var(--brown-earth)]">{MONTH_LABEL[row.mes]}</td>
                            <td className="px-2 py-1.5">
                                <Input
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={row.precio}
                                    onChange={(e) => onChange(i, 'precio', e.target.value)}
                                    placeholder={String(basePrice)}
                                    className="h-9"
                                    aria-label={`Precio ${MONTH_LABEL[row.mes]}`}
                                />
                            </td>
                            <td className="px-2 py-1.5">
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    inputMode="numeric"
                                    value={row.descuento}
                                    onChange={(e) => onChange(i, 'descuento', e.target.value)}
                                    placeholder={String(baseDiscount)}
                                    className="h-9"
                                    aria-label={`Descuento ${MONTH_LABEL[row.mes]}`}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
