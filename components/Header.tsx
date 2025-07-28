import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader as SheetHeaderComp,
  SheetTitle as SheetTitleComp,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-[var(--light-sand)] border-b border-[var(--beige-arena)] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="Calandrias Cabañas" width={50} height={50} className="cursor-pointer" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Inicio</Button>
          </Link>
          <Link href="/cabanas">
            <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Cabañas</Button>
          </Link>
          <Link href="/#servicios">
            <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Servicios</Button>
          </Link>
          <Link href="/#contacto">
            <Button variant="ghost" size="sm" className="text-[var(--brown-earth)]">Contacto</Button>
          </Link>
          <Link href="/cabanas">
            <Button variant="wood" size="sm" className="ml-2">Reservar</Button>
          </Link>
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
                <SheetClose asChild>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Inicio</Button>
                </Link>
                </SheetClose>
                <SheetClose asChild>
                <Link href="/cabanas">
                  <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Cabañas</Button>
                </Link>
                </SheetClose>
                <SheetClose asChild>
                <Link href="/#servicios">
                  <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Servicios</Button>
                </Link>
                </SheetClose>
                <SheetClose asChild>
                <Link href="/#contacto">
                  <Button variant="ghost" size="sm" className="justify-start text-[var(--brown-earth)] w-full">Contacto</Button>
                </Link>
                </SheetClose>
                <SheetClose asChild>
                <Link href="/cabanas">
                  <Button variant="wood" size="sm" className="justify-start w-full mt-2">Reservar</Button>
                </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 