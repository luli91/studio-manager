import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Mantenemos Inter
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://polekitty.vercel.app"), 
  title: "PoleKitty",
  description: "Sistema integral de gestión para tu estudio.",
  icons: {
    icon: "/LOGO-POLEKITTY-Flor.png", 
  },
  openGraph: {
    title: "PoleKitty | Studio Manager",
    description: "La herramienta definitiva para gestionar alumnas, clases y finanzas.",
    siteName: "PoleKitty",
    images: ["/LOGO-POLEKITTY-Flor.png"],
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}