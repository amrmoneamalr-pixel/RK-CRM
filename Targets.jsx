import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { C, monthKey } from '../lib/constants';
import { ProgressBar } from './Dashboard';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

export default function Targets({ userId }) {
  const [targets, setTargets] = useState({ deals_target: 0, meetings_target: 0 });
  const [dealsThisMonth, setDealsThisMonth] = useState(0);
  const [meetingsThisMonth, setMeetingsThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const monthLabel = new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: clients }, { data: activities }] = await Promise.all([
      supabase.from('targets').select('*').eq('owner_id', userId).eq('month', monthKey()).maybeSingle(),
      supabase.from('clients').select('*').eq('owner_id', userId),
      supabase.from('activities').select('*').eq('owner_id', userId),
    ]);
    setTargets(t || { deals_target: 0, meetings_target: 0 });
    setDealsThisMonth((clients || []).filter((c) => c.stage === 'won' && c.closed_at && c.closed_at.startsWith(monthKey())).length);
    setMeetingsThisMonth((activities || []).filter((a) => a.type === 'meeting' && a.date && a.date.startsWith(monthKey())).length);
    setLoading(false);
  };

  const save = async (patch) => {
    const next = { ...targets, ...patch };
    setTargets(next);
    await supabase
      .from('targets')
      .upsert({ owner_id: userId, month: monthKey(), deals_target: next.deals_target || 0, meetings_target: next.meetings_target || 0 }, { onConflict: 'owner_id,month' });
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">جاري التحميل...</p>;

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <h2 className="font-display font-bold text-sm mb-1">أهداف {monthLabel}</h2>
      <p className="text-xs mb-4" style={{ color: C.muted }}>حدد هدفك الشهري وتابع تقدمك من لوحة التحكم</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span style={{ color: C.muted }}>هدف عدد الصفقات المغلقة</span>
          <input
            type="number"
            min="0"
            value={targets.deals_target || ''}
            onChange={(e) => save({ deals_target: Number(e.target.value) || 0 })}
            className={inputClass}
            style={inputStyle}
            placeholder="مثال: 3"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span style={{ color: C.muted }}>هدف عدد الاجتماعات</span>
          <input
            type="number"
            min="0"
            value={targets.meetings_target || ''}
            onChange={(e) => save({ meetings_target: Number(e.target.value) || 0 })}
            className={inputClass}
            style={inputStyle}
            placeholder="مثال: 10"
          />
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs mb-1.5" style={{ color: C.muted }}>الصفقات المغلقة</div>
          <ProgressBar value={dealsThisMonth} target={targets.deals_target || 0} color="#7FA887" />
        </div>
        <div>
          <div className="text-xs mb-1.5" style={{ color: C.muted }}>الاجتماعات</div>
          <ProgressBar value={meetingsThisMonth} target={targets.meetings_target || 0} color="#6E8CAE" />
        </div>
      </div>
    </div>
  );
}
