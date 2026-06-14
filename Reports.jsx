import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, monthKey } from './constants';
import { Briefcase } from 'lucide-react';

export default function Reports() {
  const [profiles, setProfiles] = useState([]);
  const [clients, setClients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }, { data: a }, { data: t }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('activities').select('*'),
      supabase.from('targets').select('*').eq('month', monthKey()),
    ]);
    setProfiles(p || []);
    setClients(c || []);
    setActivities(a || []);
    setTargets(t || []);
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">جاري التحميل...</p>;

  const funnelTotal = STAGES.map((s) => ({ ...s, count: clients.filter((c) => c.stage === s.id).length }));
  const funnelMax = Math.max(1, ...funnelTotal.map((f) => f.count));

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
          <Briefcase size={15} style={{ color: C.gold }} /> قمع المبيعات - الفريق كله
        </h2>
        <div className="space-y-2.5">
          {funnelTotal.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-24 text-xs shrink-0" style={{ color: C.muted }}>{s.label}</div>
              <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: C.bg }}>
                <div
                  className="h-full rounded-md flex items-center justify-end px-2"
                  style={{ width: `${Math.max(6, (s.count / funnelMax) * 100)}%`, backgroundColor: s.color }}
                >
                  {s.count > 0 && <span className="text-[11px] font-bold" style={{ color: '#14181F' }}>{s.count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4 overflow-x-auto" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h2 className="font-display font-bold text-sm mb-4">
          أداء السيلز - {new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: C.muted }} className="text-right text-xs">
              <th className="py-2 pr-2">الاسم</th>
              <th className="py-2">عملاء نشطين</th>
              <th className="py-2">اجتماعات الشهر</th>
              <th className="py-2">صفقات الشهر / الهدف</th>
              <th className="py-2">التقدم</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const myClients = clients.filter((c) => c.owner_id === p.id);
              const active = myClients.filter((c) => c.stage !== 'won' && c.stage !== 'lost').length;
              const meetings = activities.filter((a) => a.owner_id === p.id && a.type === 'meeting' && a.date && a.date.startsWith(monthKey())).length;
              const deals = myClients.filter((c) => c.stage === 'won' && c.closed_at && c.closed_at.startsWith(monthKey())).length;
              const target = targets.find((t) => t.owner_id === p.id);
              const dealsTarget = target?.deals_target || 0;
              const meetingsTarget = target?.meetings_target || 0;
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="py-2 font-medium">{p.full_name || '—'}</td>
                  <td className="py-2" style={{ color: C.gold }}>{active}</td>
                  <td className="py-2">{meetings} / {meetingsTarget || '—'}</td>
                  <td className="py-2">{deals} / {dealsTarget || '—'}</td>
                  <td className="py-2" style={{ color: C.muted }}>
                    {dealsTarget ? `${Math.round((deals / dealsTarget) * 100)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
