import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader as SheetHeaderComp,
  SheetTitle as SheetTitleComp,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="bg-[var(--light-sand)] border-b border-[var(--beige-arena)] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Logo placeholder */}
          <div className="w-12 h-12 bg-black rounded-sm flex-shrink-0"></div>
          <h1 className="text-xl font-serif text-[var(--brown-earth)] hidden sm:block">Calandrias Cabañas</h1>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Inicio</Button>
          <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Cabañas</Button>
          <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Servicios</Button>
          <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Contacto</Button>
          <Button variant="wood" size="sm" className="ml-2">Reservar</Button>
        </nav>

        {/* Mobile nav: Sheet */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-screen max-w-full h-screen p-0 bg-[var(--light-sand)]">
              <SheetHeaderComp className="p-4 border-b border-[var(--beige-arena)]">
                <SheetTitleComp>
                  <span className="font-serif text-lg text-[var(--brown-earth)]">Calandrias Cabañas</span>
                </SheetTitleComp>
              </SheetHeaderComp>
              <nav className="flex flex-col gap-1 p-4">
                <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Inicio</Button>
                <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Cabañas</Button>
                <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Servicios</Button>
                <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Contacto</Button>
                <Button variant="wood" size="sm" className="justify-start w-full mt-2">Reservar</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 