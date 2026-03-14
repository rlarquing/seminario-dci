import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seminario DCI - Sistema de Gestión Académica",
  description: "Sistema integral de gestión académica para el Seminario DCI. Administración de alumnos, profesores, asignaturas, calificaciones y generación de certificados.",
  keywords: ["Seminario DCI", "Gestión Académica", "Educación", "Certificados", "Alumnos", "Profesores", "Notas"],
  authors: [{ name: "Seminario DCI" }],
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/images/logo.png", type: "image/png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "Seminario DCI - Sistema de Gestión Académica",
    description: "Sistema integral de gestión académica para el Seminario DCI",
    url: "https://seminario-dci.vercel.app",
    siteName: "Seminario DCI",
    type: "website",
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: "Logo Seminario DCI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seminario DCI - Sistema de Gestión Académica",
    description: "Sistema integral de gestión académica para el Seminario DCI",
    images: ["/images/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
