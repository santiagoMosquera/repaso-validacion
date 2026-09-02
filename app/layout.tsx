import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movilis Práctica | Examen complexivo",
  description: "Practica con los bancos de preguntas del Instituto Movilis.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
