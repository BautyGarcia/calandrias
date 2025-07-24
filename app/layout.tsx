import type { Metadata } from "next";
import { Cabin, Lora } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { GoogleAnalytics, GoogleTagManager } from "@/components/GoogleAnalytics";

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

export const metadata: Metadata = {
  title: {
    default: "Las Calandrias - Cabañas en Tandil | Alojamiento de Lujo en las Sierras",
    template: "%s | Las Calandrias - Cabañas Tandil"
  },
  description: "Cabañas de lujo en Tandil, Buenos Aires. Alojamiento exclusivo en las sierras para vacaciones perfectas. Relax, naturaleza y confort en Las Calandrias. Reservá tu escapada.",
  keywords: [
    "cabañas tandil",
    "alojamiento tandil", 
    "vacaciones tandil",
    "estadía tandil",
    "sierra tandil",
    "cabaña tandil",
    "calandrias",
    "cabañas buenos aires",
    "turismo tandil",
    "relax tandil",
    "escapada fin de semana",
    "cabañas con pileta",
    "alojamiento sierra",
    "vacaciones sierras",
    "cabañas lujo tandil"
  ],
  authors: [{ name: "Las Calandrias" }],
  creator: "Las Calandrias",
  publisher: "Las Calandrias",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://las-calandrias.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://las-calandrias.com',
    title: 'Las Calandrias - Cabañas en Tandil | Alojamiento de Lujo en las Sierras',
    description: 'Cabañas de lujo en Tandil, Buenos Aires. Alojamiento exclusivo en las sierras para vacaciones perfectas. Relax, naturaleza y confort en Las Calandrias.',
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
    title: 'Las Calandrias - Cabañas en Tandil | Alojamiento de Lujo en las Sierras',
    description: 'Cabañas de lujo en Tandil, Buenos Aires. Alojamiento exclusivo en las sierras para vacaciones perfectas.',
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
      </body>
    </html>
  );
}
