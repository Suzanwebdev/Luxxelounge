import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AnnouncementBarClient } from "@/components/layout/announcement-bar-client";
import { Navbar } from "@/components/layout/header";
import { ScrollToTopOnRoute } from "@/components/layout/scroll-to-top-on-route";
import { Footer } from "@/components/layout/footer";
import { StoreRealtimeSync } from "@/components/storefront/realtime-sync";
import { CartProvider } from "@/components/storefront/cart-provider";

const heading = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Luxxelounge | Premium Home Furniture",
  description: "Luxury home furniture and interiors with refined, modern elegance."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable}`}>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
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
