import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, SOURCES, LEAD_ORIGINS, TOP_MANAGEMENT_NAMES, ACTIONS, DEVELOPERS, LOCATIONS, fmtMoney, fmtDate, fmtTime, todayStr, stageOf, waLink } from './constants';

const stageCategoryToStage = (cat) => {
  switch (cat) {
    case 'Cold Calls': return 'contacted';
    case 'New Fresh Lead':
    case 'Old Fresh Lead':
    case 'Old Campaign':
    default: return 'new';
  }
};

const extractComment = (notes) => {
  if (!notes) return '';
  // Remove leading 'Action: X\n' line if present, return the rest
  const lines = notes.split('\n').filter(l => !l.startsWith('Action: ') && !l.startsWith('\u{1F4C5}') && !l.startsWith('\u2705'));
  return lines.join('\n').trim();
};
import { WhatsAppIcon, SourceTag } from './BrandIcons';
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

// Marketer names = profiles whose title is 'marketing'
function useMarketerNames(profilesList) {
  const fromList = (profilesList || [])
    .filter((p) => p.title === 'marketing' && !p.is_pool)
    .map((p) => p.full_name || p.username)
    .filter(Boolean);
  const [names, setNames] = useState(fromList);
  useEffect(() => {
    if (fromList.length > 0) { setNames(fromList); return; }
    (async () => {
      const { data } = await supabase.from('profiles').select('full_name, username, title, is_pool').eq('title', 'marketing');
      setNames((data || []).filter((p) => !p.is_pool).map((p) => p.full_name || p.username).filter(Boolean));
    })();
  }, [profilesList]);
  return names;
}

export default function ClientModal({ mode, userId, client, isAdmin, profilesList, autoFocusActivity, onClose, onSaved }) {
  if (mode === 'add') return <AddForm userId={userId} isAdmin={isAdmin} profilesList={profilesList} onClose={onClose} onSaved={onSaved} />;
  if (mode === 'edit') return <EditForm userId={userId} client={client} profilesList={profilesList} onClose={onClose} onSaved={onSaved} />;
  return <DetailView userId={userId} client={client} isAdmin={isAdmin} profilesList={profilesList} autoFocusActivity={autoFocusActivity} onClose={onClose} onSaved={onSaved} />;
}

