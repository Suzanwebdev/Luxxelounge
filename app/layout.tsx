import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";
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
          <StorefrontChrome>{children}</StorefrontChrome>
        </CartProvider>
      </body>
    </html>
  );
}
