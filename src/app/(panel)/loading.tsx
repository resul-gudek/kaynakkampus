/* Panel içi rota geçişleri. Kabuk (sidebar/üstbar) yerinde kalır,
   yalnızca içerik alanı bunu gösterir. */

import GecisYukleniyor from "@/components/maskot/GecisYukleniyor";

export default function PanelYukleniyor() {
  return (
    <main className="container">
      <GecisYukleniyor />
    </main>
  );
}
