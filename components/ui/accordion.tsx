"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Helper to add staggered animation delays
function getStaggeredDelay(index: number) {
  return `${index * 80}ms`;
}

function useInView(ref: React.RefObject<HTMLElement>, rootMargin = "0px") {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

function Accordion({
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root> & { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, "-100px");
  // Add index to each child for staggered animation
  const childrenWithDelay = React.Children.map(children, (child, idx) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 'data-idx': idx, inView });
    }
    return child;
  });
  return (
    <div ref={ref}>
      <AccordionPrimitive.Root data-slot="accordion" {...props}>{childrenWithDelay}</AccordionPrimitive.Root>
    </div>
  );
}

function AccordionItem({
  className,
  inView,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item> & { 'data-idx'?: number, inView?: boolean }) {
  // Get the index for staggered animation
  const idx = (props as any)['data-idx'] ?? 0;
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      style={inView ? {
        opacity: 0,
        transform: 'translateY(20px)',
        animation: `fadeSlideIn 0.6s cubic-bezier(0.4,0,0.2,1) forwards`,
        animationDelay: getStaggeredDelay(idx),
      } : { opacity: 0, transform: 'translateY(20px)' }}
      className={cn("border border-[var(--beige-arena)] rounded-sm mb-3 overflow-hidden", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:ring-[var(--brown-earth)]/30 flex flex-1 items-center justify-between gap-4 px-6 py-4 text-left font-medium transition-all outline-none bg-[var(--light-sand)] text-[var(--dark-wood)] hover:bg-[var(--soft-cream)] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-[var(--brown-earth)] pointer-events-none size-5 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-[var(--slate-gray)]"
      {...props}
    >
      <div className={cn("px-6 pt-4 pb-4 bg-white/95", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

// Add keyframes for fadeSlideIn
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  document.head.appendChild(style);
}