// ---- Origin sub-form shared by Add + Edit ----
function OriginFields({ form, setForm, marketerNames }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <Field label="Lead Origin">
        <select value={form.lead_origin || ''} onChange={set('lead_origin')} className={inputClass} style={inputStyle}>
          <option value="">—</option>
          {LEAD_ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      {form.lead_origin === 'Marketing' && (
        <Field label="Marketer Name">
          <select value={form.origin_name || ''} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {marketerNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      )}
      {form.lead_origin === 'Top Management' && (
        <Field label="Top Management Member">
          <select value={form.origin_name || ''} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {TOP_MANAGEMENT_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      )}
    </>
  );
}

function AddForm({ userId, isAdmin, profilesList, onClose, onSaved }) {
  const marketerNames = useMarketerNames(profilesList);
  const [developers, setDevelopers] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    secondary_phone: '',
    developer: '',
    project: '',
    source: '',
    stage_category: '',
    lead_origin: '',
    origin_name: '',
    location: '',
    owner_id: '',
    potential: false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('developers').select('id, name').order('name');
      setDevelopers(data || []);
    })();
  }, []);

  useEffect(() => {
    if (!form.developer) { setProjectOptions([]); return; }
    (async () => {
      const dev = developers.find((d) => d.name === form.developer);
      if (!dev) { setProjectOptions([]); return; }
      const { data } = await supabase.from('developer_projects').select('id, name').eq('developer_id', dev.id).order('name');
      setProjectOptions(data || []);
    })();
  }, [form.developer, developers]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('clients').insert({
      owner_id: form.owner_id || userId,
      name: form.name,
      phone: form.phone || null,
      secondary_phone: form.secondary_phone || null,
      developer: form.developer || null,
      project: form.project || null,
      source: form.source || null,
      stage_category: form.stage_category || null,
      stage: stageCategoryToStage(form.stage_category),
      lead_origin: form.lead_origin || null,
      origin_name: form.lead_origin === 'Marketing' || form.lead_origin === 'Top Management' ? (form.origin_name || null) : null,
      location: form.location || null,
      potential: form.potential,
    });
    setSaving(false);
    if (error) { alert('Error: ' + error.message); return; }
    onSaved();
    onClose();
  };

  const required = form.name.trim().length > 0;

  return (
    <Modal title="New Lead" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full Name *">
          <input value={form.name} onChange={set('name')} className={inputClass} style={inputStyle} placeholder="Required" />
        </Field>
        <Field label="Mobile Number *">
          <input value={form.phone} onChange={set('phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
        </Field>
        <Field label="Secondary Number">
          <input value={form.secondary_phone} onChange={set('secondary_phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
        </Field>
        <Field label="Developer *">
          <select value={form.developer} onChange={(e) => setForm((f) => ({ ...f, developer: e.target.value, project: '' }))} className={inputClass} style={inputStyle}>
            <option value="">— Select Developer —</option>
            {developers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Project Name *">
          <select value={form.project} onChange={async (e) => { 
              const name = e.target.value; 
              const proj = projectOptions.find((p) => p.name === name); 
              if (proj && !proj.location) {
                const { data } = await supabase.from('developer_projects').select('location').eq('id', proj.id).single();
                proj.location = data?.location || null;
              }
              setForm((f) => ({ ...f, project: name, location: proj?.location || null })); 
            }} className={inputClass} style={inputStyle} disabled={!form.developer}>
            <option value="">— Select Project —</option>
            {projectOptions.map((p) => <option key={p.id} value={p.name}>{p.name}{p.location ? ` — ${p.location}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Lead Source *">
          <select value={form.source} onChange={set('source')} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Stage Category *">
          <select value={form.stage_category || ''} onChange={set('stage_category')} className={inputClass} style={inputStyle}>
            <option value="">— Select —</option>
            <option value="New Fresh Lead">New Fresh Lead</option>
            <option value="Old Fresh Lead">Old Fresh Lead</option>
            <option value="Cold Calls">Cold Calls</option>
            <option value="Old Campaign">Old Campaign</option>
          </select>
        </Field>
        <Field label="Lead Origin">
          <select value={form.lead_origin || ''} onChange={(e) => setForm((f) => ({ ...f, lead_origin: e.target.value, origin_name: '' }))} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {LEAD_ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        {form.lead_origin === 'Marketing' && (
          <Field label="Marketer Name">
            <select value={form.origin_name || ''} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
              <option value="">—</option>
              {marketerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        )}
        {form.lead_origin === 'Top Management' && (
          <Field label="Top Management Member">
            <select value={form.origin_name || ''} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
              <option value="">—</option>
              {TOP_MANAGEMENT_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        )}
        {isAdmin && profilesList && profilesList.length > 0 && (
          <Field label="Assigned To">
            <select value={form.owner_id} onChange={set('owner_id')} className={inputClass} style={inputStyle}>
              {profilesList.filter((p) => !p.is_pool).map((p) => (
                <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
              ))}
            </select>
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.potential} onChange={(e) => setForm((f) => ({ ...f, potential: e.target.checked }))} />
          <span style={{ color: C.muted }}>Mark as high-potential lead</span>
        </label>
      </div>
      <button
        disabled={!required || saving}
        onClick={save}
        className="w-full mt-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-40"
        style={{ backgroundColor: C.gold, color: '#14181F' }}
      >
        {saving ? '...' : 'Save Lead'}
      </button>
    </Modal>
  );
}


// ---- Admin-only full EDIT form (the pencil button) ----
function EditForm({ userId, client, profilesList, onClose, onSaved }) {
  const marketerNames = useMarketerNames(profilesList);
  const [developers, setDevelopers] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [form, setForm] = useState({
    name: client.name || '',
    phone: client.phone || '',
    developer: client.developer || '',
    project: client.project || '',
    source: client.source || '',
    stage_category: client.stage_category || '',
    lead_origin: client.lead_origin || '',
    origin_name: client.origin_name || '',
    location: client.location || '',
    owner_id: client.owner_id,
    potential: client.potential || false,
    secondary_phone: client.secondary_phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Load developers list
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('developers').select('id, name').order('name');
      setDevelopers(data || []);
    })();
  }, []);

  // Load projects when developer changes
  useEffect(() => {
    if (!form.developer) { setProjectOptions([]); return; }
    (async () => {
      const dev = developers.find((d) => d.name === form.developer);
      if (!dev) { setProjectOptions([]); return; }
      const { data } = await supabase.from('developer_projects').select('id, name').eq('developer_id', dev.id).order('name');
      setProjectOptions(data || []);
    })();
  }, [form.developer, developers]);

  const save = async () => {
    setSaving(true);
    const ownerChanged = form.owner_id !== client.owner_id;
    const patch = {
      name: form.name,
      phone: form.phone || null,
      secondary_phone: form.secondary_phone || null,
      developer: form.developer || null,
      project: form.project || null,
      source: form.source || null,
      stage_category: form.stage_category || null,
      stage: stageCategoryToStage(form.stage_category),
      lead_origin: form.lead_origin || null,
      origin_name: form.lead_origin === 'Marketing' || form.lead_origin === 'Top Management' ? (form.origin_name || null) : null,
      location: form.location || null,
      potential: form.potential,
      owner_id: form.owner_id,
    };
    if (ownerChanged) {
      patch.previous_owners = [...(client.previous_owners || []), client.owner_id];
      patch.no_answer_count = 0;
      patch.call_result = null;
    }
    await supabase.from('clients').update(patch).eq('id', client.id);
    setSaving(false);
    onSaved();
    onClose();
  };

  const remove = async () => {
    await supabase.from('clients').delete().eq('id', client.id);
    onSaved();
    onClose();
  };

  const required = form.name.trim().length > 0;

  return (
    <Modal title="Edit Lead" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full Name *">
          <input value={form.name} onChange={set('name')} className={inputClass} style={inputStyle} placeholder="Required" />
        </Field>
        <Field label="Mobile Number *">
          <input value={form.phone} onChange={set('phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
        </Field>
        <Field label="Secondary Number">
          <input value={form.secondary_phone} onChange={set('secondary_phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" />
        </Field>
        <Field label="Developer *">
          <select value={form.developer} onChange={(e) => { set('developer')(e); setForm((f) => ({ ...f, developer: e.target.value, project: '' })); }} className={inputClass} style={inputStyle}>
            <option value="">— Select Developer —</option>
            {developers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Project Name *">
          <select value={form.project} onChange={async (e) => { 
              const name = e.target.value; 
              const proj = projectOptions.find((p) => p.name === name); 
              if (proj && !proj.location) {
                const { data } = await supabase.from('developer_projects').select('location').eq('id', proj.id).single();
                proj.location = data?.location || null;
              }
              setForm((f) => ({ ...f, project: name, location: proj?.location || null })); 
            }} className={inputClass} style={inputStyle} disabled={!form.developer}>
            <option value="">— Select Project —</option>
            {projectOptions.map((p) => <option key={p.id} value={p.name}>{p.name}{p.location ? ` — ${p.location}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Lead Source *">
          <select value={form.source} onChange={set('source')} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Stage Category *">
          <select value={form.stage_category || ''} onChange={set('stage_category')} className={inputClass} style={inputStyle}>
            <option value="">— Select —</option>
            <option value="New Fresh Lead">New Fresh Lead</option>
            <option value="Old Fresh Lead">Old Fresh Lead</option>
            <option value="Cold Calls">Cold Calls</option>
            <option value="Old Campaign">Old Campaign</option>
          </select>
        </Field>
        <Field label="Lead Origin">
          <select value={form.lead_origin || ''} onChange={(e) => { set('lead_origin')(e); setForm((f) => ({ ...f, lead_origin: e.target.value, origin_name: '' })); }} className={inputClass} style={inputStyle}>
            <option value="">—</option>
            {LEAD_ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        {form.lead_origin === 'Marketing' && (
          <Field label="Marketer Name">
            <select value={form.origin_name || ''} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
              <option value="">—</option>
              {marketerNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        )}
        {form.lead_origin === 'Top Management' && (
          <Field label="Top Management Member">
            <select value={form.origin_name || ''} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
              <option value="">—</option>
              {TOP_MANAGEMENT_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
        )}
        {profilesList && profilesList.length > 0 && (
          <Field label="Assigned To">
            <select value={form.owner_id} onChange={set('owner_id')} className={inputClass} style={inputStyle}>
              {profilesList.filter((p) => !p.is_pool).map((p) => (
                <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
              ))}
            </select>
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.potential} onChange={(e) => setForm((f) => ({ ...f, potential: e.target.checked }))} />
          <span style={{ color: C.muted }}>Mark as high-potential lead</span>
        </label>
      </div>

      <button
        disabled={!required || saving}
        onClick={save}
        className="w-full mt-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-40"
        style={{ backgroundColor: C.gold, color: '#14181F' }}
      >
        {saving ? '...' : 'Save Changes'}
      </button>

      <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${C.border}` }}>
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
    </Modal>
  );
}


// ---- Read-only detail + Action/Comment (everyone, the comment button) ----
function DetailView({ userId, client, isAdmin, profilesList, autoFocusActivity, onClose, onSaved, onNext }) {
  const isOwner = client.owner_id === userId;
  const canComment = isOwner || isAdmin; // assigned rep or admin can add comments
  const [activities, setActivities] = useState([]);
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [callResult, setCallResult] = useState('');
  const [savedCallResult, setSavedCallResult] = useState('');
  const [noAnswerCount, setNoAnswerCount] = useState(client.no_answer_count || 0);
  const [previousOwners, setPreviousOwners] = useState(client.previous_owners || []);
  const [rotated, setRotated] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [plannedMeeting, setPlannedMeeting] = useState(false);
  const [actualMeeting, setActualMeeting] = useState(false);
  const [saving, setSaving] = useState(false);
  const activityRef = useRef(null);

  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  })();

  useEffect(() => { loadActivities(); }, []);

  useEffect(() => {
    if (autoFocusActivity && activityRef.current) {
      activityRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [autoFocusActivity]);

  const loadActivities = async () => {
    const { data } = await supabase.from('activities').select('*').eq('client_id', client.id).order('created_at', { ascending: false });
    setActivities((data || []).filter((a) => a.type !== 'system'));
  };

  const hasComment = commentText.trim().length > 0;
  const hasDate = nextFollowUp.length > 0;
  const hasAction = callResult.length > 0;
  const meetingNeedsComment = (plannedMeeting || actualMeeting) && !hasComment;
  const canSave = hasAction && hasComment && hasDate && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const patch = {};
    if (callResult !== savedCallResult) patch.call_result = callResult || null;
    if (nextFollowUp !== (client.next_follow_up || '')) patch.next_follow_up = nextFollowUp || null;
    patch.last_contacted_at = new Date().toISOString(); // push to bottom of list
    if (Object.keys(patch).length > 0) {
      await supabase.from('clients').update(patch).eq('id', client.id);
    }

    const hasMeeting = plannedMeeting || actualMeeting;
    const activityType = hasMeeting ? 'meeting' : 'call';
    const lines = [];
    if (callResult) lines.push('Action: ' + callResult);
    if (commentText.trim()) lines.push(commentText.trim());
    if (plannedMeeting) lines.push('📅 Planned Meeting – scheduled with client');
    if (actualMeeting) lines.push('✅ Actual Meeting – meeting happened today');
    const logText = lines.join('\n');

    if (logText) {
      await supabase.from('activities').insert({
        client_id: client.id,
        owner_id: userId,
        type: activityType,
        date: todayStr(),
        notes: logText,
      });
    }

    if (patch.call_result === 'No Answer') {
      const { data } = await supabase.from('clients').select('owner_id, no_answer_count, previous_owners').eq('id', client.id).maybeSingle();
      if (!data || data.owner_id !== client.owner_id) {
        setSaving(false);
        setRotated(true);
        onSaved();
        return;
      }
      setNoAnswerCount(data.no_answer_count || 0);
      setPreviousOwners(data.previous_owners || []);
    }

    setSavedCallResult(callResult);
    setSaving(false);
    setCallResult('');
    setSavedCallResult('');
    setCommentText('');
    setNextFollowUp('');
    setPlannedMeeting(false);
    setActualMeeting(false);
    onSaved();
    onClose();
  };

  const st = stageOf(client.stage);

  if (rotated) {
    return (
      <Modal title={client.name} onClose={() => { onSaved(); onClose(); }}>
        <div className="text-center py-8">
          <p className="font-display font-bold mb-2">Lead Rotated</p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>
            This lead had 3 consecutive "No Answer" results and has been automatically reassigned to another sales rep.
          </p>
          <button onClick={() => { onSaved(); onClose(); }} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            OK
          </button>
        </div>
      </Modal>
    );
  }

  const RO = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: C.muted }}>{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  );

  return (
    <Modal title={client.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Pill color={st.color}>{st.label}</Pill>
          {client.project && <Pill color={C.gold}>{client.project}</Pill>}
          {client.potential ? <Pill color={C.gold}>Potential</Pill> : null}
          {client.source && <Pill color={C.muted}><SourceTag source={client.source} size={14} /></Pill>}
          {previousOwners.length > 0 && <Pill color="#9B7EBD">Rotated ({previousOwners.length})</Pill>}
        </div>

        {client.phone && (
          <div className="flex items-center gap-2">
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm flex-1" style={{ color: C.text }}>
              <Phone size={14} style={{ color: C.gold }} /> <span>{client.phone}</span>
            </a>
            <a href={waLink(client.phone)} target="_blank" rel="noreferrer" className="shrink-0 flex items-center">
              <WhatsAppIcon size={26} />
            </a>
          </div>
        )}
        {client.secondary_phone && (
          <div className="flex items-center gap-2">
            <a href={`tel:${client.secondary_phone}`} className="flex items-center gap-2 text-sm flex-1" style={{ color: C.text }}>
              <Phone size={14} style={{ color: C.gold }} /> <span>{client.secondary_phone}</span>
            </a>
            <a href={waLink(client.secondary_phone)} target="_blank" rel="noreferrer" className="shrink-0 flex items-center">
              <WhatsAppIcon size={26} />
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 rounded-lg p-3" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
          <RO label="Developer" value={client.developer} />
          <RO label="Location" value={client.location} />
          <RO label="Lead Origin" value={client.lead_origin} />
          {client.origin_name && <RO label="From" value={client.origin_name} />}
          {client.budget ? <RO label="Budget" value={`${fmtMoney(client.budget)} EGP`} /> : null}
        </div>

        {/* ---- The save block — only for the assigned rep ---- */}
        {canComment ? (
        <div ref={activityRef} className="rounded-lg p-3 space-y-3" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
          <Field label="Action *">
            <select
              value={callResult}
              onChange={(e) => setCallResult(e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, backgroundColor: C.surface }}
            >
              <option value="">— Select —</option>
              {ACTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment about this lead..."
            className={inputClass}
            style={{ ...inputStyle, backgroundColor: C.surface }}
            rows={2}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" checked={plannedMeeting} onChange={(e) => setPlannedMeeting(e.target.checked)} className="w-4 h-4" />
              <span style={{ color: C.muted }}>📅 Planned Meeting – scheduled with client</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" checked={actualMeeting} onChange={(e) => setActualMeeting(e.target.checked)} className="w-4 h-4" />
              <span style={{ color: C.muted }}>✅ Actual Meeting – meeting happened today</span>
            </label>
            {meetingNeedsComment && (
              <p className="text-xs" style={{ color: '#C9714F' }}>A comment is required to log a meeting</p>
            )}
          </div>

          <Field label="Next Follow-up Date">
            <input type="date" value={nextFollowUp} min={todayStr()} max={maxDate} onChange={(e) => setNextFollowUp(e.target.value)} className={inputClass} style={{ ...inputStyle, backgroundColor: C.surface }} />
          </Field>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-40 transition-colors"
            style={{ backgroundColor: canSave ? C.gold : C.surface, color: canSave ? '#14181F' : C.muted, border: canSave ? 'none' : `1px solid ${C.border}` }}
          >
            {saving ? 'Saving...' : '+ Add Comment'}
          </button>
        </div>
        ) : (
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <p className="text-xs" style={{ color: C.muted }}>This lead is assigned to another rep. You can view comments but cannot add new ones.</p>
          </div>
        )}

        {noAnswerCount > 0 && (
          <p className="text-xs" style={{ color: noAnswerCount >= 3 ? '#C9714F' : C.muted }}>
            No-answer streak: {noAnswerCount}/3
          </p>
        )}

        {/* History */}
        {activities.length > 0 && (
          <div className="space-y-1.5">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 p-2 rounded-lg" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <span className="text-xs whitespace-pre-wrap" style={{ color: C.text }}>{a.notes}</span>
                <span className="text-[11px] shrink-0 ml-2" style={{ color: C.muted }}>
                  {fmtDate(a.date)}{a.created_at ? ` · ${fmtTime(a.created_at)}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
