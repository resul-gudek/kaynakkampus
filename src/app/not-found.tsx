import Link from "next/link";
import Kivilcim from "@/components/maskot/Kivilcim";

export default function BulunamadiSayfasi() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 24,
        textAlign: "center",
      }}
    >
      <Kivilcim ifade="soru" boyut={80} />
      <h1 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Sayfa bulunamadı</h1>
      <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>
      <Link href="/" className="btn btn-primary btn-kucuk">
        Ana Sayfaya Dön
      </Link>
    </main>
  );
}
