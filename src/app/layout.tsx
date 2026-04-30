import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // 1. Importamos Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Studio Manager",
  description: "Sistema de gestión integral para tu estudio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors /> {/* 2. Agregamos el Toaster acá */}
      </body>
    </html>
  );
}
