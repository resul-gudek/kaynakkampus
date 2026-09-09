import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { aktifKullanici } from "@/lib/oturum";
import { yetkiVar } from "@/lib/yetki";
import { ROL_ANASAYFA } from "@/lib/auth.config";
import type { Rol } from "@/lib/sabitler";
import { agaciGetir } from "@/lib/etkinlik-sunucu";
import type { EtkinlikDugumu } from "@/lib/etkinlik";
import type { EtkinlikTuru } from "@/lib/sabitler";
import EtkinlikYonetim from "./EtkinlikYonetim";

export const metadata: Metadata = { title: "Etkinlikler – Kaynak Kampüs" };

export default async function AdminEtkinlikSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ klasor?: string }>;
}) {
  const kullanici = await aktifKullanici();
  const rol = kullanici.rol as Rol;
  if (!yetkiVar(rol, "etkinlik:yonet")) redirect(ROL_ANASAYFA[rol] ?? "/giris");

  const { klasor } = await searchParams;

  /* Ağacın TAMAMI tek sorguyla gelir (taslaklar dâhil). Yüzlerce düğümde
     bile tek gidiş-geliş; kırıntı yolu, taşıma hedefleri ve alt ağaç
     sayımları istemcide ek istek olmadan hesaplanır. */
  const ham = await agaciGetir();

  const dugumler: EtkinlikDugumu[] = ham.map((d) => ({
    id: d.id,
    ustId: d.ustId,
    tur: d.tur as EtkinlikTuru,
    ad: d.ad,
    slug: d.slug,
    sira: d.sira,
    durum: d.durum,
    dosyaVar: !!d.dosyaYol,
    dosyaAd: d.dosyaAd,
    dosyaBoyut: d.dosyaBoyut,
    kapakVar: !!d.kapakYol,
  }));

  /* Adresteki klasör silinmiş olabilir → köke düş */
  const acikKlasor = klasor && dugumler.some((d) => d.id === klasor && d.tur === "klasor")
    ? klasor
    : null;

  return <EtkinlikYonetim dugumler={dugumler} acikKlasor={acikKlasor} />;
}
