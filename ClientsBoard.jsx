import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, SOURCES, fmtMoney, fmtDate, todayStr, stageOf } from './constants';
import { Plus, Search, Users } from 'lucide-react';
import ClientModal from './ClientModal';

function Pill({ color, children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: `${color}22`, color }}>
      {children}
    </span>
  );
}

const selectStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const selectClass = 'rounded-lg px-2.5 py-2 text-xs outline-none';

export default function ClientsBoard({ userId }) {
  const [clients, setClients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [potentialFilter, setPotentialFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('clients').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('owner_id', userId).order('date', { ascending: false }),
    ]);
    setClients(c || []);
    setActivities(a || []);
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  if (clients.length === 0 && !showAdd) {
    return (
      <div className="text-center py-16">
        <Users size={32} className="mx-auto mb-3" style={{ color: C.muted }} />
        <p className="font-display font-bold mb-1">No clients yet</p>
        <p className="text-sm mb-4" style={{ color: C.muted }}>Tap "New Client" to start tracking your first one</p>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: C.gold, color: '#14181F' }}>
          + New Client
        </button>
        {showAdd && <ClientModal mode="add" userId={userId} onClose={() => setShowAdd(false)} onSaved={load} />}
      </div>
    );
  }

  // latest activity per client
  const lastActivity = {};
  activities.forEach((a) => {
    const current = lastActivity[a.client_id];
    if (!current || a.date > current.date) lastActivity[a.client_id] = a;
  });

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const haystack = [c.name, c.phone, c.project, c.developer, c.location].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    if (potentialFilter === 'yes' && !c.potential) return false;
    if (potentialFilter === 'no' && c.potential) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, project, developer, location..."
            className="rounded-lg pl-9 pr-3 py-2 text-sm outline-none w-full"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={selectClass} style={selectStyle}>
            <option value="all">All Stages</option>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectClass} style={selectStyle}>
            <option value="all">All Sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={potentialFilter} onChange={(e) => setPotentialFilter(e.target.value)} className={selectClass} style={selectStyle}>
            <option value="all">Potential: All</option>
            <option value="yes">Potential Only</option>
            <option value="no">Not Potential</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-x-auto" style={{ border: `1px solid ${C.border}` }}>
        <table className="text-sm" style={{ minWidth: '1300px', width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: C.surface, color: C.muted }} className="text-left text-xs">
              <th className="py-2.5 px-3 font-medium">Name</th>
              <th className="py-2.5 px-3 font-medium">Phone</th>
              <th className="py-2.5 px-3 font-medium">Stage</th>
              <th className="py-2.5 px-3 font-medium">Project</th>
              <th className="py-2.5 px-3 font-medium">Developer</th>
              <th className="py-2.5 px-3 font-medium">Location</th>
              <th className="py-2.5 px-3 font-medium">Source</th>
              <th className="py-2.5 px-3 font-medium">Potential</th>
              <th className="py-2.5 px-3 font-medium">Call Result</th>
              <th className="py-2.5 px-3 font-medium">Last Comment</th>
              <th className="py-2.5 px-3 font-medium">Last Comment Date</th>
              <th className="py-2.5 px-3 font-medium">Next Follow-up</th>
              <th className="py-2.5 px-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const stage = stageOf(c.stage);
              const last = lastActivity[c.id];
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer transition-colors"
                  style={{ borderTop: `1px solid ${C.border}` }}
                >
                  <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                    {c.name}
                    {c.previous_owners && c.previous_owners.length > 0 && (
                      <span className="ml-1.5 text-xs" style={{ color: '#9B7EBD' }} title="Rotated lead">🔄</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.phone || '—'}</td>
                  <td className="py-2.5 px-3"><Pill color={stage.color}>{stage.label}</Pill></td>
                  <td className="py-2.5 px-3 whitespace-nowrap">{c.project || '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.developer || '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.location || '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.source || '—'}</td>
                  <td className="py-2.5 px-3">
                    {c.potential ? <Pill color={C.gold}>Potential</Pill> : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.call_result || '—'}</td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate" style={{ color: C.muted }}>{last?.notes || '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{last ? fmtDate(last.date) : '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: c.next_follow_up && c.next_follow_up < todayStr() ? '#C9714F' : C.muted }}>
                    {c.next_follow_up ? fmtDate(c.next_follow_up) : '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{fmtDate(c.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: C.muted }}>No clients match these filters.</p>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-5 right-5 z-20 flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm shadow-lg"
        style={{ backgroundColor: C.gold, color: '#14181F' }}
      >
        <Plus size={18} /> New Client
      </button>

      {showAdd && <ClientModal mode="add" userId={userId} onClose={() => setShowAdd(false)} onSaved={load} />}
      {selected && <ClientModal mode="detail" userId={userId} client={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}
