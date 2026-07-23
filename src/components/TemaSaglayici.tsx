"use client";

import { ThemeProvider } from "next-themes";

/* Tema, <html data-theme="..."> özniteliğiyle uygulanır (globals.css'teki
   [data-theme="dark"] token seti). Varsayılan: sistem teması. */
export default function TemaSaglayici({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
