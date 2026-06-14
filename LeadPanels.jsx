import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDate } from './constants';
import { Sparkles, Phone } from 'lucide-react';

export default function LeadPanels({ userId, isAdmin }) {
  const [freshLeads, setFreshLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [userId, isAdmin]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('clients')
      .select('id, name, phone, created_at')
      .eq('stage', 'new')
      .eq('ever_contacted', false)
      .order('created_at', { ascending: false });
    if (!isAdmin) q = q.eq('owner_id', userId);
    const { data } = await q;
    setFreshLeads(data || []);
    setLoading(false);
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l sticky top-0 h-screen overflow-y-auto p-4 space-y-4" style={{ borderColor: C.border }}>
      <Section title="Fresh Leads" icon={Sparkles} color="#7FA887" loading={loading} items={freshLeads} />
    </aside>
  );
}

function Section({ title, icon: Icon, color, loading, items }) {
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
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
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
              <p className="text-[11px]" style={{ color: C.muted }}>{fmtDate(c.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
