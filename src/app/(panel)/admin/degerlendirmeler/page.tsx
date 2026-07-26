import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/oturum";
import { tarihStr } from "@/lib/hesap";
import DegerlendirmeGoster from "@/components/degerlendirme/DegerlendirmeGoster";
import { degerlendirmeSerile } from "@/components/degerlendirme/alanlar";
import a from "../admin.module.css";
import dg from "@/components/degerlendirme/degerlendirme.module.css";

export const metadata: Metadata = { title: "Değerlendirmeler – Kaynak Kampüs" };

export default async function DegerlendirmelerSayfasi() {
  await aktifKullanici("admin");

  const dersler = await prisma.ozelDers.findMany({
    where: { durum: "yapildi", degerlendirmeler: { some: {} } },
    orderBy: [{ tarih: "desc" }, { saat: "desc" }],
    include: {
      koc: { select: { ad: true } },
      ogrenci: { select: { ad: true } },
      degerlendirmeler: true,
    },
  });

  return (
    <main className="container" style={{ maxWidth: 1160, paddingBottom: 40 }}>
      <div className="panel-bas">
        <h1>
          Ders <span>Değerlendirmeleri</span>
        </h1>
        <p>
          Tamamlanan özel derslerdeki karşılıklı öğretmen–öğrenci değerlendirmelerini buradan
          izleyebilirsiniz. 🔒 Taraflar birbirinin değerlendirmesini göremez; her iki yönün tam
          hâli yalnızca bu sayfada görünür (veli, öğretmenin yalnızca puan özetini görür).
        </p>
      </div>

      {dersler.length === 0 ? (
        <section className={a.bolum}>
          <p style={{ color: "var(--muted)", padding: "8px 0" }}>
            Henüz değerlendirilmiş bir ders yok. Öğretmen ya da öğrenci bir dersi
            değerlendirdiğinde burada görünecek.
          </p>
        </section>
      ) : (
        dersler.map((x) => {
          const kocOgr = x.degerlendirmeler.find((d) => d.yon === "kocOgrenci");
          const ogrKoc = x.degerlendirmeler.find((d) => d.yon === "ogrenciKoc");
          return (
            <section key={x.id} className={a.bolum} style={{ marginBottom: 16 }}>
              <h2>
                {x.ders}
                {x.konu ? " – " + x.konu : ""}{" "}
                <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: ".82rem" }}>
                  {tarihStr(x.tarih)}
                  {x.saat ? " · " + x.saat : ""}
                </span>
              </h2>
              <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: -8, marginBottom: 12 }}>
                👩‍🏫 {x.koc?.ad ?? "—"} · 🎓 {x.ogrenci?.ad ?? "—"}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                <div className={dg.blok} style={{ marginTop: 0 }}>
                  <div className={dg.blokBas}>
                    <b>👩‍🏫 → 🎓 Öğretmenin değerlendirmesi</b>
                  </div>
                  {kocOgr ? (
                    <DegerlendirmeGoster deger={degerlendirmeSerile(kocOgr)} />
                  ) : (
                    <small style={{ color: "var(--muted)" }}>Öğretmen henüz değerlendirmedi.</small>
                  )}
                </div>
                <div className={dg.blok} style={{ marginTop: 0 }}>
                  <div className={dg.blokBas}>
                    <b>🎓 → 👩‍🏫 Öğrencinin değerlendirmesi</b>
                  </div>
                  {ogrKoc ? (
                    <DegerlendirmeGoster deger={degerlendirmeSerile(ogrKoc)} />
                  ) : (
                    <small style={{ color: "var(--muted)" }}>Öğrenci henüz değerlendirmedi.</small>
                  )}
                </div>
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
