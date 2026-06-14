import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDate, todayStr, waLink } from './constants';
import { Sparkles, Archive, PhoneCall, AlertTriangle, Snowflake, Phone } from 'lucide-react';

const COLD_RESULTS = ['No Answer', 'No Answer - Multiple Times', 'Call Again'];

function WhatsAppIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.1-.2-.1-.4.1-.6.2-.2.5-.5.6-.7.1-.2.1-.4 0-.5-.1-.2-.6-1.5-.8-2-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3 1 2.6 1.1 2.8.1.2 1.9 3 4.6 4.1 2.3.9 2.3.6 2.7.6.4 0 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.6-.3z"/>
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.6.9 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.2 1 1-3.1-.2-.3C3.5 14.9 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/>
    </svg>
  );
}

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
                  <span className="flex items-center gap-1.5 shrink-0">
                    <a href={`tel:${c.phone}`} style={{ color: C.gold }}>
                      <Phone size={12} />
                    </a>
                    <a href={waLink(c.phone)} target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>
                      <WhatsAppIcon size={12} />
                    </a>
                  </span>
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
