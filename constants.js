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
  { id: 'new',         label: 'New Lead',         color: '#D6453E' },
  { id: 'contacted',   label: 'Contacted',        color: '#6E8CAE' },
  { id: 'meeting',     label: 'Meeting Scheduled', color: '#D4A24E' },
  { id: 'negotiation', label: 'Negotiation',      color: '#9B7EBD' },
  { id: 'won',         label: 'Won',              color: '#7FA887' },
  { id: 'lost',        label: 'Lost',             color: '#8A6862' },
];

export const ACTIVITY_TYPES = [
  { id: 'call',     label: 'Call' },
  { id: 'meeting',  label: 'Meeting' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'visit',    label: 'Visit' },
];

export const ACTIVITY_TYPE_LABELS = {
  call: 'Call',
  meeting: 'Meeting',
  whatsapp: 'WhatsApp',
  visit: 'Visit',
  system: 'Update',
};

export const activityLabel = (type) => ACTIVITY_TYPE_LABELS[type] || type;

export const SOURCES = ['Facebook Campaign', 'Instagram Campaign', 'Facebook Organic', 'Instagram Organic', 'WhatsApp', 'TikTok', 'Outsource Marketing'];

export const LEAD_ORIGINS = ['RK', 'Marketing', 'Top Management'];
export const TOP_MANAGEMENT_NAMES = ['Rania Khalid', 'Amr Abdel Moneam', 'Mohamed Khalid'];

export const ACTIONS = ['Contacted', 'No Answer', 'Switched Off', 'Send WhatsApp', 'Not Interested', 'Not Qualified', 'Interest in Resale', 'Interest in Separate'];

export const DEVELOPERS = ['Mountain View', 'Tatweer Misr', 'City Edge', 'SODIC', 'Palm Hills', 'Emaar Misr', 'Madinet Nasr Housing', 'Modon Developments', 'Hassan Allam', 'Ora Developers'];

export const LOCATIONS = ['New Cairo', 'New Administrative Capital', 'Mostakbal City', 'Sheikh Zayed', 'New Zayed', '6th of October', '6th Settlement', 'North Coast', 'Ain Sokhna'];

export const CALL_RESULTS = ['No Answer', 'No Answer - Multiple Times', 'Interested - Thinking', 'Call Again', 'Not Qualified', 'Not Interested', 'Very Interested', 'Wrong Number'];

export const TITLES = [
  { id: 'sales', label: 'Sales' },
  { id: 'team_leader', label: 'Team Leader' },
  { id: 'sales_manager', label: 'Sales Manager' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'operation', label: 'Operation' },
  { id: 'top_management', label: 'Top Management' },
];

export const titleLabel = (t) => TITLES.find((x) => x.id === t)?.label || t;

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const todayStr = () => {
  const d = new Date();
  const cairo = new Date(d.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
  const y = cairo.getFullYear();
  const m = String(cairo.getMonth() + 1).padStart(2, '0');
  const day = String(cairo.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fmtMoney = (n) => (n ? Number(n).toLocaleString('en-US') : '');

export const stageOf = (id) => STAGES.find((s) => s.id === id) || STAGES[0];

export const stageIdFromInput = (val) => {
  if (!val) return 'new';
  const v = String(val).trim().toLowerCase();
  const byId = STAGES.find((s) => s.id.toLowerCase() === v);
  if (byId) return byId.id;
  const byLabel = STAGES.find((s) => s.label.toLowerCase() === v);
  if (byLabel) return byLabel.id;
  return 'new';
};

export const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const fmtDateTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const waLink = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  // Local Egyptian format: 01xxxxxxxxx → 201xxxxxxxxx
  if (digits.startsWith('0')) digits = '20' + digits.slice(1);
  return `https://wa.me/${digits}`;
};

export const COLD_RESULTS = ['No Answer', 'No Answer - Multiple Times', 'Call Again'];

export const leadCategory = (c) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (c.stage === 'new' && !c.ever_contacted && c.created_at >= sevenDaysAgo) return { label: 'New Fresh Lead',  color: '#D6453E' };
  if (c.stage === 'new' && !c.ever_contacted && c.created_at <  sevenDaysAgo) return { label: 'Old Fresh Lead',  color: '#C9714F' };
  if (COLD_RESULTS.includes(c.call_result))                                   return { label: 'Cold Calls',      color: '#6E8CAE' };
  if (c.rotation_cycle > 0 || (c.previous_owners && c.previous_owners.length > 0)) return { label: 'Old Campaign', color: '#9B7EBD' };
  return { label: 'Active', color: '#7FA887' };
};

const CONTACTED_ACTIONS = ['Contacted', 'No Answer', 'Switched Off', 'Send WhatsApp', 'Interested - Thinking', 'Very Interested', 'Call Again', 'Interest in Resale', 'Interest in Separate'];

export const clientStatus = (c) => {
  if (c.stage === 'won')                                        return { label: 'Deal',          color: '#7FA887' };
  if (c.call_result === 'Not Interested')                       return { label: 'Not Interested', color: '#C9714F' };
  if (c.call_result === 'Not Qualified')                        return { label: 'Not Qualified',  color: '#C9714F' };
  if (c.call_result && CONTACTED_ACTIONS.includes(c.call_result)) return { label: 'Contacted',   color: '#FFFFFF' };
  if (c.ever_contacted)                                         return { label: 'Contacted',      color: '#FFFFFF' };
  if (c.previous_owners && c.previous_owners.length > 0)       return { label: 'Re-rotation',    color: '#D4A24E' };
  return { label: 'New', color: '#D6453E' };
};

// Updated LEAD_CATEGORY_LABELS with new keys
export const LEAD_CATEGORY_LABELS = {
  all:               'All Leads',
  newFresh:          'New Fresh Leads',
  contactedFresh:    'Contacted New Fresh Leads',
  callbackToday:     'Call Back Today',
  late:              'Late Leads',
  reRotation:        'Re-rotation',
  oldFresh:          'Old Fresh Leads',
  contactedOldFresh: 'Contacted Old Fresh Leads',
  cold:              'Cold Calls',
  contactedCold:     'Contacted Cold Calls',
  potential:         'Potential Clients',
};

export const matchesLeadCategory = (c, category) => {
  const today = todayStr();
  switch (category) {
    case 'newFresh':
      return c.stage_category === 'New Fresh Lead' && !c.ever_contacted;
    case 'contactedFresh':
      return c.stage_category === 'New Fresh Lead' && c.ever_contacted;
    case 'callbackToday':
      return c.next_follow_up === today;
    case 'late':
      return !!c.next_follow_up && c.next_follow_up < today;
    case 'oldFresh':
      return c.stage_category === 'Old Fresh Lead' || c.stage_category === 'Old Campaign';
    case 'cold':
      return c.stage_category === 'Cold Calls';
    default:
      return true;
  }
};
