import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { BentoGridGallery } from "@/components/BentoGridGallery";

export default function Home() {
  return (
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
                Tu escape perfecto en las montañas
              </h1>
              <p className="text-xl md:text-2xl text-[var(--slate-gray)] slide-up-delay-1">
                Descubre nuestras cabañas de lujo rodeadas de naturaleza. 
                Un lugar para desconectar, relajarse y crear recuerdos inolvidables.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 pt-6 slide-up-delay-2">
                <Button size="lg" variant="wood" className="text-xl py-7 px-8 hover:scale-105 transition-transform">Reservar ahora</Button>
                <Button size="lg" variant="outline" className="text-xl py-7 px-8 border-[var(--brown-earth)] text-[var(--brown-earth)] hover:scale-105 transition-transform">
                  Ver cabañas
                </Button>
              </div>
            </div>
            <div className="flex-1 relative w-full h-[400px] md:h-[600px] rounded-md overflow-hidden scale-in" style={{ animationDelay: '0.3s' }}>
              {/* Placeholder for hero image */}
              <div className="absolute inset-0 bg-[var(--slate-gray)]/20 flex items-center justify-center">
                <p className="text-white font-bold text-xl">Imagen de cabaña principal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-12">
            Diseñadas para una experiencia única
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-[var(--soft-cream)] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--brown-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Ubicación privilegiada</h3>
              <p className="text-[var(--slate-gray)]">Nuestras cabañas están ubicadas en el corazón de la montaña, a solo minutos de los principales atractivos naturales.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-[var(--soft-cream)] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--brown-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Confort total</h3>
              <p className="text-[var(--slate-gray)]">Combinamos la estética rústica con todas las comodidades modernas para una estancia perfecta.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-[var(--soft-cream)] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--brown-earth)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Atención 24/7</h3>
              <p className="text-[var(--slate-gray)]">Nuestro equipo está disponible todo el día, todos los días, para asegurar que tu estancia sea perfecta.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cabins Showcase */}
      <section className="py-16 bg-[var(--light-sand)]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-4">
            Nuestras cabañas
          </h2>
          <p className="text-center text-[var(--slate-gray)] mb-12 max-w-2xl mx-auto">
            Cada cabaña está diseñada cuidadosamente para brindarte una experiencia única.
            Elige la que mejor se adapte a tus necesidades.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cabin Card 1 */}
            <Card className="overflow-hidden bg-white/95 border-[var(--beige-arena)]">
              <div className="relative w-full h-48 bg-[var(--slate-gray)]/20 flex items-center justify-center">
                <p className="text-white font-bold">Imagen Cabaña El Pinar</p>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Cabaña El Pinar</h3>
                <p className="text-[var(--slate-gray)] mb-4">Ideal para parejas. 1 dormitorio, chimenea y vista al bosque.</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[var(--brown-earth)]">$12,000/noche</span>
                  <Button variant="moss" size="sm">Ver detalles</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Cabin Card 2 */}
            <Card className="overflow-hidden bg-white/95 border-[var(--beige-arena)]">
              <div className="relative w-full h-48 bg-[var(--slate-gray)]/20 flex items-center justify-center">
                <p className="text-white font-bold">Imagen Cabaña El Roble</p>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Cabaña El Roble</h3>
                <p className="text-[var(--slate-gray)] mb-4">Perfecta para familias. 2 dormitorios, cocina completa y terraza.</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[var(--brown-earth)]">$18,000/noche</span>
                  <Button variant="moss" size="sm">Ver detalles</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Cabin Card 3 */}
            <Card className="overflow-hidden bg-white/95 border-[var(--beige-arena)]">
              <div className="relative w-full h-48 bg-[var(--slate-gray)]/20 flex items-center justify-center">
                <p className="text-white font-bold">Imagen Cabaña El Valle</p>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">Cabaña El Valle</h3>
                <p className="text-[var(--slate-gray)] mb-4">Espaciosa y lujosa. 3 dormitorios, jacuzzi y vista panorámica.</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[var(--brown-earth)]">$25,000/noche</span>
                  <Button variant="moss" size="sm">Ver detalles</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center mt-10">
            <Button variant="wood" size="lg">Ver todas las cabañas</Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-[var(--brown-earth)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif text-white mb-6">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-[var(--light-sand)] mb-8 max-w-2xl mx-auto">
            Reserva ahora y obtén un 15% de descuento en estadías de 3 noches o más.
            Oferta válida hasta fin de mes.
          </p>
          <Button size="lg" variant="sand" className="font-medium">
            Reservar con descuento
          </Button>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-12">
            Explora nuestros espacios
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
            La satisfacción de nuestros huéspedes es nuestra mejor recompensa.
          </p>
          <ReviewsCarousel />
        </div>
      </section>

      {/* FAQ Section - Updated with Accordion */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif text-center text-[var(--brown-earth)] mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-center text-[var(--slate-gray)] mb-12 max-w-2xl mx-auto">
            Resolvemos tus dudas para que puedas planificar tu estadía sin preocupaciones.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>¿Cómo realizo una reserva?</AccordionTrigger>
                <AccordionContent>
                  Puedes reservar directamente desde nuestra web utilizando el botón &quot;Reservar ahora&quot;, 
                  llamando al número de contacto o enviando un correo electrónico. 
                  Se requiere un depósito del 30% para confirmar la reserva.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>¿Qué incluye la tarifa?</AccordionTrigger>
                <AccordionContent>
                  La tarifa incluye alojamiento, ropa de cama, toallas, amenities básicos, acceso a todas las 
                  instalaciones de la cabaña (jacuzzi, chimenea, parrilla), estacionamiento y Wi-Fi. 
                  También ofrecemos un kit de bienvenida con productos locales.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>¿Permiten mascotas?</AccordionTrigger>
                <AccordionContent>
                  ¡Sí! Entendemos que las mascotas son parte de la familia. Aceptamos mascotas pequeñas y 
                  medianas con un cargo adicional de limpieza. Te pedimos que nos informes al momento de hacer 
                  la reserva. Algunas cabañas tienen áreas especiales para mascotas.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>¿Cuál es la política de cancelación?</AccordionTrigger>
                <AccordionContent>
                  Puedes cancelar hasta 7 días antes de tu llegada con reembolso completo. Cancelaciones 
                  entre 3-7 días antes de la llegada reciben un reembolso del 50%. Cancelaciones con menos 
                  de 3 días de anticipación no son reembolsables, pero ofrecemos la posibilidad de reprogramar 
                  la estadía dentro de los siguientes 6 meses, sujeto a disponibilidad.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>¿Hay actividades cerca de las cabañas?</AccordionTrigger>
                <AccordionContent>
                  ¡Absolutamente! La zona ofrece numerosas actividades como senderismo, cabalgatas, pesca, 
                  ciclismo de montaña, y paseos en kayak. Estamos a 15 minutos de las mejores rutas de 
                  trekking y a 10 minutos del pueblo donde encontrarás restaurantes y tiendas locales. 
                  En recepción podemos ayudarte a organizar excursiones y actividades.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6">
                <AccordionTrigger>¿A qué hora es el check-in y check-out?</AccordionTrigger>
                <AccordionContent>
                  El horario de check-in es a partir de las 15:00 hrs y el check-out hasta las 11:00 hrs. 
                  Si necesitas horarios especiales, contáctanos con anticipación y haremos lo posible por 
                  acomodar tu solicitud según disponibilidad.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-[var(--dark-wood)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-6">
            Tu escapada perfecta te espera
          </h2>
          <p className="text-[var(--light-sand)] mb-10 max-w-2xl mx-auto">
            Vive la experiencia Calandrias, donde cada detalle está pensado para tu confort y disfrute.
            Nuestras cabañas te esperan para brindarte momentos inolvidables.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="sand" className="font-medium">
              Reservar ahora
            </Button>
            <Button size="lg" variant="outline" className="text-[var(--light-sand)] border-[var(--light-sand)]">
              Contactar
            </Button>
          </div>
        </div>
      </section>
      </main>
  );
}
