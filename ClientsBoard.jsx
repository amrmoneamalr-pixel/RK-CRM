import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';
import { C, STAGES, SOURCES, fmtMoney, fmtDate, todayStr, stageOf, stageIdFromInput } from './constants';
import { Plus, Search, Users, Download, Upload } from 'lucide-react';
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

export default function ClientsBoard({ userId, isAdmin }) {
  const [clients, setClients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [owners, setOwners] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [potentialFilter, setPotentialFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    let clientsQuery = supabase.from('clients').select('*').order('created_at', { ascending: false });
    let activitiesQuery = supabase.from('activities').select('*').order('date', { ascending: false });
    if (!isAdmin) {
      clientsQuery = clientsQuery.eq('owner_id', userId);
      activitiesQuery = activitiesQuery.eq('owner_id', userId);
    }
    const [{ data: c }, { data: a }] = await Promise.all([clientsQuery, activitiesQuery]);
    setClients(c || []);
    setActivities(a || []);
    if (isAdmin) {
      const { data: p } = await supabase.from('profiles').select('id, full_name');
      const map = {};
      (p || []).forEach((row) => { map[row.id] = row.full_name || '—'; });
      setOwners(map);
    }
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const exportCsv = () => {
    const rows = clients.map((c) => ({
      Name: c.name,
      Phone: c.phone || '',
      Stage: stageOf(c.stage).label,
      Project: c.project || '',
      Developer: c.developer || '',
      Location: c.location || '',
      Budget: c.budget || '',
      Source: c.source || '',
      Potential: c.potential ? 'Yes' : 'No',
      'Action': c.call_result || '',
      'Next Follow-up': c.next_follow_up || '',
      Comment: c.notes || '',
      Created: c.created_at ? c.created_at.slice(0, 10) : '',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rk-crm-clients-${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportMsg('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data
          .map((r) => ({
            owner_id: userId,
            name: (r.Name || r.name || '').toString().trim(),
            phone: r.Phone || r.phone || null,
            project: r.Project || r.project || null,
            developer: r.Developer || r.developer || null,
            location: r.Location || r.location || null,
            budget: (r.Budget || r.budget) ? Number(String(r.Budget || r.budget).replace(/[, ]/g, '')) || null : null,
            source: r.Source || r.source || null,
            stage: stageIdFromInput(r.Stage || r.stage),
            potential: ['yes', 'true', '1'].includes(String(r.Potential || r.potential || '').trim().toLowerCase()),
            call_result: r['Action'] || r.action || r['Call Result'] || r.call_result || null,
            next_follow_up: /^\d{4}-\d{2}-\d{2}$/.test(String(r['Next Follow-up'] || r.next_follow_up || '')) ? (r['Next Follow-up'] || r.next_follow_up) : null,
            notes: r.Comment || r.comment || r.Notes || r.notes || null,
          }))
          .filter((r) => r.name);

        if (rows.length === 0) {
          setImportMsg('No valid rows found (a "Name" column is required).');
          setImporting(false);
          return;
        }

        let insertedCount = 0;
        for (let i = 0; i < rows.length; i += 300) {
          const batch = rows.slice(i, i + 300);
          const { error } = await supabase.from('clients').insert(batch);
          if (error) {
            setImportMsg(`Error after importing ${insertedCount}: ${error.message}`);
            setImporting(false);
            load();
            return;
          }
          insertedCount += batch.length;
        }
        setImportMsg(`Imported ${insertedCount} client${insertedCount === 1 ? '' : 's'} successfully.`);
        setImporting(false);
        load();
      },
    });
    e.target.value = '';
  };

  if (clients.length === 0 && !showAdd) {
    return (
      <div className="text-center py-16">
        <Users size={32} className="mx-auto mb-3" style={{ color: C.muted }} />
        <p className="font-display font-bold mb-1">No clients yet</p>
        <p className="text-sm mb-4" style={{ color: C.muted }}>
          {isAdmin ? 'Tap "New Client" to start tracking your first one, or import a CSV file' : 'Tap "New Client" to start tracking your first one'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            + New Client
          </button>
          {isAdmin && (
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
              <Upload size={14} /> {importing ? 'Importing...' : 'Import CSV'}
            </button>
          )}
        </div>
        {isAdmin && importMsg && <p className="text-xs mt-3" style={{ color: importMsg.startsWith('Error') ? '#C9714F' : '#7FA887' }}>{importMsg}</p>}
        {isAdmin && <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportFile} className="hidden" />}
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
          <span className="flex-1" />
          {isAdmin && (
            <>
              <button onClick={exportCsv} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium shrink-0" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                <Download size={14} /> Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium shrink-0 disabled:opacity-50" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                <Upload size={14} /> {importing ? 'Importing...' : 'Import'}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportFile} className="hidden" />
            </>
          )}
        </div>
        {isAdmin && importMsg && <p className="text-xs" style={{ color: importMsg.startsWith('Error') ? '#C9714F' : '#7FA887' }}>{importMsg}</p>}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-x-auto" style={{ border: `1px solid ${C.border}` }}>
        <table className="text-sm" style={{ minWidth: isAdmin ? '1450px' : '1300px', width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: C.surface, color: C.muted }} className="text-left text-xs">
              <th className="py-2.5 px-3 font-medium">Name</th>
              {isAdmin && <th className="py-2.5 px-3 font-medium">Owner</th>}
              <th className="py-2.5 px-3 font-medium">Phone</th>
              <th className="py-2.5 px-3 font-medium">Stage</th>
              <th className="py-2.5 px-3 font-medium">Project</th>
              <th className="py-2.5 px-3 font-medium">Developer</th>
              <th className="py-2.5 px-3 font-medium">Location</th>
              <th className="py-2.5 px-3 font-medium">Source</th>
              <th className="py-2.5 px-3 font-medium">Potential</th>
              <th className="py-2.5 px-3 font-medium">Action</th>
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
                  {isAdmin && <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{owners[c.owner_id] || '—'}</td>}
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
