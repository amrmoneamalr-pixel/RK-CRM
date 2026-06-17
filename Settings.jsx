import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDateTime, LOCATIONS } from './constants';
import { Settings as SettingsIcon, RefreshCw, Check } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

function RepSelector({ label, desc, allReps, selected, onChange }) {
  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  const allSelected = allReps.length > 0 && allReps.every((r) => selected.includes(r.id));
  const toggleAll = () => onChange(allSelected ? [] : allReps.map((r) => r.id));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-xs" style={{ color: C.muted }}>{desc}</p>}
      <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
        <label className="flex items-center gap-2 text-xs cursor-pointer pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-3.5 h-3.5" />
          <span style={{ color: C.muted }}>الكل</span>
        </label>
        {allReps.length === 0 ? (
          <p className="text-xs" style={{ color: C.muted }}>مفيش sales reps.</p>
        ) : (
          allReps.map((rep) => {
            const on = selected.includes(rep.id);
            return (
              <label key={rep.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={on} onChange={() => toggle(rep.id)} className="w-4 h-4" />
                <span style={{ color: on ? C.text : C.muted }}>{rep.full_name || rep.username}</span>
              </label>
            );
          })
        )}
      </div>
      <p className="text-xs" style={{ color: C.muted }}>
        {selected.length === 0 ? 'كل السيلز داخلين' : `${selected.length} من ${allReps.length} مختارين`}
      </p>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [error, setError] = useState('');
  const [salesReps, setSalesReps] = useState([]);

  // editable copies
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('09:00');
  const [count, setCount] = useState(10);
  const [noAnswerEnabled, setNoAnswerEnabled] = useState(true);
  const [locations, setLocations] = useState([]);
  const [dailyReps, setDailyReps] = useState([]);
  const [noAnswerReps, setNoAnswerReps] = useState([]);

  useEffect(() => { load(); loadReps(); }, []);

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
      setDailyReps(data.daily_rotation_reps || []);
      setNoAnswerReps(data.no_answer_rotation_reps || []);
    }
    setLoading(false);
  };

  const loadReps = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('title', 'sales')
      .eq('is_pool', false)
      .order('full_name');
    setSalesReps(data || []);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const { error } = await supabase.from('app_settings').update({
      rotation_enabled: enabled,
      rotation_time: time,
      rotation_count: count,
      no_answer_rotation_enabled: noAnswerEnabled,
      rotation_locations: locations,
      daily_rotation_reps: dailyReps,
      no_answer_rotation_reps: noAnswerReps,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    if (error) { setError(error.message); return; }
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
    if (error) { setError(error.message); return; }
    setRunMsg(`Rotated ${data} client${data === 1 ? '' : 's'} just now.`);
    load();
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const toggleLocation = (loc) => setLocations((p) => p.includes(loc) ? p.filter((l) => l !== loc) : [...p, loc]);

  const sameArr = (a, b) => [...a].sort().join(',') === [...b].sort().join(',');
  const isDirty = !!settings && (
    enabled !== settings.rotation_enabled ||
    time !== (settings.rotation_time || '09:00').slice(0, 5) ||
    count !== settings.rotation_count ||
    noAnswerEnabled !== (settings.no_answer_rotation_enabled ?? true) ||
    !sameArr(locations, settings.rotation_locations || []) ||
    !sameArr(dailyReps, settings.daily_rotation_reps || []) ||
    !sameArr(noAnswerReps, settings.no_answer_rotation_reps || [])
  );

  return (
    <div className="space-y-6">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 flex items-center justify-between gap-3"
        style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <SettingsIcon size={18} style={{ color: C.gold }} /> Settings
        </h2>
        <button onClick={save} disabled={saving || !isDirty}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          style={isDirty ? { backgroundColor: C.gold, color: '#14181F' } : { backgroundColor: C.surface, color: C.muted, border: `1px solid ${C.border}` }}>
          {saved ? <Check size={14} /> : null} {saving ? 'Saving...' : saved ? 'Saved' : isDirty ? 'Save changes' : 'Saved'}
        </button>
      </div>

      {error && <p className="text-xs" style={{ color: '#C9714F' }}>{error}</p>}

      {/* Daily Rotation */}
      <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-display font-bold text-sm">Automatic daily lead rotation</h3>
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

        <RepSelector
          label="السيلز في الـ Daily Rotation"
          desc="اتركهم كلهم فاضيين = كل السيلز يدخلوا. اختار ناس معينة = بس دول."
          allReps={salesReps}
          selected={dailyReps}
          onChange={setDailyReps}
        />

        <div>
          <p className="text-sm mb-1.5">Limit to locations</p>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => {
              const on = locations.includes(loc);
              return (
                <button key={loc} onClick={() => toggleLocation(loc)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{ backgroundColor: on ? C.gold : C.bg, color: on ? '#14181F' : C.muted, border: `1px solid ${on ? C.gold : C.border}` }}>
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={runNow} disabled={running}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}>
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> {running ? 'Running...' : 'Run rotation now'}
          </button>
          {runMsg && <p className="text-xs mt-2" style={{ color: '#7FA887' }}>{runMsg}</p>}
        </div>

        {settings && (
          <div className="pt-2 text-xs space-y-1" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>
            <p>Current rotation cycle: #{settings.current_cycle}</p>
            {settings.last_run_at && <p>Last run: {fmtDateTime(settings.last_run_at)} — {settings.last_run_count ?? 0} clients moved</p>}
          </div>
        )}
      </div>

      {/* No Answer Rotation */}
      <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-display font-bold text-sm">"No Answer" auto-rotation</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={noAnswerEnabled} onChange={(e) => setNoAnswerEnabled(e.target.checked)} />
          <span>Move client after 3 "No Answer" results</span>
        </label>
        <RepSelector
          label="السيلز في الـ No Answer Rotation"
          desc="اتركهم كلهم فاضيين = كل السيلز. اختار ناس معينة = بس دول يستقبلوا الـ leads دي."
          allReps={salesReps}
          selected={noAnswerReps}
          onChange={setNoAnswerReps}
        />
      </div>
    </div>
  );
}
