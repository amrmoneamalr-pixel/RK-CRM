import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, todayStr, LEAD_CATEGORY_LABELS } from './constants';
import { Sparkles, Archive, PhoneCall, AlertTriangle, Snowflake, ChevronRight, Users, UserCheck, RefreshCw, PhoneMissed } from 'lucide-react';

export default function LeadPanels({ userId, isAdmin, onSelectCategory, mobileRow }) {
  const [counts, setCounts] = useState({
    all: 0,
    newFresh: 0, contactedFresh: 0,
    callbackToday: 0, late: 0,
    reRotation: 0, contactedReRotation: 0,
    oldFresh: 0, contactedOldFresh: 0,
    cold: 0, contactedCold: 0,
    warmLeads: 0, potential: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [userId, isAdmin]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('clients')
      .select('id, stage_category, ever_contacted, next_follow_up, previous_owners, potential, call_result');
    if (!isAdmin) q = q.eq('owner_id', userId);
    const { data } = await q;
    const clients = data || [];

    const today = todayStr();
    const next = {
      all: clients.length,
      newFresh: 0, contactedFresh: 0,
      callbackToday: 0, late: 0,
      reRotation: 0, contactedReRotation: 0,
      oldFresh: 0, contactedOldFresh: 0,
      cold: 0, contactedCold: 0,
      warmLeads: 0, potential: 0,
    };

    clients.forEach((c) => {
      const cat = c.stage_category;
      const contacted = c.ever_contacted;
      const hasRotation = c.previous_owners && Array.isArray(c.previous_owners) && c.previous_owners.length > 0;
      const isLate = c.next_follow_up && c.next_follow_up < today;
      const isCallbackToday = c.next_follow_up === today;

      if (isCallbackToday) next.callbackToday++;
      if (isLate) { next.late++; return; } // late clients excluded from all other tabs

      if (cat === 'New Fresh Lead' && !contacted)  next.newFresh++;
      if (cat === 'New Fresh Lead' && contacted)   next.contactedFresh++;
      if (hasRotation && !contacted)  next.reRotation++;
      if (hasRotation && contacted)   next.contactedReRotation++;
      if ((cat === 'Old Fresh Lead' || cat === 'Old Campaign') && !contacted) next.oldFresh++;
      if ((cat === 'Old Fresh Lead' || cat === 'Old Campaign') && contacted)  next.contactedOldFresh++;
      if (cat === 'Cold Calls' && !contacted)      next.cold++;
      if (cat === 'Cold Calls' && contacted)       next.contactedCold++;
      if (['Interest in Resale', 'Interest in Separate'].includes(c.call_result)) next.warmLeads++;
      if (c.potential)                             next.potential++;
    });

    setCounts(next);
    setLoading(false);
  };

  const sections = [
    { key: 'all',              icon: Users,        color: C.gold,    label: 'All Leads' },
    { key: 'newFresh',         icon: Sparkles,     color: '#D6453E', label: 'New Fresh Leads' },
    { key: 'contactedFresh',   icon: UserCheck,    color: '#7FA887', label: 'Contacted New Fresh Leads' },
    { key: 'callbackToday',    icon: PhoneCall,    color: '#6E8CAE', label: 'Call Back Today' },
    { key: 'late',             icon: AlertTriangle,color: '#C9714F', label: 'Late Leads' },
    { key: 'reRotation',       icon: RefreshCw,    color: '#D4A24E', label: 'Re-rotation' },
    { key: 'contactedReRotation', icon: UserCheck, color: '#E8A838', label: 'Contacted Re-rotation' },
    { key: 'oldFresh',         icon: Archive,      color: '#9B7EBD', label: 'Old Fresh Leads' },
    { key: 'contactedOldFresh',icon: UserCheck,    color: '#7B68EE', label: 'Contacted Old Fresh Leads' },
    { key: 'cold',             icon: Snowflake,    color: '#8B93A3', label: 'Cold Calls' },
    { key: 'contactedCold',    icon: PhoneMissed,  color: '#5F9EA0', label: 'Contacted Cold Calls' },
    { key: 'warmLeads',        icon: Sparkles,     color: '#f59e0b', label: 'Warm Leads' },
    { key: 'potential',        icon: Sparkles,     color: C.gold,    label: 'Potential Clients' },
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
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
              {loading ? '—' : counts[key]}
            </span>
            <ChevronRight size={13} style={{ color: C.muted }} />
          </span>
        </button>
      ))}
    </aside>
  );
}
