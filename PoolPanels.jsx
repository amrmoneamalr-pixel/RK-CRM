import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import {
  Sparkles, Archive, BookOpen, Snowflake, RotateCw,
  PhoneOff, XCircle, AlertOctagon, ChevronRight
} from 'lucide-react';

// Display order + metadata (matches the 8 pool_key values in DB)
const POOL_META = [
  { key: 'newFresh',      label: 'Pool — New Fresh',      icon: Sparkles,      color: '#7FA887' },
  { key: 'oldFresh',      label: 'Pool — Old Fresh',      icon: Archive,       color: '#9B7EBD' },
  { key: 'oldCampaign',   label: 'Pool — Old Campaign',   icon: BookOpen,      color: '#7E6BAD' },
  { key: 'cold',          label: 'Pool — Cold',           icon: Snowflake,     color: '#8B93A3' },
  { key: 'reRotation',    label: 'Pool — Re-rotation',    icon: RotateCw,      color: '#E0A458' },
  { key: 'noAnswer',      label: 'Pool — No Answer',      icon: PhoneOff,      color: '#C9714F' },
  { key: 'notInterested', label: 'Pool — Not Interested', icon: XCircle,       color: '#D6453E' },
  { key: 'notQualified',  label: 'Pool — Not Qualified',  icon: AlertOctagon,  color: '#A03D38' },
];

export default function PoolPanels({ onSelectCategory }) {
  const [pools, setPools] = useState({}); // pool_key -> { id, count }
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    // 1) Load all pool profiles
    const { data: poolProfiles } = await supabase
      .from('profiles')
      .select('id, pool_key')
      .eq('is_pool', true);

    const map = {};
    (poolProfiles || []).forEach(p => { map[p.pool_key] = { id: p.id, count: 0 }; });

    // 2) Count leads per pool in parallel
    await Promise.all(Object.entries(map).map(async ([key, info]) => {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', info.id);
      map[key].count = count || 0;
    }));

    setPools(map);
    setLoading(false);
  };

  return (
    <div className="flex flex-col p-3 space-y-2">
      {POOL_META.map(({ key, label, icon: Icon, color }) => {
        const info = pools[key];
        const count = info?.count ?? 0;
        return (
          <button
            key={key}
            onClick={() => onSelectCategory && onSelectCategory('pool_' + key)}
            disabled={!info}
            className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-50"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center gap-2 text-sm font-medium min-w-0" style={{ color: C.text }}>
              <Icon size={14} style={{ color, flexShrink: 0 }} />
              <span className="truncate">{label}</span>
            </div>
            <span className="flex items-center gap-1 shrink-0 ml-2">
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {loading ? '—' : count}
              </span>
              <ChevronRight size={13} style={{ color: C.muted }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
