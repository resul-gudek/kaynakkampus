/* Ortak tarih biçimleme — İstanbul saatiyle "Bugün · 14:35" / "20.07.2026 · 14:35" */
export function zamanStr(t: Date): string {
  const istanbul = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const saat = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });
  const gun = istanbul.format(t);
  const bugunStr = istanbul.format(new Date());
  return (gun === bugunStr ? "Bugün" : gun) + " · " + saat.format(t);
}
