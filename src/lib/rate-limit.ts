/* Basit, bellek-içi kayan pencere hız sınırlayıcı.
   Tek Node sunucusu için yeterlidir (mevcut mimari böyle çalışıyor).
   Sayaç globalThis üzerinde tutulur; dev hot-reload'da sıfırlanmaz. */

interface Kova {
  zamanlar: number[];
}

const kuresel = globalThis as typeof globalThis & {
  __hizSiniri?: Map<string, Kova>;
};

function depo(): Map<string, Kova> {
  if (!kuresel.__hizSiniri) kuresel.__hizSiniri = new Map();
  return kuresel.__hizSiniri;
}

/**
 * `anahtar` için `pencereMs` içinde en çok `azami` isteğe izin verir.
 * İzin veriliyorsa true, sınır aşıldıysa false döner.
 */
export function hizSiniriIzin(anahtar: string, azami: number, pencereMs: number): boolean {
  const simdi = Date.now();
  const d = depo();
  const kova = d.get(anahtar) ?? { zamanlar: [] };
  kova.zamanlar = kova.zamanlar.filter((t) => simdi - t < pencereMs);

  if (kova.zamanlar.length >= azami) {
    d.set(anahtar, kova);
    return false;
  }
  kova.zamanlar.push(simdi);
  d.set(anahtar, kova);

  // Ara sıra eski anahtarları buda (bellek şişmesin)
  if (d.size > 5000) {
    for (const [k, v] of d) {
      if (v.zamanlar.every((t) => simdi - t >= pencereMs)) d.delete(k);
    }
  }
  return true;
}
