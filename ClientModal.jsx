import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, SOURCES, DEVELOPERS, LOCATIONS, CALL_RESULTS, ACTIVITY_TYPES, fmtMoney, fmtDate, todayStr, stageOf } from './constants';
import { X, Phone, Trash2, AlertCircle } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: C.muted }}>{label}</span>
      {children}
    </label>
  );
}

function Pill({ color, children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${color}22`, color }}>
      {children}
    </span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: '#00000099' }}>
      <div
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base">{title}</h2>
          <button onClick={onClose}><X size={18} style={{ color: C.muted }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ClientModal({ mode, userId, client, onClose, onSaved }) {
  if (mode === 'add') return <AddForm userId={userId} onClose={onClose} onSaved={onSaved} />;
  return <DetailView userId={userId} client={client} onClose={onClose} onSaved={onSaved} />;
}

function AddForm({ userId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', phone: '', project: 'Mountain View Creek View', developer: '', location: '', budget: '',
    source: SOURCES[0], next_follow_up: '', notes: '', potential: false, call_result: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await supabase.from('clients').insert({
      owner_id: userId,
      name: form.name,
      phone: form.phone,
      project: form.project,
      developer: form.developer || null,
      location: form.location || null,
      budget: form.budget ? Number(form.budget) : null,
      source: form.source,
      stage: 'new',
      notes: form.notes,
      next_follow_up: form.next_follow_up || null,
      potential: form.potential,
      call_result: form.call_result || null,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal title="New Client" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name *">
          <input value={form.name} onChange={set('name')} className={inputClass} style={inputStyle} placeholder="Client name" />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={set('phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
        </Field>
        <Field label="Project">
          <input value={form.project} onChange={set('project')} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="Developer">
          <input value={form.developer} onChange={set('developer')} className={inputClass} style={inputStyle} list="developers-list" placeholder="e.g. Mountain View" />
          <datalist id="developers-list">
            {DEVELOPERS.map((d) => <option key={d} value={d} />)}
          </datalist>
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={set('location')} className={inputClass} style={inputStyle} list="locations-list" placeholder="e.g. New Cairo" />
          <datalist id="locations-list">
            {LOCATIONS.map((l) => <option key={l} value={l} />)}
          </datalist>
        </Field>
        <Field label="Approximate Budget (EGP)">
          <input type="number" value={form.budget} onChange={set('budget')} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="Lead Source">
          <select value={form.source} onChange={set('source')} className={inputClass} style={inputStyle}>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Last Call Result">
          <select value={form.call_result} onChange={set('call_result')} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {CALL_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.potential} onChange={(e) => setForm((f) => ({ ...f, potential: e.target.checked }))} />
          <span style={{ color: C.muted }}>Mark as high-potential lead</span>
        </label>
        <Field label="Next Follow-up Date">
          <input type="date" value={form.next_follow_up} onChange={set('next_follow_up')} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="Notes">
          <textarea value={form.notes} onChange={set('notes')} className={inputClass} style={inputStyle} rows={2} />
        </Field>
      </div>
      <button
        disabled={!form.name.trim() || saving}
        onClick={save}
        className="w-full mt-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-40"
        style={{ backgroundColor: C.gold, color: '#14181F' }}
      >
        {saving ? '...' : 'Save Client'}
      </button>
    </Modal>
  );
}

function DetailView({ userId, client, onClose, onSaved }) {
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState(client.notes || '');
  const [nextFollowUp, setNextFollowUp] = useState(client.next_follow_up || '');
  const [stage, setStage] = useState(client.stage);
  const [developer, setDeveloper] = useState(client.developer || '');
  const [location, setLocation] = useState(client.location || '');
  const [potential, setPotential] = useState(client.potential || false);
  const [callResult, setCallResult] = useState(client.call_result || '');
  const [activityForm, setActivityForm] = useState({ type: 'call', date: todayStr(), notes: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const { data } = await supabase.from('activities').select('*').eq('client_id', client.id).order('date', { ascending: false });
    setActivities(data || []);
  };

  const update = async (patch) => {
    await supabase.from('clients').update(patch).eq('id', client.id);
    onSaved();
  };

  const changeStage = async (val) => {
    setStage(val);
    const patch = { stage: val };
    if (val === 'won' && !client.closed_at) patch.closed_at = todayStr();
    await update(patch);
  };

  const saveNextFollowUp = async () => update({ next_follow_up: nextFollowUp || null });
  const saveNotes = async () => update({ notes });
  const saveDeveloper = async () => update({ developer: developer || null });
  const saveLocation = async () => update({ location: location || null });
  const saveCallResult = async (val) => { setCallResult(val); await update({ call_result: val || null }); };
  const savePotential = async (val) => { setPotential(val); await update({ potential: val }); };

  const addActivity = async () => {
    await supabase.from('activities').insert({ client_id: client.id, owner_id: userId, ...activityForm });
    setActivityForm({ type: 'call', date: todayStr(), notes: '' });
    loadActivities();
  };

  const deleteActivity = async (id) => {
    await supabase.from('activities').delete().eq('id', id);
    loadActivities();
  };

  const remove = async () => {
    await supabase.from('clients').delete().eq('id', client.id);
    onSaved();
    onClose();
  };

  const st = stageOf(stage);

  return (
    <Modal title={client.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Pill color={st.color}>{st.label}</Pill>
          {client.project && <Pill color={C.gold}>{client.project}</Pill>}
          {client.budget ? <Pill color="#6E8CAE">{fmtMoney(client.budget)} EGP</Pill> : null}
          {client.source && <Pill color={C.muted}>{client.source}</Pill>}
        </div>

        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
            <Phone size={14} style={{ color: C.gold }} /> <span>{client.phone}</span>
          </a>
        )}

        <Field label="Stage">
          <select value={stage} onChange={(e) => changeStage(e.target.value)} className={inputClass} style={inputStyle}>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Developer">
            <div className="flex gap-2">
              <input value={developer} onChange={(e) => setDeveloper(e.target.value)} className={inputClass} style={inputStyle} list="developers-list-d" />
              <datalist id="developers-list-d">
                {DEVELOPERS.map((d) => <option key={d} value={d} />)}
              </datalist>
              {developer !== (client.developer || '') && (
                <button onClick={saveDeveloper} className="px-2.5 py-2 rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: C.gold, color: '#14181F' }}>Save</button>
              )}
            </div>
          </Field>
          <Field label="Location">
            <div className="flex gap-2">
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} style={inputStyle} list="locations-list-d" />
              <datalist id="locations-list-d">
                {LOCATIONS.map((l) => <option key={l} value={l} />)}
              </datalist>
              {location !== (client.location || '') && (
                <button onClick={saveLocation} className="px-2.5 py-2 rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: C.gold, color: '#14181F' }}>Save</button>
              )}
            </div>
          </Field>
        </div>

        <Field label="Last Call Result">
          <select value={callResult} onChange={(e) => saveCallResult(e.target.value)} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {CALL_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={potential} onChange={(e) => savePotential(e.target.checked)} />
          <span style={{ color: C.muted }}>Mark as high-potential lead</span>
        </label>

        <Field label="Next Follow-up Date">
          <div className="flex gap-2">
            <input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} className={inputClass} style={inputStyle} />
            {nextFollowUp !== (client.next_follow_up || '') && (
              <button onClick={saveNextFollowUp} className="px-3 py-2 rounded-lg text-sm font-bold shrink-0" style={{ backgroundColor: C.gold, color: '#14181F' }}>
                Save
              </button>
            )}
          </div>
        </Field>

        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} className={inputClass} style={inputStyle} rows={2} />
        </Field>

        <div>
          <h3 className="font-display font-bold text-sm mb-2">Activity Log</h3>
          <div className="rounded-lg p-3 mb-3 space-y-2" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <div className="flex gap-2">
              <select
                value={activityForm.type}
                onChange={(e) => setActivityForm((f) => ({ ...f, type: e.target.value }))}
                className={inputClass}
                style={{ ...inputStyle, backgroundColor: C.surface }}
              >
                {ACTIVITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <input
                type="date"
                value={activityForm.date}
                onChange={(e) => setActivityForm((f) => ({ ...f, date: e.target.value }))}
                className={inputClass}
                style={{ ...inputStyle, backgroundColor: C.surface, maxWidth: '140px' }}
              />
            </div>
            <input
              value={activityForm.notes}
              onChange={(e) => setActivityForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Note about this follow-up..."
              className={inputClass}
              style={{ ...inputStyle, backgroundColor: C.surface }}
            />
            <button onClick={addActivity} className="w-full py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: C.gold, color: '#14181F' }}>
              + Add Follow-up
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: C.muted }}>No follow-ups logged yet</p>
          ) : (
            <div className="space-y-1.5">
              {activities.map((a) => {
                const type = ACTIVITY_TYPES.find((t) => t.id === a.type) || ACTIVITY_TYPES[0];
                return (
                  <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: C.bg }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{type.label}</span>
                        <span className="text-[11px]" style={{ color: C.muted }}>{fmtDate(a.date)}</span>
                      </div>
                      {a.notes && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{a.notes}</p>}
                    </div>
                    <button onClick={() => deleteActivity(a.id)} className="shrink-0">
                      <X size={12} style={{ color: C.muted }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm" style={{ color: '#C9714F' }}>
              <Trash2 size={14} /> Delete Client
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} style={{ color: '#C9714F' }} />
              <span style={{ color: C.muted }}>Are you sure?</span>
              <button onClick={remove} className="font-bold" style={{ color: '#C9714F' }}>Yes, delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{ color: C.muted }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
