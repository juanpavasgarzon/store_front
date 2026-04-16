import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pavas Store — Premium Marketplace",
    template: "%s | Pavas Store",
  },
  description:
    "Discover curated listings across all categories. Buy, sell, and connect in style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Runs synchronously before paint — prevents theme flash.
            next/script with strategy="beforeInteractive" is the correct way
            to inject inline scripts in App Router without React 19 warnings. */}
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
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
