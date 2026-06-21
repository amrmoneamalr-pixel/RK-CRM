import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, todayStr, COLD_RESULTS, LEAD_CATEGORY_LABELS } from './constants';
import { Sparkles, Archive, PhoneCall, AlertTriangle, Snowflake, ChevronRight, Users, UserCheck } from 'lucide-react';

export default function LeadPanels({ userId, isAdmin, onSelectCategory, mobileRow }) {
  const [counts, setCounts] = useState({ all: 0, newFresh: 0, contactedFresh: 0, callbackToday: 0, late: 0, oldFresh: 0, cold: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [userId, isAdmin]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('clients')
      .select('id, stage, stage_category, ever_contacted, created_at, next_follow_up, call_result, last_contacted_at');
    if (!isAdmin) q = q.eq('owner_id', userId);
    const { data } = await q;
    const clients = data || [];

    const today = todayStr();
    const next = { all: clients.length, newFresh: 0, contactedFresh: 0, callbackToday: 0, late: 0, oldFresh: 0, cold: 0 };

    clients.forEach((c) => {
      // New Fresh Leads: stage_category = New Fresh Lead + never contacted
      if (c.stage_category === 'New Fresh Lead' && !c.ever_contacted) next.newFresh++;

      // Contacted Fresh Leads: stage_category = New Fresh Lead + ever contacted
      if (c.stage_category === 'New Fresh Lead' && c.ever_contacted) next.contactedFresh++;

      // Call Back Today
      if (c.next_follow_up === today) next.callbackToday++;

      // Late Leads
      if (c.next_follow_up && c.next_follow_up < today) next.late++;

      // Old Fresh Leads: Old Fresh Lead OR Old Campaign
      if (c.stage_category === 'Old Fresh Lead' || c.stage_category === 'Old Campaign') next.oldFresh++;

      // Cold Calls: stage_category = Cold Calls
      if (c.stage_category === 'Cold Calls') next.cold++;
    });

    setCounts(next);
    setLoading(false);
  };

  const sections = [
    { key: 'all',            icon: Users,        color: C.gold,    label: 'All Leads' },
    { key: 'newFresh',       icon: Sparkles,     color: '#D6453E', label: 'New Fresh Leads' },
    { key: 'contactedFresh', icon: UserCheck,    color: '#7FA887', label: 'Contacted Fresh Leads' },
    { key: 'callbackToday',  icon: PhoneCall,    color: '#6E8CAE', label: 'Call Back Today' },
    { key: 'late',           icon: AlertTriangle,color: '#C9714F', label: 'Late Leads' },
    { key: 'oldFresh',       icon: Archive,      color: '#9B7EBD', label: 'Old Fresh Leads' },
    { key: 'cold',           icon: Snowflake,    color: '#8B93A3', label: 'Cold Calls' },
  ];

  if (mobileRow) {
    return (
      <>
        {sections.map(({ key, icon: Icon, color, label }) => (
          <button
            key={key}
            onClick={() => onSelectCategory && onSelectCategory(key)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <Icon size={13} style={{ color }} />
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: C.text }}>{label}</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
              {loading ? '—' : counts[key]}
            </span>
          </button>
        ))}
      </>
    );
  }

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
