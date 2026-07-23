import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

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

/** Hata nesnesini kullanıcıya gösterilecek metne çevirir */
export function hataMetni(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return "Beklenmeyen bir hata oluştu.";
}
