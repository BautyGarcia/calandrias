import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Home as HomeIcon, Sparkles, Heart, Mountain, TreePine, Waves } from "lucide-react";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { BentoGridGallery } from "@/components/BentoGridGallery";
import { CabinsTeaser } from "@/components/CabinsTeaser";
import { LocationMap } from "@/components/LocationMap";
import { LocalBusinessSchema, ReviewsSchema } from "@/components/SchemaMarkup";
import {
  getSiteContent,
  getSiteSettings,
  getFaqs,
  getReviews,
  getGalleryItems,
} from "@/lib/db/content";
import type {
  HeroContent,
  ServicesContent,
  CtaContent,
  CabinsTeaserContent,
} from "@/lib/content-schemas";
import type { Faq, Review, GalleryItem } from "@/types/db";

// Revalidación ISR: la home se regenera al menos cada hora.
export const revalidate = 3600;

// ---------------------------------------------------------------
// Defaults hardcodeados (valores actuales) usados como fallback si
// un bloque de contenido todavía no existe en la DB.
// ---------------------------------------------------------------

const HERO_FALLBACK: HeroContent = {
  title: "Tu refugio perfecto en las montañas de Tandil",
  subtitle:
    "Descubre nuestras acogedoras cabañas rodeadas de naturaleza en las sierras de Buenos Aires. Un lugar para desconectar, relajarse y crear recuerdos inolvidables en Tandil.",
  ctaLabel: "Reservar ahora",
};

const SERVICES_FALLBACK: ServicesContent = {
  title: "Diseñadas para una experiencia especial en Tandil",
  items: [
    {
      icon: "Home",
      title: "Ubicación privilegiada en Tandil",
      description:
        "Nuestras cabañas están ubicadas en el corazón de la sierra de Tandil, a solo minutos de los principales atractivos naturales y turísticos.",
    },
    {
      icon: "Sparkles",
      title: "Comodidades pensadas para tu bienestar",
      description:
        "Cada cabaña cuenta con amenities cuidadosamente seleccionados: pileta, chimenea, cocina equipada, WiFi y todas las comodidades para tu estadía perfecta.",
    },
    {
      icon: "Heart",
      title: "Atención personalizada",
      description:
        "Nos esforzamos por brindarte una atención cálida y servicios pensados para hacer de tu estadía en Tandil una experiencia única e inolvidable.",
    },
  ],
};

const CTA_FALLBACK: CtaContent = {
  title: "¿Listo para tu próxima aventura en Tandil?",
  subtitle:
    "Descubre la tranquilidad de las sierras de Tandil y vive una experiencia especial en nuestras acogedoras cabañas.",
  buttonLabel: "Reservar ahora",
};

const TEASER_FALLBACK: CabinsTeaserContent = {
  title: "Tu refugio perfecto te espera",
  subtitle:
    "Cada cabaña cuenta una historia diferente. Desde escapadas románticas hasta aventuras familiares, hemos creado espacios únicos que se adaptan a tu forma de vivir la montaña.",
  stats: [
    { value: "4", label: "Cabañas" },
    { value: "2-8", label: "Huéspedes" },
    { value: "★★★★★", label: "Calidad" },
    { value: "100%", label: "Naturaleza" },
  ],
  features: [
    { title: "Vistas panorámicas", description: "Cada amanecer es un regalo" },
    { title: "Conexión natural", description: "Rodeado de sierras y bosques" },
    { title: "Comodidades premium", description: "Lujo y naturaleza en armonía" },
    { title: "Experiencias únicas", description: "Momentos que perduran" },
  ],
  ctaLabel: "Descubrir nuestras cabañas",
};

