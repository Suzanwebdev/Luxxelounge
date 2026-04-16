import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AnnouncementBar, Navbar } from "@/components/layout/header";
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
          <AnnouncementBar />
          <Navbar />
          <StoreRealtimeSync />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
