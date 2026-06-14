import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, SOURCES, DEVELOPERS, LOCATIONS, CALL_RESULTS, ACTIVITY_TYPES, activityLabel, fmtMoney, fmtDate, fmtTime, todayStr, stageOf, waLink } from './constants';
import { X, Phone, Trash2, AlertCircle } from 'lucide-react';

function WhatsAppIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.1-.2-.1-.4.1-.6.2-.2.5-.5.6-.7.1-.2.1-.4 0-.5-.1-.2-.6-1.5-.8-2-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3 1 2.6 1.1 2.8.1.2 1.9 3 4.6 4.1 2.3.9 2.3.6 2.7.6.4 0 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.6-.3z"/>
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.6.9 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.2 1 1-3.1-.2-.3C3.5 14.9 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/>
    </svg>
  );
}

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

export default function ClientModal({ mode, userId, client, isAdmin, profilesList, onClose, onSaved }) {
  if (mode === 'add') return <AddForm userId={userId} isAdmin={isAdmin} profilesList={profilesList} onClose={onClose} onSaved={onSaved} />;
  return <DetailView userId={userId} client={client} isAdmin={isAdmin} profilesList={profilesList} onClose={onClose} onSaved={onSaved} />;
}

function AddForm({ userId, isAdmin, profilesList, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', project: 'Mountain View Creek View', developer: '', phone: '', secondary_phone: '',
    source: SOURCES[0], location: '', notes: '', owner_id: userId,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await supabase.from('clients').insert({
      owner_id: form.owner_id || userId,
      name: form.name,
      project: form.project,
      developer: form.developer || null,
      phone: form.phone || null,
      secondary_phone: form.secondary_phone || null,
      source: form.source,
      location: form.location || null,
      stage: 'new',
      notes: form.notes || null,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal title="New Lead" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full Name *">
          <input value={form.name} onChange={set('name')} className={inputClass} style={inputStyle} placeholder="Client name" />
        </Field>
        <Field label="Project Name">
          <input value={form.project} onChange={set('project')} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="Developer">
          <input value={form.developer} onChange={set('developer')} className={inputClass} style={inputStyle} list="developers-list" placeholder="e.g. Mountain View" />
          <datalist id="developers-list">
            {DEVELOPERS.map((d) => <option key={d} value={d} />)}
          </datalist>
        </Field>
        <Field label="Mobile Number">
          <input value={form.phone} onChange={set('phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
        </Field>
        <Field label="Secondary Number">
          <input value={form.secondary_phone} onChange={set('secondary_phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
        </Field>
        <Field label="Lead Source">
          <select value={form.source} onChange={set('source')} className={inputClass} style={inputStyle}>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="District">
          <input value={form.location} onChange={set('location')} className={inputClass} style={inputStyle} list="locations-list" placeholder="e.g. New Cairo" />
          <datalist id="locations-list">
            {LOCATIONS.map((l) => <option key={l} value={l} />)}
          </datalist>
        </Field>
        {isAdmin && profilesList && profilesList.length > 0 && (
          <Field label="Assign To">
            <select value={form.owner_id} onChange={set('owner_id')} className={inputClass} style={inputStyle}>
              {profilesList.map((p) => (
                <option key={p.id} value={p.id}>{p.is_pool ? 'Unassigned Pool' : (p.full_name || p.username || p.id)}</option>
              ))}
            </select>
          </Field>
        )}
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
        {saving ? '...' : 'Save Lead'}
      </button>
    </Modal>
  );
}

function DetailView({ userId, client, isAdmin, profilesList, onClose, onSaved }) {
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState(client.notes || '');
  const [ownerId, setOwnerId] = useState(client.owner_id);
  const [nextFollowUp, setNextFollowUp] = useState(client.next_follow_up || '');
  const [stage, setStage] = useState(client.stage);
  const [developer, setDeveloper] = useState(client.developer || '');
  const [location, setLocation] = useState(client.location || '');
  const [secondaryPhone, setSecondaryPhone] = useState(client.secondary_phone || '');
  const [potential, setPotential] = useState(client.potential || false);
  const [callResult, setCallResult] = useState(client.call_result || '');
  const [noAnswerCount, setNoAnswerCount] = useState(client.no_answer_count || 0);
  const [previousOwners, setPreviousOwners] = useState(client.previous_owners || []);
  const [rotated, setRotated] = useState(false);
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
  const saveSecondaryPhone = async () => update({ secondary_phone: secondaryPhone || null });
  const saveCallResult = async (val) => {
    setCallResult(val);
    await update({ call_result: val || null });
    const { data } = await supabase.from('clients').select('*').eq('id', client.id).maybeSingle();
    if (!data) {
      // ownership changed (rotated to another sales rep) - this client is no longer visible to us
      setRotated(true);
    } else {
      setNoAnswerCount(data.no_answer_count || 0);
      setPreviousOwners(data.previous_owners || []);
    }
  };
  const savePotential = async (val) => { setPotential(val); await update({ potential: val }); };

  const saveOwner = async (val) => {
    setOwnerId(val);
    await update({ owner_id: val, previous_owners: [...(previousOwners || []), client.owner_id], no_answer_count: 0, call_result: null });
  };

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

  if (rotated) {
    return (
      <Modal title={client.name} onClose={() => { onSaved(); onClose(); }}>
        <div className="text-center py-8">
          <p className="font-display font-bold mb-2">Lead Rotated</p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>
            This lead had 3 consecutive "No Answer" results and has been automatically reassigned to another sales rep.
          </p>
          <button
            onClick={() => { onSaved(); onClose(); }}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{ backgroundColor: C.gold, color: '#14181F' }}
          >
            OK
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={client.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Pill color={st.color}>{st.label}</Pill>
          {client.project && <Pill color={C.gold}>{client.project}</Pill>}
          {client.budget ? <Pill color="#6E8CAE">{fmtMoney(client.budget)} EGP</Pill> : null}
          {client.source && <Pill color={C.muted}>{client.source}</Pill>}
        </div>

        {isAdmin && profilesList && profilesList.length > 0 && (
          <Field label="Owner">
            <select value={ownerId} onChange={(e) => saveOwner(e.target.value)} className={inputClass} style={inputStyle}>
              {profilesList.map((p) => (
                <option key={p.id} value={p.id}>{p.is_pool ? 'Unassigned Pool' : (p.full_name || p.username || p.id)}</option>
              ))}
            </select>
          </Field>
        )}

        {client.phone && (
          <div className="flex items-center gap-2">
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm flex-1" style={{ color: C.text }}>
              <Phone size={14} style={{ color: C.gold }} /> <span>{client.phone}</span>
            </a>
            <a href={waLink(client.phone)} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-lg shrink-0 flex items-center" style={{ border: `1px solid ${C.border}`, color: '#25D366' }} title="Open WhatsApp chat">
              <WhatsAppIcon size={14} />
            </a>
          </div>
        )}

        <Field label="Secondary Number">
          <div className="flex gap-2">
            <input value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
            {secondaryPhone !== (client.secondary_phone || '') && (
              <button onClick={saveSecondaryPhone} className="px-2.5 py-2 rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: C.gold, color: '#14181F' }}>Save</button>
            )}
            {secondaryPhone && (
              <>
                <a href={`tel:${secondaryPhone}`} className="px-2.5 py-2 rounded-lg shrink-0 flex items-center" style={{ border: `1px solid ${C.border}`, color: C.gold }}>
                  <Phone size={14} />
                </a>
                <a href={waLink(secondaryPhone)} target="_blank" rel="noreferrer" className="px-2.5 py-2 rounded-lg shrink-0 flex items-center" style={{ border: `1px solid ${C.border}`, color: '#25D366' }} title="Open WhatsApp chat">
                  <WhatsAppIcon size={14} />
                </a>
              </>
            )}
          </div>
        </Field>

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

        <Field label="Last Action">
          <select value={callResult} onChange={(e) => saveCallResult(e.target.value)} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {CALL_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        {noAnswerCount > 0 && (
          <p className="text-xs" style={{ color: noAnswerCount >= 3 ? '#C9714F' : C.muted }}>
            No-answer streak: {noAnswerCount}/3 — after 3 in a row this lead auto-rotates to another sales rep.
          </p>
        )}

        {previousOwners.length > 0 && (
          <Pill color="#9B7EBD">Rotated lead ({previousOwners.length} previous {previousOwners.length === 1 ? 'rep' : 'reps'})</Pill>
        )}

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

        <Field label="Comment">
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
                const isSystem = a.type === 'system';
                return (
                  <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: isSystem ? 'transparent' : C.bg }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={isSystem ? { color: C.muted, fontWeight: 400, fontStyle: 'italic' } : undefined}>
                          {isSystem ? a.notes : activityLabel(a.type)}
                        </span>
                        <span className="text-[11px]" style={{ color: C.muted }}>
                          {fmtDate(a.date)}{isSystem && a.created_at ? ` · ${fmtTime(a.created_at)}` : ''}
                        </span>
                      </div>
                      {!isSystem && a.notes && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{a.notes}</p>}
                    </div>
                    {!isSystem && (
                      <button onClick={() => deleteActivity(a.id)} className="shrink-0">
                        <X size={12} style={{ color: C.muted }} />
                      </button>
                    )}
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
