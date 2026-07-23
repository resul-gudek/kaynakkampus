export default function PanelYukleniyor() {
  return (
    <main className="container" style={{ padding: "60px 24px", textAlign: "center" }}>
      <div
        aria-label="Yükleniyor"
        style={{
          width: 40,
          height: 40,
          margin: "0 auto 14px",
          border: "4px solid var(--bg-soft)",
          borderTopColor: "var(--blue)",
          borderRadius: "50%",
          animation: "donme .8s linear infinite",
        }}
      />
      <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>Yükleniyor…</p>
      <style>{`@keyframes donme { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
