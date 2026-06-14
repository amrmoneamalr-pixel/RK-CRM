import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, ACTIVITY_TYPES, monthKey, todayStr, fmtDate } from './constants';
import { Users, Clock, CheckCircle2, BarChart3 } from 'lucide-react';

export function ProgressBar({ value, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-display font-bold">
          {value} <span style={{ color: C.muted, fontWeight: 400 }}>/ {target || '—'}</span>
        </span>
        <span style={{ color: C.muted }}>{target > 0 ? `${pct}%` : 'لم يتم تحديد هدف'}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: C.bg }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Dashboard({ userId }) {
  const [clients, setClients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [targets, setTargets] = useState({ deals_target: 0, meetings_target: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: a }, { data: t }] = await Promise.all([
      supabase.from('clients').select('*').eq('owner_id', userId),
      supabase.from('activities').select('*').eq('owner_id', userId),
      supabase.from('targets').select('*').eq('owner_id', userId).eq('month', monthKey()).maybeSingle(),
    ]);
    setClients(c || []);
    setActivities(a || []);
    setTargets(t || { deals_target: 0, meetings_target: 0 });
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">جاري التحميل...</p>;

  const activeClients = clients.filter((c) => c.stage !== 'won' && c.stage !== 'lost');
  const today = todayStr();
  const due = clients.filter((c) => c.next_follow_up && c.stage !== 'won' && c.stage !== 'lost');
  const overdue = due.filter((c) => c.next_follow_up < today).length;
  const dueToday = due.filter((c) => c.next_follow_up === today).length;
  const dealsThisMonth = clients.filter((c) => c.stage === 'won' && c.closed_at && c.closed_at.startsWith(monthKey())).length;
  const meetingsThisMonth = activities.filter((a) => a.type === 'meeting' && a.date && a.date.startsWith(monthKey())).length;
  const conversionRate = clients.length
    ? Math.round((clients.filter((c) => c.stage === 'won').length / clients.length) * 100)
    : 0;
  const funnelCounts = STAGES.map((s) => ({ ...s, count: clients.filter((c) => c.stage === s.id).length }));
  const funnelMax = Math.max(1, ...funnelCounts.map((f) => f.count));

  const stats = [
    { label: 'عملاء نشطين', value: activeClients.length, icon: Users, color: C.gold },
    {
      label: 'متابعات مستحقة',
      value: overdue + dueToday,
      icon: Clock,
      color: overdue > 0 ? '#C9714F' : '#6E8CAE',
      sub: overdue > 0 ? `${overdue} متأخرة` : null,
    },
    { label: 'صفقات هذا الشهر', value: `${dealsThisMonth} / ${targets.deals_target || 0}`, icon: CheckCircle2, color: '#7FA887' },
    { label: 'معدل التحويل', value: `${conversionRate}%`, icon: BarChart3, color: '#9B7EBD' },
  ];

  const recent = [...activities]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 6)
    .map((a) => ({ ...a, client: clients.find((c) => c.id === a.client_id) }))
    .filter((a) => a.client);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl p-3.5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <Icon size={16} style={{ color: s.color }} className="mb-2" />
              <div className="font-display text-xl font-extrabold">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: C.muted }}>{s.label}</div>
              {s.sub && <div className="text-[11px] mt-0.5" style={{ color: '#C9714F' }}>{s.sub}</div>}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h2 className="font-display font-bold text-sm mb-4">قمع المبيعات</h2>
        <div className="space-y-2.5">
          {funnelCounts.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-24 text-xs shrink-0" style={{ color: C.muted }}>{s.label}</div>
              <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: C.bg }}>
                <div
                  className="h-full rounded-md flex items-center justify-end px-2 transition-all"
                  style={{ width: `${Math.max(6, (s.count / funnelMax) * 100)}%`, backgroundColor: s.color }}
                >
                  {s.count > 0 && <span className="text-[11px] font-bold" style={{ color: '#14181F' }}>{s.count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h2 className="font-display font-bold text-sm mb-3">الاجتماعات هذا الشهر</h2>
        <ProgressBar value={meetingsThisMonth} target={targets.meetings_target || 0} color="#6E8CAE" />
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h2 className="font-display font-bold text-sm mb-3">آخر نشاط</h2>
        {recent.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>لسه معندك أي متابعات مسجلة.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((a) => {
              const type = ACTIVITY_TYPES.find((t) => t.id === a.type) || ACTIVITY_TYPES[0];
              return (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: C.bg }}>
                  <div className="text-sm">{a.client.name} — {type.label}</div>
                  <div className="text-[11px]" style={{ color: C.muted }}>{fmtDate(a.date)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
