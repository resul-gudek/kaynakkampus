import Link from "next/link";

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
      <span style={{ fontSize: "2.6rem" }}>🧭</span>
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
