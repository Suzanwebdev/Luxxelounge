import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AnnouncementBarClient } from "@/components/layout/announcement-bar-client";
import { Navbar } from "@/components/layout/header";
import { ScrollToTopOnRoute } from "@/components/layout/scroll-to-top-on-route";
import { Footer } from "@/components/layout/footer";
import { GlobalJsonLd } from "@/components/seo/global-json-ld";
import { StoreRealtimeSync } from "@/components/storefront/realtime-sync";
import { CartProvider } from "@/components/storefront/cart-provider";
import { RecoveryHashRedirect } from "@/components/auth/recovery-hash-redirect";
import { buildRootMetadata } from "@/lib/seo/metadata";

const heading = Playfair_Display({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f1eb"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable}`}>
        <GlobalJsonLd />
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <RecoveryHashRedirect />
            <AnnouncementBarClient />
            <ScrollToTopOnRoute />
            <Navbar />
            <StoreRealtimeSync />
            <main className="min-w-0 flex-1">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
