import {
  Activity,
  AlarmClock,
  Bell,
  BookOpen,
  CalendarDays,
  ChartLine,
  ClipboardList,
  Clapperboard,
  Compass,
  CreditCard,
  GraduationCap,
  Home,
  Hand,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Mail,
  Map,
  MessageSquare,
  MonitorPlay,
  Newspaper,
  NotebookPen,
  Presentation,
  Star,
  Target,
  Timer,
  TrendingUp,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/* Panel ikon kayıtçısı — navigasyon.ts ve dashboard stat kartları buradaki
   adları kullanır. Emoji yerine tutarlı çizgi ikonlar (lucide). Sunucu
   bileşenlerinde de çalışır; lucide ikonları saf SVG üretir. */
const IKONLAR: Record<string, LucideIcon> = {
  panel: LayoutDashboard,
  alarm: AlarmClock,
  el: Hand,
  ev: Home,
  ajanda: CalendarDays,
  ogrenciler: Users,
  sure: Timer,
  odeme: CreditCard,
  odev: BookOpen,
  takip: ListChecks,
  harita: Map,
  grafik: ChartLine,
  artis: TrendingUp,
  mezuniyet: GraduationCap,
  video: Clapperboard,
  videoOynat: MonitorPlay,
  hedef: Target,
  veli: UsersRound,
  pusula: Compass,
  ogretmen: Presentation,
  yildiz: Star,
  gelenKutusu: Inbox,
  aktivite: Activity,
  mail: Mail,
  blog: Newspaper,
  odevOlustur: NotebookPen,
  bep: ClipboardList,
  mesaj: MessageSquare,
  zil: Bell,
};

export default function PanelIkon({
  ad,
  boyut = 18,
  className,
}: {
  ad: string;
  boyut?: number;
  className?: string;
}) {
  const Ikon = IKONLAR[ad] ?? LayoutDashboard;
  return <Ikon size={boyut} strokeWidth={2} className={className} aria-hidden="true" />;
}
