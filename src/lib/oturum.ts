import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { ROL_ANASAYFA } from "./auth.config";

/** Oturumdaki kullanıcıyı DB'den doğrulayarak getirir.
    Oturum yok / kullanıcı silinmiş / pasif → girişe yönlendirir.
    rol verilirse yanlış roldeki kullanıcı kendi paneline yönlendirilir
    (middleware'e ek olarak savunma katmanı). */
export async function aktifKullanici(rol?: string) {
  const oturum = await auth();
  if (!oturum?.user?.id) redirect("/giris");
  const u = await prisma.kullanici.findUnique({ where: { id: oturum.user.id } });
  if (!u || !u.aktif) redirect("/giris");
  if (rol && u.rol !== rol) redirect(ROL_ANASAYFA[u.rol] ?? "/giris");
  return u;
}