const FAQS_FALLBACK: Faq[] = [
  {
    id: "faq-1",
    question: "¿Cómo realizo una reserva en Las Calandrias?",
    answer:
      "Puedes reservar directamente desde nuestra web utilizando el botón “Reservar ahora”, llamando al número de contacto o enviando un correo electrónico. Se requiere un depósito del 30% para confirmar la reserva.",
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: "faq-2",
    question: "¿Qué incluye la tarifa de las cabañas?",
    answer:
      "La tarifa incluye alojamiento, ropa de cama, toallas, amenities básicos, acceso a todas las instalaciones de la cabaña (chimenea, parrilla), estacionamiento y Wi-Fi. También ofrecemos un kit de bienvenida con productos locales de Tandil.",
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: "faq-3",
    question: "¿Permiten mascotas en las cabañas?",
    answer:
      "¡Sí! Entendemos que las mascotas son parte de la familia. Aceptamos mascotas pequeñas y medianas con un cargo adicional de limpieza. Te pedimos que nos informes al momento de hacer la reserva. Algunas cabañas tienen áreas especiales para mascotas.",
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: "faq-4",
    question: "¿Cuál es la política de cancelación?",
    answer:
      "Ofrecemos cancelación gratuita hasta 48 horas antes del check-in. Para cancelaciones realizadas con menos de 48 horas de anticipación, se aplicará un cargo del 50% del total. En casos de cancelaciones el mismo día, se cobrará la totalidad de la reserva.",
    sortOrder: 4,
    isPublished: true,
  },
  {
    id: "faq-5",
    question: "¿Qué actividades puedo hacer en Tandil?",
    answer:
      "Tandil ofrece múltiples actividades: trekking en Cerro La Movediza, visita al Lago del Fuerte, parapente, cabalgatas, turismo rural, visitas a fábricas de dulces y salamines artesanales. También puedes disfrutar del centro histórico y sus tradicionales confiterías.",
    sortOrder: 5,
    isPublished: true,
  },
  {
    id: "faq-6",
    question: "¿Hay servicios de alimentación disponibles?",
    answer:
      "Cada cabaña cuenta con cocina completamente equipada para que puedas preparar tus comidas. También podemos recomendarte los mejores restaurantes de Tandil o coordinar servicios de catering para ocasiones especiales. Incluimos un kit de bienvenida con productos locales.",
    sortOrder: 6,
    isPublished: true,
  },
];

const REVIEWS_FALLBACK: Review[] = [
  {
    id: "rev-1",
    name: "María Rodríguez",
    location: "Buenos Aires",
    text: "Una experiencia maravillosa. La cabaña estaba impecable, con todas las comodidades y una vista espectacular. Definitivamente volveremos.",
    rating: 5,
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: "rev-2",
    name: "Carlos Méndez",
    location: "Córdoba",
    text: "El lugar perfecto para desconectar. La atención fue excelente, la cabaña muy cómoda y la zona es hermosa para hacer caminatas.",
    rating: 5,
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: "rev-3",
    name: "Laura y Diego",
    location: "Rosario",
    text: "Celebramos nuestro aniversario en la cabaña El Roble y fue mágico. El jacuzzi con vista al bosque y la chimenea crearon el ambiente perfecto.",
    rating: 5,
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: "rev-4",
    name: "Sofía Pérez",
    location: "Mendoza",
    text: "Hermoso lugar, rodeado de naturaleza. El personal muy atento y las instalaciones de primera. ¡Recomendado!",
    rating: 5,
    sortOrder: 4,
    isPublished: true,
  },
  {
    id: "rev-5",
    name: "Martín López",
    location: "Bariloche",
    text: "Las cabañas superaron nuestras expectativas. Volveremos en invierno para disfrutar de la chimenea y la nieve.",
    rating: 5,
    sortOrder: 5,
    isPublished: true,
  },
];

const GALLERY_FALLBACK: GalleryItem[] = [
  { id: "g-1", title: "Luna sobre el campo", description: "Una noche clara con la luna llena elevándose sobre las cabañas y el bosque.", imageUrl: "/gallery/luna-sobre-el-campo.jpg", span: "col-span-1 row-span-2", sortOrder: 1, isPublished: true },
  { id: "g-2", title: "Vista serrana", description: "Paisaje panorámico de sierras verdes bajo un cielo despejado.", imageUrl: "/gallery/vista-serrana.jpg", span: "col-span-1 row-span-2", sortOrder: 2, isPublished: true },
  { id: "g-3", title: "Amanecer junto a la pileta", description: "Un nuevo día comienza reflejándose en la quietud del agua.", imageUrl: "/gallery/amanecer-junto-a-la-pileta.jpg", span: "col-span-1 row-span-2", sortOrder: 3, isPublished: true },
  { id: "g-4", title: "Vista aérea del complejo", description: "Disposición armoniosa de cabañas, caminos y naturaleza desde el cielo.", imageUrl: "/gallery/vista-aerea-del-complejo.jpg", span: "col-span-2 row-span-2", sortOrder: 4, isPublished: true },
  { id: "g-5", title: "Todo el predio desde el aire", description: "Un vistazo completo al predio, con la pileta, cabañas y entorno natural.", imageUrl: "/gallery/todo-el-predio-desde-el-aire.jpg", span: "col-span-2 row-span-2", sortOrder: 5, isPublished: true },
  { id: "g-6", title: "Baño con estilo rústico", description: "Lavabo artesanal en piedra y grifería moderna, elegancia natural.", imageUrl: "/gallery/bano-con-estilo-rustico.jpg", span: "col-span-2 row-span-2", sortOrder: 6, isPublished: true },
  { id: "g-7", title: "Dormitorio cálido y luminoso", description: "Habitación con techo de madera y luz natural perfecta para descansar.", imageUrl: "/gallery/dormitorio-calido-y-luminoso.jpg", span: "col-span-1 row-span-2", sortOrder: 7, isPublished: true },
  { id: "g-8", title: "Detalles del descanso", description: "Cojines suaves y colores cálidos para una siesta reparadora.", imageUrl: "/gallery/detalles-del-descanso.jpg", span: "col-span-1 row-span-2", sortOrder: 8, isPublished: true },
];

