import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Kaynak Akademi",
  description: "Doğru Kaynak, Doğru Gelecek — koçluk ve takip sistemi",
  icons: { icon: "/assets/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
