import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, todayStr, COLD_RESULTS } from './constants';
import { Sparkles, Archive, PhoneCall, AlertTriangle, Snowflake, ChevronRight, Users, UserCheck, RotateCw, Flame } from 'lucide-react';

export default function LeadPanels({ userId, isAdmin, onSelectCategory, inSidebar }) {
  const [counts, setCounts] = useState({
    all: 0,
    newFresh: 0,
    contactedFresh: 0,
    callbackToday: 0,
    late: 0,
    reRotation: 0,
    contactedReRotation: 0,
    oldFresh: 0,
    contactedOldFresh: 0,
    cold: 0,
    contactedCold: 0,
    warmLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [userId, isAdmin]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('clients')
      .select('id, stage, stage_category, ever_contacted, created_at, next_follow_up, call_result, last_contacted_at, previous_owners, is_manual')
      .order('created_at', { ascending: false });
    if (!isAdmin) q = q.eq('owner_id', userId);
    const { data } = await q;
    const clients = data || [];
    const today = todayStr();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const next = {
      all: clients.length,
      newFresh: 0,
      contactedFresh: 0,
      callbackToday: 0,
      late: 0,
      reRotation: 0,
      contactedReRotation: 0,
      oldFresh: 0,
      contactedOldFresh: 0,
      cold: 0,
      contactedCold: 0,
      warmLeads: 0,
    };

    clients.forEach((c) => {
      // Re-rotation: has previous owners (manual leads bypass)
      const hasPrev = Array.isArray(c.previous_owners) && c.previous_owners.length > 0;
      if (hasPrev && !c.is_manual) {
        if (c.ever_contacted) next.contactedReRotation++;
        else next.reRotation++;
      }

      // Auto-recategorize: New Fresh older than 90 days → Old Fresh
      let cat = c.stage_category;
      if (cat === 'New Fresh Lead' && c.created_at < ninetyDaysAgo) cat = 'Old Fresh Lead';

      // New Fresh Lead bucket
      if (cat === 'New Fresh Lead' && !hasPrev) {
        if (c.ever_contacted) next.contactedFresh++;
        else next.newFresh++;
      }

      // Old Fresh / Old Campaign bucket
      if ((cat === 'Old Fresh Lead' || cat === 'Old Campaign') && !hasPrev) {
        if (c.ever_contacted) next.contactedOldFresh++;
        else next.oldFresh++;
      }

      // Cold Calls bucket
      if (cat === 'Cold Calls' && !hasPrev) {
        if (c.ever_contacted) next.contactedCold++;
        else next.cold++;
      }

      // Callback today / late
      if (c.next_follow_up === today) next.callbackToday++;
      if (c.next_follow_up && c.next_follow_up < today) next.late++;

      // Warm leads
      if (c.call_result === 'Interest in Resale' || c.call_result === 'Interest in Separate') {
        next.warmLeads++;
      }
    });

    setCounts(next);
    setLoading(false);
  };

  const sections = [
    { key: 'all',                 icon: Users,         color: C.gold,    label: 'All Leads' },
    { key: 'newFresh',            icon: Sparkles,      color: '#7FA887', label: 'New Fresh Leads' },
    { key: 'contactedFresh',      icon: UserCheck,     color: '#7FA887', label: 'Contacted New Fresh Leads' },
    { key: 'callbackToday',       icon: PhoneCall,     color: '#6E8CAE', label: 'Call Back Today' },
    { key: 'late',                icon: AlertTriangle, color: '#C9714F', label: 'Late Leads' },
    { key: 'reRotation',          icon: RotateCw,      color: '#E0A458', label: 'Re-rotation' },
    { key: 'contactedReRotation', icon: UserCheck,     color: '#E0A458', label: 'Contacted Re-rotation' },
    { key: 'oldFresh',            icon: Archive,       color: '#9B7EBD', label: 'Old Fresh Leads' },
    { key: 'contactedOldFresh',   icon: UserCheck,     color: '#9B7EBD', label: 'Contacted Old Fresh Leads' },
    { key: 'cold',                icon: Snowflake,     color: '#8B93A3', label: 'Cold Calls' },
    { key: 'contactedCold',       icon: PhoneCall,     color: '#8B93A3', label: 'Contacted Cold Calls' },
    { key: 'warmLeads',           icon: Flame,         color: '#F4B860', label: 'Warm Leads' },
  ];

  return (
    <div className={inSidebar ? "flex flex-col p-3 space-y-2" : "hidden lg:flex flex-col w-56 shrink-0 border-l sticky top-0 h-screen overflow-y-auto p-3 space-y-2"} style={inSidebar ? {} : { borderColor: C.border }}>
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
    </div>
  );
}
