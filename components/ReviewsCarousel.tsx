"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { reviews } from "@/data"

export function ReviewsCarousel() {
  const [isHovering, setIsHovering] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(0)

  // Duplicate for seamless loop
  const duplicatedItems = [...reviews, ...reviews]

  useEffect(() => {
    const updateDimensions = () => {
      if (carouselRef.current) {
        const newContainerWidth = carouselRef.current.offsetWidth

        let newVisibleCards = 3
        if (newContainerWidth < 768) {
          newVisibleCards = 1
        } else if (newContainerWidth < 1024) {
          newVisibleCards = 2
        }
        // Calculate card width including gap
        const newCardWidth = newContainerWidth / (newVisibleCards + 0.5)
        setCardWidth(newCardWidth)
      }
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const handleMouseEnter = () => setIsHovering(true)
  const handleMouseLeave = () => setIsHovering(false)

  const totalWidth = cardWidth * reviews.length
  const animationStyle = {
    width: `${cardWidth * duplicatedItems.length}px`,
    animation: `scroll 22s linear infinite`,
    animationPlayState: isHovering ? "paused" : "running",
  }

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
      <div
        className="relative overflow-hidden"
        ref={carouselRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <style jsx global>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-${totalWidth}px);
            }
          }
        `}</style>
        <div className="flex" style={animationStyle as React.CSSProperties}>
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 px-2"
              style={{ width: `${cardWidth}px` }}
            >
              <Card className="h-full bg-white/95 border-[var(--beige-arena)] shadow-md">
                <CardContent className="p-6 md:p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--slate-gray)]/20 mb-4 overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full bg-[var(--beige-arena)] flex items-center justify-center text-[var(--brown-earth)] font-bold text-xl">
                      {item.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                  </div>
                  <p className="text-[var(--slate-gray)] mb-4 italic">&quot;{item.review}&quot;</p>
                  <div>
                    <p className="font-medium text-[var(--dark-wood)]">{item.name}</p>
                    <p className="text-xs text-[var(--slate-gray)]">{item.city}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 