// Íconos disponibles para los servicios (el CMS guarda el nombre como string).
const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Home: HomeIcon,
  Sparkles,
  Heart,
  Mountain,
  TreePine,
  Waves,
};

export default async function Home() {
  const [heroRaw, servicesRaw, ctaRaw, teaserRaw, settings, faqsRaw, reviewsRaw, galleryRaw] =
    await Promise.all([
      getSiteContent<HeroContent>("hero"),
      getSiteContent<ServicesContent>("services"),
      getSiteContent<CtaContent>("cta"),
      getSiteContent<CabinsTeaserContent>("cabins_teaser"),
      getSiteSettings(),
      getFaqs(),
      getReviews(),
      getGalleryItems(),
    ]);

  const hero = heroRaw ?? HERO_FALLBACK;
  const services = servicesRaw ?? SERVICES_FALLBACK;
  const cta = ctaRaw ?? CTA_FALLBACK;
  const teaser = teaserRaw ?? TEASER_FALLBACK;
  const faqs = faqsRaw.length > 0 ? faqsRaw : FAQS_FALLBACK;
  const reviews = reviewsRaw.length > 0 ? reviewsRaw : REVIEWS_FALLBACK;
  const gallery = galleryRaw.length > 0 ? galleryRaw : GALLERY_FALLBACK;

  return (
    <>
      {/* Schema Markup para SEO */}
      <LocalBusinessSchema
        streetAddress={settings.address}
        telephone={settings.phone}
        email={settings.email}
      />
      <ReviewsSchema reviews={reviews} />

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
                  {hero.title}
                </h1>
                <p className="text-xl md:text-2xl text-[var(--slate-gray)] slide-up-delay-1">
                  {hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-6 slide-up-delay-2">
                  <Link href="/cabanas">
                    <Button size="lg" variant="wood" className="text-xl py-7 px-8 hover:scale-105 transition-transform">
                      {hero.ctaLabel}
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
              {services.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.items.map((item, i) => {
                const Icon = SERVICE_ICONS[item.icon] ?? HomeIcon;
                return (
                  <div key={i} className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--soft-cream)] flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8 text-[var(--brown-earth)]" />
                    </div>
                    <h3 className="text-xl font-medium text-[var(--dark-wood)] mb-2">{item.title}</h3>
                    <p className="text-[var(--slate-gray)]">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cabins teaser */}
        <CabinsTeaser content={teaser} />

        {/* CTA Section */}
        <section id="reservar" className="py-16 bg-[var(--brown-earth)]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif text-white mb-6">
              {cta.title}
            </h2>
            <p className="text-[var(--light-sand)] mb-8 max-w-2xl mx-auto">
              {cta.subtitle}
            </p>
            <Link href="/cabanas">
              <Button size="lg" variant="sand" className="font-medium">
                {cta.buttonLabel}
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
            <BentoGridGallery items={gallery} />
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
            <ReviewsCarousel reviews={reviews} />
          </div>
        </section>

        {/* Location Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <LocationMap
              mapUrl="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3893.848989505165!2d-59.1513972!3d-37.360580399999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95911ff66cee8eeb%3A0x8d3b2f19b3a694e6!2sLas%20Calandrias%20de%20Tandil!5e1!3m2!1ses-419!2sar!4v1748306592334!5m2!1ses-419!2sar"
              whatsapp={settings.whatsapp}
              phone={settings.phone}
              email={settings.email}
            />
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
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
