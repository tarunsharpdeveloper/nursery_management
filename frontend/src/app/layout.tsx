import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Jost, Epilogue } from "next/font/google";
import { ChevronDown, Facebook, Instagram, Leaf, Search, ShoppingCart, User } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
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
  description: "Premium plants and seeds — Ujjain, Madhya Pradesh"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${jost.variable} ${epilogue.variable}`}>
      <body>
        <div className="site-shell">

          <SiteHeader />

          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
