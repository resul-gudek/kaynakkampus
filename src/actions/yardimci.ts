import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logcu } from "@/lib/log";

const log = logcu("eylem");

export type EylemSonuc = { hata?: string; tamam?: boolean };

/** Server action'larda oturum + rol zorunluluğu (middleware'e ek savunma katmanı). */
export async function oturumGerekli(...roller: string[]) {
  const oturum = await auth();
  const u = oturum?.user;
  if (!u?.id || !u.rol) throw new Error("Oturum bulunamadı.");
  if (roller.length && !roller.includes(u.rol)) throw new Error("Bu işlem için yetkiniz yok.");
  return { id: u.id, rol: u.rol };
}

/** Mutasyon sonrası panellerin tazelenmesi */
export function panelleriTazele() {
  revalidatePath("/koc");
  revalidatePath("/ogrenci");
  revalidatePath("/bildirimler");
  revalidatePath("/", "layout"); // header'daki okunmamış rozeti
}

/** Hata nesnesini loglar ve kullanıcıya gösterilecek metne çevirir.
    Tüm action catch blokları buradan geçtiği için hatalar merkezî loglanır. */
export function hataMetni(e: unknown, eylem?: string): string {
  if (e instanceof Error && e.message) {
    log.error({ eylem, hata: e.message, stack: e.stack }, "eylem hatası");
    return e.message;
  }
  log.error({ eylem, hata: String(e) }, "eylem hatası");
  return "Beklenmeyen bir hata oluştu.";
}
