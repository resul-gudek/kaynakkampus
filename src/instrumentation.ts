/* Next.js enstrümantasyon kancaları: sunucu açılışı + yakalanmamış istek hataları */

export async function register() {
  const { logcu } = await import("@/lib/log");
  logcu("sistem").info(
    { ortam: process.env.NODE_ENV, port: process.env.PORT ?? "37337" },
    "uygulama başlatıldı"
  );
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  const { logcu } = await import("@/lib/log");
  logcu("istek-hatasi").error(
    {
      yol: request.path,
      metot: request.method,
      rota: context.routePath,
      tur: context.routeType,
      hata: err instanceof Error ? { mesaj: err.message, stack: err.stack } : String(err),
    },
    "yakalanmamış istek hatası"
  );
}
