import type { Rol } from "@/lib/sabitler";

/* Rol → yetki eşlemesi. Yetkiler "modul:eylem" biçiminde tutulur;
   menü görünürlüğü ve sayfa içi kontroller aynı eşlemeden beslenir.
   Üç sabit rol olduğundan DB tablosu yerine kod tabanlı eşleme yeterli. */
/* Ödeme yetkileri kasıtlı olarak üç ayrı anahtardır — hiçbiri diğerini
   kapsamaz. "odeme:yonet" tam finansal görünüm (öğrenci tutarı, öğretmen
   payı, platform payı) demektir ve YALNIZ yöneticidedir; öğrenci/öğretmen
   kendi bacağını gören ayrı anahtarları taşır (bkz. lib/odeme.ts). */
/* Öğretim kadrosunun (eğitim koçu + öğretmen) ortak yetkileri. İki rol
   yönetici ekranlarında ayrı yönetilir ama aynı öğretim panelini kullanır;
   "panel:koc" anahtarı geçmişe dönük uyumluluk için korunmuştur. */
const OGRETIM_YETKILERI = [
  "panel:koc", "sinif:goruntule", "odev:olustur", "bep:olustur",
  "bildirim:goruntule", "mesaj:goruntule", "video:yonet", "odeme:koc",
] as const;

const ROL_YETKILERI: Record<Rol, readonly string[]> = {
  admin: ["panel:admin", "koc:yonet", "mail:yonet", "basvuru:yonet", "bildirim:goruntule", "video:yonet", "blog:yonet", "odeme:yonet"],
  koc: OGRETIM_YETKILERI,
  ogretmen: OGRETIM_YETKILERI,
  ogrenci: ["panel:ogrenci", "sinif:goruntule", "bildirim:goruntule", "mesaj:goruntule", "odeme:ogrenci"],
  veli: ["panel:veli"],
};

/** yetki null ise oturum açmış herkes erişir */
export function yetkiVar(rol: Rol, yetki: string | null): boolean {
  if (yetki === null) return true;
  return (ROL_YETKILERI[rol] ?? []).includes(yetki);
}
