import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDateTime } from './constants';
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
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const { error } = await supabase
      .from('app_settings')
      .update({ rotation_enabled: enabled, rotation_time: time, rotation_count: count, updated_at: new Date().toISOString() })
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
          <SettingsIcon size={18} style={{ color: C.gold }} /> Settings
        </h2>
        <p className="text-sm" style={{ color: C.muted }}>Automatic lead rotation</p>
      </div>

      <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
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

        {error && <p className="text-xs" style={{ color: '#C9714F' }}>{error}</p>}

        <div className="flex flex-wrap gap-2">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            {saved ? <Check size={14} /> : null} {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
          <button onClick={runNow} disabled={running} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}>
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> {running ? 'Running...' : 'Run rotation now'}
          </button>
        </div>

        {runMsg && <p className="text-xs" style={{ color: '#7FA887' }}>{runMsg}</p>}

        {settings && (
          <div className="pt-2 text-xs space-y-1" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>
            <p>Current rotation cycle: #{settings.current_cycle}</p>
            {settings.last_run_at && (
              <p>Last run: {fmtDateTime(settings.last_run_at)} — {settings.last_run_count ?? 0} client{settings.last_run_count === 1 ? '' : 's'} moved</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
