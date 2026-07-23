"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { ROL_ANASAYFA } from "@/lib/auth.config";

export type GirisSonuc = { hata?: string };

export async function girisYapAction(
  _onceki: GirisSonuc | undefined,
  formData: FormData
): Promise<GirisSonuc> {
  const rol = String(formData.get("rol") ?? "koc");
  try {
    await signIn("credentials", {
      kullanici: String(formData.get("kullanici") ?? ""),
      sifre: String(formData.get("sifre") ?? ""),
      rol,
      redirectTo: ROL_ANASAYFA[rol] ?? "/giris",
    });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      return { hata: "Kullanıcı adı, şifre ya da hesap türü hatalı. Lütfen tekrar deneyin." };
    }
    throw e; // NEXT_REDIRECT buradan geçer — yutma
  }
}
