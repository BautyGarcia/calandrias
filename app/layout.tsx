import type { Metadata } from "next";
import { Cabin, Lora } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { GoogleAnalytics, GoogleTagManager } from "@/components/GoogleAnalytics";
import { getSiteContent } from "@/lib/db/content";
import { withFallback } from "@/lib/content-fallback";
import type { SeoContent } from "@/lib/content-schemas";

const cabin = Cabin({
  variable: "--font-cabin",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

// Defaults hardcodeados (valores actuales) para el SEO editable.
const SEO_DEFAULT_TITLE =
  "Las Calandrias - Cabañas en Tandil | Alojamiento de Lujo en las Sierras";
const SEO_DEFAULT_DESCRIPTION =
  "Cabañas de lujo en Tandil, Buenos Aires. Alojamiento exclusivo en las sierras para vacaciones perfectas. Relax, naturaleza y confort en Las Calandrias. Reservá tu escapada.";
const SEO_DEFAULT_KEYWORDS =
  "cabañas tandil, alojamiento tandil, vacaciones tandil, estadía tandil, sierra tandil, cabaña tandil, calandrias, cabañas buenos aires, turismo tandil, relax tandil, escapada fin de semana, cabañas con pileta, alojamiento sierra, vacaciones sierras, cabañas lujo tandil";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteContent<SeoContent>("seo");

  const title = withFallback(seo?.title, SEO_DEFAULT_TITLE);
  const description = withFallback(seo?.description, SEO_DEFAULT_DESCRIPTION);
  const keywords = withFallback(seo?.keywords, SEO_DEFAULT_KEYWORDS)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
  title: {
    default: title,
    template: "%s | Las Calandrias - Cabañas Tandil"
  },
  description,
  keywords,
  authors: [{ name: "Las Calandrias" }],
  creator: "Las Calandrias",
  publisher: "Las Calandrias",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://calandrias.com.ar'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://calandrias.com.ar',
    title,
    description,
    siteName: 'Las Calandrias',
    images: [{
      url: '/gallery/vista-aerea-del-complejo.jpg',
      width: 1200,
      height: 630,
      alt: 'Vista aérea de Las Calandrias - Cabañas en Tandil',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/gallery/vista-aerea-del-complejo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code-here', // Se configurará después
  },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${cabin.variable} ${lora.variable} antialiased`}
      >
        <GoogleAnalytics />
        <GoogleTagManager />
        <Header />
        {children}
        <footer className="py-3 text-center text-xs text-gray-400">
          Desarrollado por{" "}
          <a
            href="https://bautygarcia.com/es"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Bauty Garcia
          </a>
        </footer>
      </body>
    </html>
  );
}
