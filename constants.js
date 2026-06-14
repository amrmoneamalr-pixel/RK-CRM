export const C = {
  bg: '#14181F',
  surface: '#1C222C',
  surfaceHover: '#242B37',
  border: '#2E3645',
  text: '#EDE7DC',
  muted: '#8B93A3',
  gold: '#C9A227',
  goldSoft: '#E8C66B',
};

export const STAGES = [
  { id: 'new',         label: 'عميل جديد',     color: '#C9714F' },
  { id: 'contacted',   label: 'تم التواصل',     color: '#6E8CAE' },
  { id: 'meeting',     label: 'اجتماع مجدول',   color: '#D4A24E' },
  { id: 'negotiation', label: 'تفاوض',          color: '#9B7EBD' },
  { id: 'won',         label: 'تم البيع',       color: '#7FA887' },
  { id: 'lost',        label: 'ملغي',           color: '#8A6862' },
];

export const ACTIVITY_TYPES = [
  { id: 'call',     label: 'مكالمة' },
  { id: 'meeting',  label: 'اجتماع' },
  { id: 'whatsapp', label: 'واتساب' },
  { id: 'visit',    label: 'زيارة' },
];

export const SOURCES = ['فيسبوك / إنستجرام', 'إحالة', 'حملة إعلانية', 'مكالمة واردة', 'أخرى'];

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmtMoney = (n) => (n ? Number(n).toLocaleString('en-US') : '');

export const stageOf = (id) => STAGES.find((s) => s.id === id) || STAGES[0];

export const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
};
