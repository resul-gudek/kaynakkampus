import type { Metadata } from "next";
import { Manrope, Figtree } from "next/font/google";
import TemaSaglayici from "@/components/TemaSaglayici";
import { SITE_KOKU } from "@/lib/site";
import "./globals.css";

/* DESIGN.md: başlıklar için Platform'un yerini Manrope (iri, sıkı, yüksek
   kontrastlı display), gövde/arayüz için Figtree tutar. */
const manrope = Manrope({
  weight: ["600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-baslik",
});

const figtree = Figtree({
  /* 700/800 de yüklenir: panel modüllerinde kalın gövde metinleri var,
     ağırlık yüklenmezse tarayıcı en yakınına (600) düşürüyor. */
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-govde",
});

export const metadata: Metadata = {
  /* Göreli openGraph/canonical adresleri bu köke göre mutlaklaşır */
  metadataBase: new URL(SITE_KOKU),
  title: "Kaynak Kampüs",
  description: "Güçlü Kaynak, Sağlam Gelecek — koçluk ve takip sistemi",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kaynak Kampüs", statusBarStyle: "default" },
};

export const viewport = { themeColor: "#7A2035" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* suppressHydrationWarning: next-themes ilk boyamada <html>'e
       data-theme yazdığı için gerekli */
    <html lang="tr" className={`${manrope.variable} ${figtree.variable}`} suppressHydrationWarning>
      <body>
        <TemaSaglayici>{children}</TemaSaglayici>
      </body>
    </html>
  );
}
