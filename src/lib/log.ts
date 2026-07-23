import pino from "pino";

/* ═══════════════════════════════════════════════════════════════
   Merkezi loglama — pino tabanlı, yalnız sunucu tarafında kullanılır.

   Ortam değişkenleri:
   - LOG_LEVEL : trace|debug|info|warn|error|fatal (varsayılan: info,
                 geliştirmede debug)
   - LOG_DOSYA : verilirse loglar konsola EK olarak bu dosyaya da
                 JSON satırları halinde yazılır (örn. logs/uygulama.log)

   Kullanım:
     import { logcu } from "@/lib/log";
     const log = logcu("odev");
     log.info({ odevId, ogrenciId }, "ödev eklendi");
   ═══════════════════════════════════════════════════════════════ */

const gelistirme = process.env.NODE_ENV !== "production";
const seviye = process.env.LOG_LEVEL ?? (gelistirme ? "debug" : "info");
const dosya = process.env.LOG_DOSYA;

function hedefler(): pino.TransportTargetOptions[] {
  const liste: pino.TransportTargetOptions[] = [];
  if (gelistirme) {
    // Geliştirmede renkli, tek satır okunur çıktı
    liste.push({
      target: "pino-pretty",
      level: seviye,
      options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
    });
  } else {
    // Production'da stdout'a JSON satırları (log toplayıcılar için)
    liste.push({ target: "pino/file", level: seviye, options: { destination: 1 } });
  }
  if (dosya) {
    liste.push({
      target: "pino/file",
      level: seviye,
      options: { destination: dosya, mkdir: true },
    });
  }
  return liste;
}

export const log = pino(
  {
    level: seviye,
    base: undefined, // pid/hostname alanlarını ekleme
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (etiket) => ({ seviye: etiket }) },
  },
  pino.transport({ targets: hedefler() })
);

/** Modül bazlı alt logger: logcu("auth"), logcu("odev")… */
export function logcu(modul: string) {
  return log.child({ modul });
}

/** Denetim (audit) kaydı: kim, hangi işlemi, hangi kayıt üzerinde yaptı.
    Önemli mutasyonlarda çağrılır; seviyesi her zaman info'dur. */
export function denetim(
  islem: string,
  kimlik: { id: string; rol: string },
  detay?: Record<string, unknown>
) {
  log.info({ modul: "denetim", islem, kullaniciId: kimlik.id, rol: kimlik.rol, ...detay }, islem);
}
