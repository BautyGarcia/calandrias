import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { BentoGridGallery } from "@/components/BentoGridGallery";
import { CabinsTeaser } from "@/components/CabinsTeaser";
import { LocationMap } from "@/components/LocationMap";
import { LocalBusinessSchema, ReviewsSchema } from "@/components/SchemaMarkup";

export default function Home() {
  return (
    <>
      {/* Schema Markup para SEO */}
      <LocalBusinessSchema />
      <ReviewsSchema />
      
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="bg-[var(--light-sand)] min-h-screen flex items-center relative overflow-hidden">
          {/* Background Logo Elements */}
          <Image
            src="/logo.svg"
            alt="Logo decorativo"
            width={320}
            height={320}
            className="absolute -right-24 -top-24 opacity-10 select-none pointer-events-none float"
            style={{ animationDelay: '0.5s' }}
          />
          <Image
            src="/logo.svg"
            alt="Logo decorativo"
            width={180}
            height={180}
            className="absolute left-1/4 bottom-1/4 opacity-10 select-none pointer-events-none float"
            style={{ animationDelay: '1.5s' }}
          />
          <Image
            src="/logo.svg"
            alt="Logo decorativo"
            width={220}
            height={220}
            className="absolute right-1/3 top-1/3 opacity-10 select-none pointer-events-none float"
            style={{ animationDelay: '1s' }}
          />

          <div className="container mx-auto px-4 py-16 md:py-0 z-0">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-8">
                <h1 className="text-5xl md:text-7xl font-serif text-[var(--brown-earth)] font-bold leading-tight slide-up">
                  Tu escape perfecto en las montañas de Tandil
                </h1>
                <p className="text-xl md:text-2xl text-[var(--slate-gray)] slide-up-delay-1">
                  Descubre nuestras cabañas de lujo rodeadas de naturaleza en las sierras de Buenos Aires.
                  Un lugar para desconectar, relajarse y crear recuerdos inolvidables en Tandil.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-6 slide-up-delay-2">
                  <Link href="/cabanas">
                    <Button size="lg" variant="wood" className="text-xl py-7 px-8 hover:scale-105 transition-transform">
                      Reservar ahora
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex-1 relative w-full h-[400px] md:h-[600px] rounded-md overflow-hidden scale-in" style={{ animationDelay: '0.3s' }}>
                <Image
                  src="/gallery/vista-aerea-del-complejo.jpg"
                  alt="Vista aérea del complejo de cabañas Las Calandrias en Tandil"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="servicios" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-12">
              Diseñadas para una experiencia única en Tandil
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-[var(--soft-cream)] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--brown-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Ubicación privilegiada en Tandil</h3>
                <p className="text-[var(--slate-gray)]">Nuestras cabañas están ubicadas en el corazón de la sierra de Tandil, a solo minutos de los principales atractivos naturales y turísticos.</p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-[var(--soft-cream)] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--brown-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Comodidades de lujo</h3>
                <p className="text-[var(--slate-gray)]">Cada cabaña cuenta con amenities de primera calidad: pileta, chimenea, cocina equipada, WiFi y todas las comodidades para tu estadía perfecta.</p>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-[var(--soft-cream)] flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[var(--brown-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Experiencia personalizada</h3>
                <p className="text-[var(--slate-gray)]">Atención personalizada y servicios pensados para hacer de tu estadía en Tandil una experiencia única e inolvidable.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cabins teaser */}
        <CabinsTeaser />

        {/* CTA Section */}
        <section id="reservar" className="py-16 bg-[var(--brown-earth)]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif text-white mb-6">
              ¿Listo para tu próxima aventura en Tandil?
            </h2>
            <p className="text-[var(--light-sand)] mb-8 max-w-2xl mx-auto">
              Descubre la tranquilidad de las sierras de Tandil y vive una experiencia única en nuestras cabañas de lujo.
            </p>
            <Link href="/cabanas">
              <Button size="lg" variant="sand" className="font-medium">
                Reservar ahora
              </Button>
            </Link>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-12">
              Explora nuestros espacios en Tandil
            </h2>
            <BentoGridGallery />
          </div>
        </section>

        {/* Testimonials Section replaced by Carousel */}
        <section className="py-16 bg-[var(--light-sand)]">
          <div className="container mx-auto px-0">
            <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-4">
              Lo que dicen nuestros huéspedes
            </h2>
            <p className="text-center text-[var(--slate-gray)] mb-12 max-w-2xl mx-auto">
              La satisfacción de nuestros huéspedes es nuestra mejor recompensa. Descubre por qué eligen Las Calandrias para sus vacaciones en Tandil.
            </p>
            <ReviewsCarousel />
          </div>
        </section>

        {/* Location Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <LocationMap mapUrl="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3893.848989505165!2d-59.1513972!3d-37.360580399999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95911ff66cee8eeb%3A0x8d3b2f19b3a694e6!2sLas%20Calandrias%20de%20Tandil!5e1!3m2!1ses-419!2sar!4v1748306592334!5m2!1ses-419!2sar" />
          </div>
        </section>

        {/* FAQ Section - Updated with Accordion */}
        <section className="py-16 bg-[var(--light-sand)]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-4">
              Preguntas frecuentes sobre nuestras cabañas en Tandil
            </h2>
            <p className="text-center text-[var(--slate-gray)] mb-12 max-w-2xl mx-auto">
              Resolvemos tus dudas para que puedas planificar tu estadía en Tandil sin preocupaciones.
            </p>
            
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>¿Cómo realizo una reserva en Las Calandrias?</AccordionTrigger>
                  <AccordionContent>
                    Puedes reservar directamente desde nuestra web utilizando el botón &quot;Reservar ahora&quot;,
                    llamando al número de contacto o enviando un correo electrónico.
                    Se requiere un depósito del 30% para confirmar la reserva.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>¿Qué incluye la tarifa de las cabañas?</AccordionTrigger>
                  <AccordionContent>
                    La tarifa incluye alojamiento, ropa de cama, toallas, amenities básicos, acceso a todas las
                    instalaciones de la cabaña (jacuzzi, chimenea, parrilla), estacionamiento y Wi-Fi.
                    También ofrecemos un kit de bienvenida con productos locales de Tandil.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>¿Permiten mascotas en las cabañas?</AccordionTrigger>
                  <AccordionContent>
                    ¡Sí! Entendemos que las mascotas son parte de la familia. Aceptamos mascotas pequeñas y
                    medianas con un cargo adicional de limpieza. Te pedimos que nos informes al momento de hacer
                    la reserva. Algunas cabañas tienen áreas especiales para mascotas.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>¿Cuál es la política de cancelación?</AccordionTrigger>
                  <AccordionContent>
                    Ofrecemos cancelación gratuita hasta 48 horas antes del check-in. Para cancelaciones
                    realizadas con menos de 48 horas de anticipación, se aplicará un cargo del 50% del total.
                    En casos de cancelaciones el mismo día, se cobrará la totalidad de la reserva.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>¿Qué actividades puedo hacer en Tandil?</AccordionTrigger>
                  <AccordionContent>
                    Tandil ofrece múltiples actividades: trekking en Cerro La Movediza, visita al Lago del Fuerte,
                    parapente, cabalgatas, turismo rural, visitas a fábricas de dulces y salamines artesanales.
                    También puedes disfrutar del centro histórico y sus tradicionales confiterías.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>¿Hay servicios de alimentación disponibles?</AccordionTrigger>
                  <AccordionContent>
                    Cada cabaña cuenta con cocina completamente equipada para que puedas preparar tus comidas.
                    También podemos recomendarte los mejores restaurantes de Tandil o coordinar servicios de
                    catering para ocasiones especiales. Incluimos un kit de bienvenida con productos locales.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
