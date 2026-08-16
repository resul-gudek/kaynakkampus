"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { GIRIS_TURU_ANASAYFA } from "@/lib/auth.config";

export type GirisSonuc = { hata?: string };

export async function girisYapAction(
  _onceki: GirisSonuc | undefined,
  formData: FormData
): Promise<GirisSonuc> {
  // "tur" bir rol değil, hesap türüdür: egitimci (koç + öğretmen) | ogrenci | admin
  const tur = String(formData.get("tur") ?? "egitimci");
  try {
    await signIn("credentials", {
      kullanici: String(formData.get("kullanici") ?? ""),
      sifre: String(formData.get("sifre") ?? ""),
      tur,
      redirectTo: GIRIS_TURU_ANASAYFA[tur] ?? "/giris",
    });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      /* Hangi bilginin hatalı olduğu kasıtlı olarak söylenmez (hesap sayımı
         yapılmasın diye); ancak hesap türü de kimlik bilgisinin parçası
         olduğundan (bkz. lib/auth.ts) yanlış sekme sık karşılaşılan bir
         hatadır — sekmeyi kontrol etmesi açıkça hatırlatılır. */
      return {
        hata:
          "Kullanıcı adı, şifre ya da seçilen hesap türü hatalı. " +
          "Üstteki sekmenin hesabınızın türüyle (Eğitimci / Öğrenci / Yönetici) aynı olduğundan emin olun.",
      };
    }
    throw e; // NEXT_REDIRECT buradan geçer — yutma
  }
}
