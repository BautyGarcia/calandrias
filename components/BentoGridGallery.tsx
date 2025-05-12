"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Item = {
  id: number
  title: string
  description: string
  size: "small" | "medium" | "large"
  image: string
  span?: string
}

const initialItems: Item[] = [
  {
    id: 1,
    title: "Cabaña El Pinar",
    description: "Vista al bosque, chimenea y deck privado.",
    size: "large",
    image: "https://v0.dev/placeholder.svg?height=600&width=600",
    span: "col-span-2 row-span-2",
  },
  {
    id: 2,
    title: "Cabaña El Roble",
    description: "Ideal para familias, terraza y parrilla.",
    size: "medium",
    image: "https://v0.dev/placeholder.svg?height=300&width=600",
    span: "col-span-2 row-span-1",
  },
  {
    id: 3,
    title: "Cabaña El Valle",
    description: "Jacuzzi, vista panorámica y lujo rústico.",
    size: "medium",
    image: "https://v0.dev/placeholder.svg?height=600&width=300",
    span: "col-span-1 row-span-2",
  },
  {
    id: 4,
    title: "Atardecer en la montaña",
    description: "Colores únicos y tranquilidad absoluta.",
    size: "small",
    image: "https://v0.dev/placeholder.svg?height=300&width=300",
    span: "col-span-1 row-span-1",
  },
  {
    id: 5,
    title: "Río cercano",
    description: "A pasos de la naturaleza y el agua.",
    size: "small",
    image: "https://v0.dev/placeholder.svg?height=300&width=300",
    span: "col-span-1 row-span-1",
  },
  {
    id: 6,
    title: "Senderos y aventura",
    description: "Caminatas y actividades al aire libre.",
    size: "medium",
    image: "https://v0.dev/placeholder.svg?height=300&width=600",
    span: "col-span-2 row-span-1",
  },
  {
    id: 7,
    title: "Desayuno campestre",
    description: "Productos locales y vistas increíbles.",
    size: "medium",
    image: "https://v0.dev/placeholder.svg?height=600&width=300",
    span: "col-span-1 row-span-2",
  },
  {
    id: 8,
    title: "Noche estrellada",
    description: "Cielos limpios y fogón bajo las estrellas.",
    size: "small",
    image: "https://v0.dev/placeholder.svg?height=300&width=300",
    span: "col-span-1 row-span-1",
  },
]

export function BentoGridGallery() {
  const [items, setItems] = useState<Item[]>(initialItems)

  // Function to shuffle the items array
  const shuffleItems = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    setItems(shuffled)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={shuffleItems} variant="outline" className="flex items-center gap-2">
          <Shuffle className="h-4 w-4" />
          Cambiar distribución
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 fade-in",
              item.span
            )}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="absolute inset-0 z-10 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100" />

            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-sm text-white/80">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 