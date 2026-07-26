import type { Metadata } from "next";
import { Poppins, Cormorant_Garamond } from "next/font/google";
import TemaSaglayici from "@/components/TemaSaglayici";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-poppins",
});

const cormorant = Cormorant_Garamond({
  weight: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Kaynak Kampüs",
  description: "Güçlü Kaynak, Sağlam Gelecek — koçluk ve takip sistemi",
  icons: {
    icon: [
      { url: "/assets/kaynak-kampus-logo-64.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon.ico" },
    ],
    apple: "/assets/kaynak-kampus-logo.png",
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
    <html lang="tr" className={`${poppins.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body>
        <TemaSaglayici>{children}</TemaSaglayici>
      </body>
    </html>
  );
}
