import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { C, STAGES, SOURCES, ACTIVITY_TYPES, fmtMoney, fmtDate, todayStr, stageOf } from '../lib/constants';
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
    name: '', phone: '', project: 'Mountain View Creek View', budget: '', source: SOURCES[0], next_follow_up: '', notes: '',
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
      budget: form.budget ? Number(form.budget) : null,
      source: form.source,
      stage: 'new',
      notes: form.notes,
      next_follow_up: form.next_follow_up || null,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal title="عميل جديد" onClose={onClose}>
      <div className="space-y-3">
        <Field label="الاسم *">
          <input value={form.name} onChange={set('name')} className={inputClass} style={inputStyle} placeholder="اسم العميل" />
        </Field>
        <Field label="رقم التليفون">
          <input value={form.phone} onChange={set('phone')} className={inputClass} style={inputStyle} placeholder="01xxxxxxxxx" dir="ltr" />
        </Field>
        <Field label="المشروع المهتم به">
          <input value={form.project} onChange={set('project')} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="الميزانية التقريبية (ج.م)">
          <input type="number" value={form.budget} onChange={set('budget')} className={inputClass} style={inputStyle} dir="ltr" />
        </Field>
        <Field label="مصدر العميل">
          <select value={form.source} onChange={set('source')} className={inputClass} style={inputStyle}>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="تاريخ المتابعة القادمة">
          <input type="date" value={form.next_follow_up} onChange={set('next_follow_up')} className={inputClass} style={inputStyle} />
        </Field>
        <Field label="ملاحظات">
          <textarea value={form.notes} onChange={set('notes')} className={inputClass} style={inputStyle} rows={2} />
        </Field>
      </div>
      <button
        disabled={!form.name.trim() || saving}
        onClick={save}
        className="w-full mt-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-40"
        style={{ backgroundColor: C.gold, color: '#14181F' }}
      >
        {saving ? '...' : 'حفظ العميل'}
      </button>
    </Modal>
  );
}

function DetailView({ userId, client, onClose, onSaved }) {
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState(client.notes || '');
  const [nextFollowUp, setNextFollowUp] = useState(client.next_follow_up || '');
  const [stage, setStage] = useState(client.stage);
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
          {client.budget ? <Pill color="#6E8CAE">{fmtMoney(client.budget)} ج.م</Pill> : null}
          {client.source && <Pill color={C.muted}>{client.source}</Pill>}
        </div>

        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
            <Phone size={14} style={{ color: C.gold }} /> <span dir="ltr">{client.phone}</span>
          </a>
        )}

        <Field label="مرحلة العميل">
          <select value={stage} onChange={(e) => changeStage(e.target.value)} className={inputClass} style={inputStyle}>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>

        <Field label="تاريخ المتابعة القادمة">
          <div className="flex gap-2">
            <input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} className={inputClass} style={inputStyle} />
            {nextFollowUp !== (client.next_follow_up || '') && (
              <button onClick={saveNextFollowUp} className="px-3 py-2 rounded-lg text-sm font-bold shrink-0" style={{ backgroundColor: C.gold, color: '#14181F' }}>
                حفظ
              </button>
            )}
          </div>
        </Field>

        <Field label="ملاحظات">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} className={inputClass} style={inputStyle} rows={2} />
        </Field>

        <div>
          <h3 className="font-display font-bold text-sm mb-2">سجل المتابعات</h3>
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
              placeholder="ملاحظة عن المتابعة..."
              className={inputClass}
              style={{ ...inputStyle, backgroundColor: C.surface }}
            />
            <button onClick={addActivity} className="w-full py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: C.gold, color: '#14181F' }}>
              + إضافة متابعة
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: C.muted }}>مفيش متابعات مسجلة لسه</p>
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
              <Trash2 size={14} /> حذف العميل
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} style={{ color: '#C9714F' }} />
              <span style={{ color: C.muted }}>متأكد من الحذف؟</span>
              <button onClick={remove} className="font-bold" style={{ color: '#C9714F' }}>نعم، حذف</button>
              <button onClick={() => setConfirmDelete(false)} style={{ color: C.muted }}>إلغاء</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
