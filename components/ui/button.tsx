import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brown-earth)] text-white shadow-xs hover:bg-[var(--brown-earth)]/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-2 border-[var(--slate-gray)] bg-transparent shadow-xs hover:bg-[var(--beige-arena)]/20 dark:hover:bg-[var(--beige-arena)]/10",
        secondary:
          "bg-[var(--slate-gray)] text-white shadow-xs hover:bg-[var(--slate-gray)]/80",
        ghost:
          "hover:bg-[var(--soft-cream)]/70 hover:text-[var(--brown-earth)]",
        link: "text-[var(--brown-earth)] underline-offset-4 hover:underline",
        moss: "bg-[var(--green-moss)] text-white shadow-xs hover:bg-[var(--green-moss)]/90",
        forest: "bg-[var(--forest-green)] text-white shadow-xs hover:bg-[var(--forest-green)]/90",
        wood: "bg-[var(--dark-wood)] text-white shadow-xs hover:bg-[var(--dark-wood)]/90",
        terracotta: "bg-[var(--terracotta)] text-white shadow-xs hover:bg-[var(--terracotta)]/90",
        sand: "bg-[var(--light-sand)] text-[var(--brown-earth)] shadow-xs border border-[var(--beige-arena)] hover:bg-[var(--light-sand)]/80",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-sm gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-sm px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
