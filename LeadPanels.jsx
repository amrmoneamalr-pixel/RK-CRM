import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDate, todayStr, COLD_RESULTS, LEAD_CATEGORY_LABELS } from './constants';
import { Sparkles, Archive, PhoneCall, AlertTriangle, Snowflake, ChevronRight } from 'lucide-react';

export default function LeadPanels({ userId, isAdmin, onSelectCategory }) {
  const [counts, setCounts] = useState({ fresh: 0, oldFresh: 0, callbackToday: 0, late: 0, cold: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [userId, isAdmin]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('clients')
      .select('id, stage, ever_contacted, created_at, next_follow_up, call_result, last_contacted_at')
      .order('created_at', { ascending: false });
    if (!isAdmin) q = q.eq('owner_id', userId);
    const { data } = await q;
    const clients = data || [];

    const today = todayStr();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const next = { fresh: 0, oldFresh: 0, callbackToday: 0, late: 0, cold: 0 };
    clients.forEach((c) => {
      if (c.stage === 'new' && !c.ever_contacted && c.created_at >= sevenDaysAgo) next.fresh++;
      if (c.stage === 'new' && !c.ever_contacted && c.created_at < sevenDaysAgo) next.oldFresh++;
      if (c.next_follow_up === today) next.callbackToday++;
      if (c.next_follow_up && c.next_follow_up < today) next.late++;
      // Cold calls: has a cold result AND hasn't had any action today (last_contacted_at not today)
      if (COLD_RESULTS.includes(c.call_result)) {
        const lastContacted = c.last_contacted_at ? c.last_contacted_at.slice(0, 10) : null;
        if (lastContacted !== today) next.cold++;
      }
    });

    setCounts(next);
    setLoading(false);
  };

  const sections = [
    { key: 'fresh',        icon: Sparkles,     color: '#7FA887', label: 'Fresh Leads' },
    { key: 'callbackToday',icon: PhoneCall,     color: '#6E8CAE', label: 'Call Back Today' },
    { key: 'late',         icon: AlertTriangle, color: '#C9714F', label: 'Late Leads' },
    { key: 'oldFresh',     icon: Archive,       color: '#9B7EBD', label: 'Old Fresh Leads' },
    { key: 'cold',         icon: Snowflake,     color: '#8B93A3', label: 'Cold Calls' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-l sticky top-0 h-screen overflow-y-auto p-3 space-y-2" style={{ borderColor: C.border }}>
      {sections.map(({ key, icon: Icon, color, label }) => (
        <button
          key={key}
          onClick={() => onSelectCategory && onSelectCategory(key)}
          className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-left transition-colors"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: C.text }}>
            <Icon size={14} style={{ color }} />
            {label}
          </div>
          <span className="flex items-center gap-1 shrink-0">
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {loading ? '—' : counts[key]}
            </span>
            <ChevronRight size={13} style={{ color: C.muted }} />
          </span>
        </button>
      ))}
    </aside>
  );
}
