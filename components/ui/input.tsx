import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[var(--slate-gray)]/70 selection:bg-[var(--beige-arena)] selection:text-[var(--brown-earth)] border-[var(--beige-arena)] flex h-10 w-full min-w-0 rounded-sm border bg-white/95 px-3 py-1 text-base shadow-sm transition-all outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-[var(--brown-earth)]/60 focus-visible:border-[var(--brown-earth)] focus-visible:ring-[var(--brown-earth)]/10 focus-visible:ring-[2px]",
        "aria-invalid:border-[var(--terracotta)] aria-invalid:ring-[var(--terracotta)]/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
