import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mi Estadía - Tu alojamiento, más cerca",
  description: "Gestioná reservas, check-ins, pagos y ofrecé una experiencia premium a tus huéspedes. Sin instalaciones, sin complicaciones.",
  icons: {
    icon: "/mi-estadia-logo.png",
    apple: "/mi-estadia-logo.png",
  },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}