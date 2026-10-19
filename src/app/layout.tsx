import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "Mi Estadía - Tu alojamiento, más cerca",
  description: "Gestioná reservas, check-ins, pagos y ofrecé una experiencia premium a tus huéspedes.",
  icons: {
    icon: "/mi-estadia-logo.png",
    apple: "/mi-estadia-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}