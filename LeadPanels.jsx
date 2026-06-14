import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDate, todayStr } from './constants';
import { Sparkles, Archive, PhoneCall, AlertTriangle, Snowflake, Phone } from 'lucide-react';

const COLD_RESULTS = ['No Answer', 'No Answer - Multiple Times', 'Call Again'];

export default function LeadPanels({ userId, isAdmin }) {
  const [groups, setGroups] = useState({ fresh: [], oldFresh: [], callbackToday: [], late: [], cold: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [userId, isAdmin]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('clients')
      .select('id, name, phone, stage, ever_contacted, created_at, next_follow_up, call_result')
      .order('created_at', { ascending: false });
    if (!isAdmin) q = q.eq('owner_id', userId);
    const { data } = await q;
    const clients = data || [];

    const today = todayStr();
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const fresh = [], oldFresh = [], callbackToday = [], late = [], cold = [];

    clients.forEach((c) => {
      if (c.stage === 'new' && !c.ever_contacted) {
        if (c.created_at >= sevenDaysAgoIso) fresh.push(c);
        else oldFresh.push(c);
      }
      if (c.next_follow_up) {
        if (c.next_follow_up === today) callbackToday.push(c);
        else if (c.next_follow_up < today) late.push(c);
      }
      if (COLD_RESULTS.includes(c.call_result)) cold.push(c);
    });

    callbackToday.sort((a, b) => (a.next_follow_up < b.next_follow_up ? -1 : 1));
    late.sort((a, b) => (a.next_follow_up < b.next_follow_up ? -1 : 1));

    setGroups({ fresh, oldFresh, callbackToday, late, cold });
    setLoading(false);
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l sticky top-0 h-screen overflow-y-auto p-4 space-y-4" style={{ borderColor: C.border }}>
      <Section title="Fresh Leads" icon={Sparkles} color="#7FA887" loading={loading} items={groups.fresh}
        subtitle={(c) => `Added ${fmtDate(c.created_at)}`} />
      <Section title="Call Back Today" icon={PhoneCall} color="#6E8CAE" loading={loading} items={groups.callbackToday}
        subtitle={(c) => `Due ${fmtDate(c.next_follow_up)}`} />
      <Section title="Late Leads" icon={AlertTriangle} color="#C9714F" loading={loading} items={groups.late}
        subtitle={(c) => `Was due ${fmtDate(c.next_follow_up)}`} />
      <Section title="Old Fresh Leads" icon={Archive} color="#9B7EBD" loading={loading} items={groups.oldFresh}
        subtitle={(c) => `Added ${fmtDate(c.created_at)}`} />
      <Section title="Cold Calls" icon={Snowflake} color="#8B93A3" loading={loading} items={groups.cold}
        subtitle={(c) => c.call_result} />
    </aside>
  );
}

function Section({ title, icon: Icon, color, loading, items, subtitle }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <Icon size={14} style={{ color }} /> {title}
        </div>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>{items.length}</span>
      </div>
      {loading ? (
        <p className="text-xs" style={{ color: C.muted }}>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-xs" style={{ color: C.muted }}>None right now</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {items.map((c) => (
            <div key={c.id} className="rounded-lg px-2 py-1.5" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium truncate">{c.name}</span>
                {c.phone && (
                  <a href={`tel:${c.phone}`} style={{ color: C.gold }}>
                    <Phone size={12} />
                  </a>
                )}
              </div>
              <p className="text-[11px] truncate" style={{ color: C.muted }}>{subtitle(c)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
