"use client";

import { useState, useSyncExternalStore } from "react";
import type { NavKalemi } from "@/lib/navigasyon";
import Sidebar from "./Sidebar";
import UstBar from "./UstBar";
import type { ZilBildirim } from "./BildirimZili";

interface Props {
  kullanici: { ad: string; etiket: string };
  kalemler: NavKalemi[];
  okunmamis: number;
  okunmamisMesaj: number;
  sonBildirimler: ZilBildirim[];
  cikisAction: () => Promise<void>;
  children: React.ReactNode;
}

/* Daraltma tercihi localStorage'da tutulur; useSyncExternalStore SSR'da
   "geniş" varsayar, hydration sonrası gerçek değeri okur */
const darDinleyiciler = new Set<() => void>();
const darAbone = (cb: () => void) => {
  darDinleyiciler.add(cb);
  return () => darDinleyiciler.delete(cb);
};
const darOku = () => localStorage.getItem("sidebar-dar") === "1";

export default function PanelKabuk({ kullanici, kalemler, okunmamis, okunmamisMesaj, sonBildirimler, cikisAction, children }: Props) {
  const [mobilAcik, setMobilAcik] = useState(false);
  const dar = useSyncExternalStore(darAbone, darOku, () => false);

  const darDegistir = () => {
    localStorage.setItem("sidebar-dar", dar ? "0" : "1");
    darDinleyiciler.forEach((cb) => cb());
  };

  const bildirimKalemi = kalemler.find((k) => k.bildirim) ?? null;

  /* hatem-crm düzeni: üst bar tam genişlikte en üstte, sidebar onun altında */
  return (
    <div className={`panel-kabuk${dar ? " dar" : ""}`}>
      <UstBar
        kullanici={kullanici}
        okunmamis={okunmamis}
        bildirimHref={bildirimKalemi?.href ?? null}
        bildirimler={sonBildirimler}
        cikisAction={cikisAction}
        mobilAcik={mobilAcik}
        onMenuAc={() => setMobilAcik((a) => !a)}
      />

      {/* Mobil çekmece her zaman tam menü gösterir; daraltma masaüstü tercihi */}
      <Sidebar
        kalemler={kalemler}
        okunmamis={okunmamis}
        okunmamisMesaj={okunmamisMesaj}
        dar={mobilAcik ? false : dar}
        mobilAcik={mobilAcik}
        onKapat={() => setMobilAcik(false)}
        onDarDegistir={darDegistir}
      />
      {mobilAcik && <div className="sidebar-perde" onClick={() => setMobilAcik(false)} />}

      <div className="panel-icerik">
        <main>{children}</main>
      </div>
    </div>
  );
}
