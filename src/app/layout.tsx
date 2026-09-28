import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi Estadía - Tu alojamiento, más cerca",
  description:
    "Gestioná reservas, check-ins, pagos y ofrecé una experiencia premium a tus huéspedes. Sin instalaciones, sin complicaciones.",
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
      <body>{children}</body>
    </html>
  );
}