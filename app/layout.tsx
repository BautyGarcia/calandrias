import type { Metadata } from "next";
import { Cabin, Lora } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

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
  title: "Calandrias Cabañas",
  description: "Cabañas Calandrias, Tandil, Argentina",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cabin.variable} ${lora.variable} antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
