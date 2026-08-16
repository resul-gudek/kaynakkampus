import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { ROL_ANASAYFA } from "./auth.config";
import { egitmenMi } from "./sabitler";

/** Oturumdaki kullanıcıyı DB'den doğrulayarak getirir.
    Oturum yok / kullanıcı silinmiş / pasif → girişe yönlendirir.
    rol verilirse yanlış roldeki kullanıcı kendi paneline yönlendirilir
    (middleware'e ek olarak savunma katmanı).

    "koc", öğretim panelinin geçmişten gelen rol anahtarıdır: öğretmen ayrı
    bir rol olmakla birlikte aynı paneli kullandığı için rol="koc" istendiğinde
    öğretmen de kabul edilir (bkz. lib/yetki.ts OGRETIM_YETKILERI). Yönetici
    ekranlarında iki rol ayrı listelenir/sayılır. */
export async function aktifKullanici(rol?: string) {
  const oturum = await auth();
  if (!oturum?.user?.id) redirect("/giris");
  const u = await prisma.kullanici.findUnique({ where: { id: oturum.user.id } });
  if (!u || !u.aktif) redirect("/giris");
  const rolUygun = !rol || (rol === "koc" ? egitmenMi(u.rol) : u.rol === rol);
  if (!rolUygun) redirect(ROL_ANASAYFA[u.rol] ?? "/giris");

  // Çevrimiçi tespiti için heartbeat: dakikada en çok bir kez sonGorulme güncellenir
  const simdi = Date.now();
  if (!u.sonGorulme || simdi - u.sonGorulme.getTime() > 60_000) {
    prisma.kullanici
      .update({ where: { id: u.id }, data: { sonGorulme: new Date(simdi) } })
      .catch(() => {}); // heartbeat hatası sayfayı düşürmesin
  }
  return u;
}
