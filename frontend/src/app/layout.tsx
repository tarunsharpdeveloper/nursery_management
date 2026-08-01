import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Jost, Epilogue } from "next/font/google";
import { ChevronDown, Facebook, Instagram, Leaf, Search, ShoppingCart, User } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import FloatingCart from "@/components/floating-cart";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Awantika Seeds",
  description: "Premium plants and seeds — Ujjain, Madhya Pradesh",
  icons: {
    icon: [
      { url: "/avntika-favicon.png", sizes: "any" },
      { url: "/avntika-favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/avntika-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/avntika-favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/avntika-favicon.png", sizes: "128x128", type: "image/png" },
      { url: "/avntika-favicon.png", sizes: "256x256", type: "image/png" }
    ],
    shortcut: "/avntika-favicon.png",
    apple: [
      { url: "/avntika-favicon.png", sizes: "120x120" },
      { url: "/avntika-favicon.png", sizes: "152x152" },
      { url: "/avntika-favicon.png", sizes: "167x167" },
      { url: "/avntika-favicon.png", sizes: "180x180" },
      { url: "/avntika-favicon.png", sizes: "192x192" }
    ]
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${jost.variable} ${epilogue.variable}`}>
      <head>
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/fontawesome.min.css" />
        <link rel="stylesheet" href="/assets/css/magnific-popup.min.css" />
        <link rel="stylesheet" href="/assets/css/nice-select.min.css" />
        <link rel="stylesheet" href="/assets/css/slick.min.css" />
        <link rel="stylesheet" href="/assets/css/jquery-ui.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="icon" href="/avntika-favicon.png" type="image/png" sizes="256x256" />
        <link rel="apple-touch-icon" href="/avntika-favicon.png" sizes="192x192" />
        <meta name="theme-color" content="#2d5016" />
      </head>
      <body suppressHydrationWarning>
        <CustomerAuthProvider>
          <ToastProvider>
            <FavoritesProvider>
              <CartProvider>
                <div className="site-shell">
                  <SiteHeader />
                  <FloatingCart />
                  {children}
                  <Footer />
                  <ScrollToTop />
                </div>
              </CartProvider>
            </FavoritesProvider>
          </ToastProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}

