import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BASVURU_TURLERI } from "@/lib/sabitler";
import { FORMLAR } from "../formlar";
import type { FormTanimi } from "../tipler";
import BasvuruSihirbazi from "../BasvuruSihirbazi";
import stil from "../basvuru.module.css";

type Parametreler = Promise<{ tur: string }>;

function formSec(tur: string): FormTanimi | null {
  return (BASVURU_TURLERI as readonly string[]).includes(tur)
    ? FORMLAR[tur as FormTanimi["tur"]]
    : null;
}

export async function generateMetadata({ params }: { params: Parametreler }): Promise<Metadata> {
  const { tur } = await params;
  const form = formSec(tur);
  return { title: form ? `${form.baslik} – Kaynak Kampüs` : "Başvuru – Kaynak Kampüs" };
}

export default async function BasvuruFormPage({ params }: { params: Parametreler }) {
  const { tur } = await params;
  const form = formSec(tur);
  if (!form) notFound();

  return (
    <>
      <h1 className={stil.formBaslik}>{form.baslik}</h1>
      <p className={stil.formUst}>Bilgileriniz gizli tutulur ve yalnız değerlendirme için kullanılır.</p>
      <BasvuruSihirbazi tur={form.tur} />
    </>
  );
}
