import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDateTime, LOCATIONS } from './constants';
import { Settings as SettingsIcon, RefreshCw, Check } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [error, setError] = useState('');

  // local editable copies
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('09:00');
  const [count, setCount] = useState(10);
  const [noAnswerEnabled, setNoAnswerEnabled] = useState(true);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings(data);
      setEnabled(data.rotation_enabled);
      setTime((data.rotation_time || '09:00').slice(0, 5));
      setCount(data.rotation_count || 10);
      setNoAnswerEnabled(data.no_answer_rotation_enabled ?? true);
      setLocations(data.rotation_locations || []);
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const { error } = await supabase
      .from('app_settings')
      .update({ rotation_enabled: enabled, rotation_time: time, rotation_count: count, no_answer_rotation_enabled: noAnswerEnabled, rotation_locations: locations, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  const runNow = async () => {
    setRunning(true);
    setRunMsg('');
    setError('');
    const { data, error } = await supabase.rpc('run_lead_rotation');
    setRunning(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRunMsg(`Rotated ${data} client${data === 1 ? '' : 's'} just now.`);
    load();
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const toggleLocation = (loc) => {
    setLocations((prev) => prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]);
  };

  const sameLocations = (a, b) => {
    const sa = [...a].sort().join(',');
    const sb = [...b].sort().join(',');
    return sa === sb;
  };

  const isDirty = !!settings && (
    enabled !== settings.rotation_enabled ||
    time !== (settings.rotation_time || '09:00').slice(0, 5) ||
    count !== settings.rotation_count ||
    noAnswerEnabled !== (settings.no_answer_rotation_enabled ?? true) ||
    !sameLocations(locations, settings.rotation_locations || [])
  );

  return (
    <div className="space-y-6">
      {/* Sticky save bar */}
      <div
        className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 flex items-center justify-between gap-3"
        style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}
      >
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <SettingsIcon size={18} style={{ color: C.gold }} /> Settings
        </h2>
        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          style={isDirty
            ? { backgroundColor: C.gold, color: '#14181F' }
            : { backgroundColor: C.surface, color: C.muted, border: `1px solid ${C.border}` }}
        >
          {saved ? <Check size={14} /> : null} {saving ? 'Saving...' : saved ? 'Saved' : isDirty ? 'Save changes' : 'Saved'}
        </button>
      </div>

      {error && <p className="text-xs" style={{ color: '#C9714F' }}>{error}</p>}

      <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-display font-bold text-sm">Automatic daily lead rotation</h3>
        <p className="text-xs" style={{ color: C.muted }}>
          Every day at the chosen time, the system picks stale leads (old fresh leads, late follow-ups, and otherwise
          untouched old clients) and hands a batch of them to the next sales rep in line — never the same rep twice
          for the same client until everyone has had a turn. Clients marked "Not Qualified" or "Not Interested" are
          skipped until that full round finishes, then they become eligible again.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>Enable automatic daily rotation</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span style={{ color: C.muted }}>Run time (daily)</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} style={inputStyle} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span style={{ color: C.muted }}>Clients per run</span>
            <input type="number" min="1" value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} className={inputClass} style={inputStyle} />
          </label>
        </div>

        <div>
          <p className="text-sm mb-1.5">Limit to locations</p>
          <p className="text-xs mb-2" style={{ color: C.muted }}>Pick one or more areas to rotate from. Leave all off to include every location.</p>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => {
              const on = locations.includes(loc);
              return (
                <button
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: on ? C.gold : C.bg,
                    color: on ? '#14181F' : C.muted,
                    border: `1px solid ${on ? C.gold : C.border}`,
                  }}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={runNow} disabled={running} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}>
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> {running ? 'Running...' : 'Run rotation now'}
          </button>
          {runMsg && <p className="text-xs mt-2" style={{ color: '#7FA887' }}>{runMsg}</p>}
        </div>

        {settings && (
          <div className="pt-2 text-xs space-y-1" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>
            <p>Current rotation cycle: #{settings.current_cycle}</p>
            {settings.last_run_at && (
              <p>Last run: {fmtDateTime(settings.last_run_at)} — {settings.last_run_count ?? 0} client{settings.last_run_count === 1 ? '' : 's'} moved</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-display font-bold text-sm">"No Answer" auto-rotation</h3>
        <p className="text-xs" style={{ color: C.muted }}>
          When a sales rep logs "No Answer" 3 times on the same client, the client is automatically moved to a random
          sales rep who hasn't had it before. Turn this off to keep such clients with the same rep.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={noAnswerEnabled} onChange={(e) => setNoAnswerEnabled(e.target.checked)} />
          <span>Move client to another rep after 3 "No Answer" results</span>
        </label>
      </div>
    </div>
  );
}
