"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { bentoGalleryItems } from "@/data/bentoGalleryItems"

export function BentoGridGallery() {
  const [visibleCount, setVisibleCount] = useState(8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]">
        {bentoGalleryItems.slice(0, visibleCount).map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900",
              item.span
            )}
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
      {visibleCount < bentoGalleryItems.length && (
        <div className="flex justify-center pt-4">
          <Button onClick={() => setVisibleCount((c) => c + 8)} variant="outline">
            Mostrar más
          </Button>
        </div>
      )}
    </div>
  )
} 