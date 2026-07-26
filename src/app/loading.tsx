/* Kabuk dışı geçişler: giriş → panel, başvuru, panel yerleşiminin
   kendisi (oturum + bildirim sayımları beklenirken). Panel içi
   geçişleri (panel)/loading.tsx karşılıyor. */

import GecisYukleniyor from "@/components/maskot/GecisYukleniyor";

export default function Yukleniyor() {
  return <GecisYukleniyor tam boyut={76} />;
}
