"use client";

import Kivilcim from "@/components/maskot/Kivilcim";

export default function HataSayfasi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      {/* Hata, maskotun görünmesi gereken sürtünme anlarından biri;
          anlamı başlık taşıyor, Kıvılcım dekoratif kalıyor. */}
      <Kivilcim ifade="uyari" boyut={80} />
      <h1 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Bir şeyler ters gitti</h1>
      <p style={{ color: "var(--muted)", fontSize: ".9rem", maxWidth: 420 }}>
        Beklenmeyen bir hata oluştu. Tekrar deneyebilir ya da ana sayfaya dönebilirsiniz.
        {error.digest && <small style={{ display: "block", marginTop: 8 }}>Kod: {error.digest}</small>}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary btn-kucuk" onClick={reset}>
          Tekrar Dene
        </button>
        <a href="/" className="btn btn-outline btn-kucuk">
          Ana Sayfa
        </a>
      </div>
    </main>
  );
}
