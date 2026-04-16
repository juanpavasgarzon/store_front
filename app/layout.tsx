import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import QueryProvider from "./providers/QueryProvider";
import ThemeProvider from "./providers/ThemeProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "Pavas Store — Premium Marketplace",
    template: "%s | Pavas Store",
  },
  description:
    "Anuncios seleccionados en todas las categorías. Descubre artículos únicos, conecta con vendedores y compra con confianza.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("h-full", "font-sans", geist.variable)} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var saved = localStorage.getItem('theme');
              var preferred = saved
                || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
              document.documentElement.setAttribute('data-theme', preferred);
            } catch(e) {
              document.documentElement.setAttribute('data-theme', 'dark');
            }
          })();
        `}</Script>
      </head>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
