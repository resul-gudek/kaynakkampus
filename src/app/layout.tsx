import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import TemaSaglayici from "@/components/TemaSaglayici";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Kaynak Akademi",
  description: "Doğru Kaynak, Doğru Gelecek — koçluk ve takip sistemi",
  icons: { icon: "/assets/logo.png", apple: "/assets/logo.png" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kaynak Akademi", statusBarStyle: "default" },
};

export const viewport = { themeColor: "#18377f" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* suppressHydrationWarning: next-themes ilk boyamada <html>'e
       data-theme yazdığı için gerekli */
    <html lang="tr" className={poppins.variable} suppressHydrationWarning>
      <body>
        <TemaSaglayici>{children}</TemaSaglayici>
      </body>
    </html>
  );
}
