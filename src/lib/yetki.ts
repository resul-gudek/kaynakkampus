import type { Rol } from "@/lib/sabitler";

/* Rol → yetki eşlemesi. Yetkiler "modul:eylem" biçiminde tutulur;
   menü görünürlüğü ve sayfa içi kontroller aynı eşlemeden beslenir.
   Üç sabit rol olduğundan DB tablosu yerine kod tabanlı eşleme yeterli. */
const ROL_YETKILERI: Record<Rol, readonly string[]> = {
  admin: ["panel:admin", "koc:yonet", "mail:yonet"],
  koc: ["panel:koc", "sinif:goruntule", "odev:olustur", "bep:olustur", "bildirim:goruntule", "mesaj:goruntule"],
  ogrenci: ["panel:ogrenci", "sinif:goruntule", "bildirim:goruntule", "mesaj:goruntule"],
  veli: ["panel:veli"],
};

/** yetki null ise oturum açmış herkes erişir */
export function yetkiVar(rol: Rol, yetki: string | null): boolean {
  if (yetki === null) return true;
  return (ROL_YETKILERI[rol] ?? []).includes(yetki);
}
