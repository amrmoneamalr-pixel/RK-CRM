import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { C, SOURCES, LEAD_ORIGINS, LOCATIONS, ACTIONS, TOP_MANAGEMENT_NAMES } from './constants';
import { Upload, Download, X, Check, AlertCircle } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

// Remove country codes from phone numbers, keep local format
function cleanPhone(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/[\s\-\(\)\.]/g, '');
  // Remove + prefix
  if (d.startsWith('+')) d = d.slice(1);
  // Remove 00 prefix
  if (d.startsWith('00')) d = d.slice(2);
  // Handle 0 + country code format (e.g. 0201019739008 → 201019739008)
  // Only if starts with 0 and looks too long for a local number
  if (d.startsWith('0') && d.length > 11) d = d.slice(1);

  // Country code mappings: code → local prefix pattern
  const COUNTRY_STRIP = [
    { code: '20',  local: /^0[0-9]/ },   // Egypt: 20 + 01xxx → 01xxx
    { code: '966', local: /^0[5]/ },      // Saudi: 966 + 05xxx → 05xxx
    { code: '971', local: /^0[5]/ },      // UAE: 971 + 05xxx → 05xxx
    { code: '965', local: /^[569]/ },     // Kuwait
    { code: '974', local: /^[3567]/ },    // Qatar
    { code: '973', local: /^[36]/ },      // Bahrain
    { code: '968', local: /^[79]/ },      // Oman
    { code: '962', local: /^0[7]/ },      // Jordan
    { code: '961', local: /^0[37]/ },     // Lebanon
    { code: '964', local: /^0[7]/ },      // Iraq
    { code: '218', local: /^0[29]/ },     // Libya
    { code: '216', local: /^[2-9]/ },     // Tunisia
    { code: '213', local: /^0[5-7]/ },    // Algeria
    { code: '212', local: /^0[5-7]/ },    // Morocco
    { code: '249', local: /^0[19]/ },     // Sudan
    { code: '967', local: /^0[7]/ },      // Yemen
    { code: '90',  local: /^0[5]/ },      // Turkey
    { code: '44',  local: /^0[7]/ },      // UK
    { code: '49',  local: /^0[1]/ },      // Germany
    { code: '33',  local: /^0[6-7]/ },    // France
    { code: '1',   local: /^[2-9]\d{9}$/ },  // USA/Canada — exactly 10 digits
  ];

  for (const { code, local } of COUNTRY_STRIP) {
    if (d.startsWith(code)) {
      const remaining = d.slice(code.length);
      // Check if remaining looks like a valid local number
      if (local.test(remaining) && remaining.length >= 7) {
        return remaining;
      }
      // Some countries need 0 added back
      const withZero = '0' + remaining;
      if (local.test(withZero) && remaining.length >= 7) {
        return withZero;
      }
    }
  }

  return d;
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: C.muted }}>
        {label}{required && <span style={{ color: '#C9714F' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function ImportModal({ userId, onClose, onDone }) {
  const [developers, setDevelopers] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [marketerProfiles, setMarketerProfiles] = useState([]);
  const [tmProfiles, setTmProfiles] = useState([]);

  const [settings, setSettings] = useState({
    stage_category: '',
    lead_origin: '',
    origin_name: '',
    source: '',
    developer: '',
    project: '',
    location: '',
    assigned_to: '', // owner_id
  });
  const [profiles, setProfiles] = useState([]);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [{ data: devs }, { data: profs }] = await Promise.all([
        supabase.from('developers').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name, username, title, is_pool').eq('is_pool', false).order('full_name'),
      ]);
      setDevelopers(devs || []);
      setProfiles(profs || []);
      setMarketerProfiles((profs || []).filter(p => p.title === 'marketing'));
      setTmProfiles((profs || []).filter(p => p.title === 'top_management'));
    })();
  }, []);

  useEffect(() => {
    if (!settings.developer) { setProjectOptions([]); return; }
    (async () => {
      const dev = developers.find(d => d.name === settings.developer);
      if (!dev) { setProjectOptions([]); return; }
      const { data } = await supabase.from('developer_projects').select('id, name, location').eq('developer_id', dev.id).order('name');
      setProjectOptions(data || []);
    })();
  }, [settings.developer, developers]);

  const set = (k) => (e) => {
    const v = e.target.value;
    if (k === 'developer') {
      setSettings(s => ({ ...s, developer: v, project: '', location: '' }));
    } else if (k === 'project') {
      const proj = projectOptions.find(p => p.name === v);
      setSettings(s => ({ ...s, project: v, location: proj?.location || '' }));
    } else if (k === 'lead_origin') {
      setSettings(s => ({ ...s, lead_origin: v, origin_name: '' }));
    } else {
      setSettings(s => ({ ...s, [k]: v }));
    }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const ext = f.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      Papa.parse(f, {
        header: true, skipEmptyLines: true,
        complete: (r) => setPreview(r.data.slice(0, 3)),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setPreview(data.slice(0, 3));
      };
      reader.readAsBinaryString(f);
    }
  };

  const canImport = settings.stage_category && settings.source && settings.developer && settings.project && file;

  const doImport = async () => {
    if (!canImport) return;
    setImporting(true);
    setResult(null);

    // Parse full file
    let rows = [];
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      await new Promise(res => Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (r) => { rows = r.data; res(); },
      }));
    } else {
      await new Promise(res => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const wb = XLSX.read(ev.target.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          res();
        };
        reader.readAsBinaryString(file);
      });
    }

    const owner_id = settings.assigned_to || userId;
    const records = rows
      .map(r => {
        const rawPhone = r.Phone || r.phone || r['Mobile'] || r['Mobile Phone'] || r['رقم الموبايل'] || '';
        const rawSecondary = r['Secondary Phone'] || r.secondary_phone || r['الرقم الثاني'] || '';
        return {
          owner_id,
          name: (r.Name || r.name || r['الاسم'] || '').toString().trim(),
          phone: cleanPhone(rawPhone) || null,
          secondary_phone: cleanPhone(rawSecondary) || null,
          stage_category: settings.stage_category,
          stage: settings.stage_category === 'Cold Calls' ? 'contacted' : 'new',
          source: settings.source,
          lead_origin: settings.lead_origin || null,
          origin_name: settings.origin_name || null,
          developer: settings.developer,
          project: settings.project,
          location: settings.location || null,
          ever_contacted: false,
          potential: false,
        };
      })
      .filter(r => r.name);

    if (records.length === 0) {
      setResult({ error: 'No valid rows found. Make sure your file has a "Name" column.' });
      setImporting(false);
      return;
    }

    let inserted = 0;
    for (let i = 0; i < records.length; i += 300) {
      const { error } = await supabase.from('clients').insert(records.slice(i, i + 300));
      if (error) {
        setResult({ error: `Error after ${inserted} rows: ${error.message}` });
        setImporting(false);
        return;
      }
      inserted += Math.min(300, records.length - i);
    }

    setResult({ success: inserted });
    setImporting(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Phone', 'Secondary Phone'],
      ['Ahmed Mohamed', '01012345678', ''],
      ['Sara Ali', '0501234567', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'rk-import-template.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: '#00000088' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="font-display font-bold text-base">Import Leads</h2>
          <button onClick={onClose}><X size={18} style={{ color: C.muted }} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Template download */}
          <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full justify-center"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.gold }}>
            <Download size={13} /> Download Template (Name + Phone only)
          </button>

          {/* Required settings */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage Category" required>
              <select value={settings.stage_category} onChange={set('stage_category')} className={inputClass} style={inputStyle}>
                <option value="">— Select —</option>
                {['New Fresh Lead','Old Fresh Lead','Cold Calls','Old Campaign'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Lead Source" required>
              <select value={settings.source} onChange={set('source')} className={inputClass} style={inputStyle}>
                <option value="">— Select —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Developer" required>
              <select value={settings.developer} onChange={set('developer')} className={inputClass} style={inputStyle}>
                <option value="">— Select —</option>
                {developers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Project" required>
              <select value={settings.project} onChange={set('project')} className={inputClass} style={inputStyle} disabled={!settings.developer}>
                <option value="">— Select —</option>
                {projectOptions.map(p => <option key={p.id} value={p.name}>{p.name}{p.location ? ` — ${p.location}` : ''}</option>)}
              </select>
            </Field>
            <Field label="Lead Origin">
              <select value={settings.lead_origin} onChange={set('lead_origin')} className={inputClass} style={inputStyle}>
                <option value="">—</option>
                {LEAD_ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            {settings.lead_origin === 'Marketing' && (
              <Field label="Marketer">
                <select value={settings.origin_name} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
                  <option value="">—</option>
                  {marketerProfiles.map(p => <option key={p.id} value={p.full_name || p.username}>{p.full_name || p.username}</option>)}
                </select>
              </Field>
            )}
            {settings.lead_origin === 'Top Management' && (
              <Field label="TM Member">
                <select value={settings.origin_name} onChange={set('origin_name')} className={inputClass} style={inputStyle}>
                  <option value="">—</option>
                  {tmProfiles.map(p => <option key={p.id} value={p.full_name || p.username}>{p.full_name || p.username}</option>)}
                </select>
              </Field>
            )}
            <Field label="Assign To">
              <select value={settings.assigned_to} onChange={set('assigned_to')} className={inputClass} style={inputStyle}>
                <option value="">— My account —</option>
                {profiles.filter(p => !p.is_pool).map(p => <option key={p.id} value={p.id}>{p.full_name || p.username}</option>)}
              </select>
            </Field>
          </div>

          {settings.location && (
            <p className="text-xs" style={{ color: C.muted }}>📍 Location: <strong style={{ color: C.gold }}>{settings.location}</strong></p>
          )}

          {/* File upload */}
          <div
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 cursor-pointer"
            style={{ borderColor: file ? C.gold : C.border }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={22} style={{ color: file ? C.gold : C.muted }} />
            <p className="text-sm" style={{ color: file ? C.gold : C.muted }}>
              {file ? file.name : 'Click to upload CSV or Excel file'}
            </p>
            <p className="text-xs" style={{ color: C.muted }}>Columns: Name, Phone (optional: Secondary Phone)</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="rounded-lg overflow-hidden text-xs" style={{ border: `1px solid ${C.border}` }}>
              <p className="px-3 py-1.5 font-medium" style={{ backgroundColor: C.bg, color: C.muted }}>Preview (first 3 rows)</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={{ backgroundColor: C.bg }}>
                    {Object.keys(preview[0]).slice(0,4).map(k => <th key={k} className="px-3 py-1.5 text-left" style={{ color: C.muted }}>{k}</th>)}
                  </tr></thead>
                  <tbody>{preview.map((r,i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                      {Object.values(r).slice(0,4).map((v,j) => <td key={j} className="px-3 py-1.5" style={{ color: C.text }}>{String(v).slice(0,30)}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result?.success && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ backgroundColor: '#7FA88722', color: '#7FA887' }}>
              <Check size={14} /> Imported {result.success} leads successfully!
            </div>
          )}
          {result?.error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ backgroundColor: '#C9714F22', color: '#C9714F' }}>
              <AlertCircle size={14} /> {result.error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            {result?.success ? (
              <button onClick={onDone} className="flex-1 py-2.5 rounded-lg font-bold text-sm" style={{ backgroundColor: C.gold, color: '#14181F' }}>
                Done
              </button>
            ) : (
              <>
                <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
                  Cancel
                </button>
                <button
                  onClick={doImport}
                  disabled={!canImport || importing}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm disabled:opacity-40"
                  style={{ backgroundColor: C.gold, color: '#14181F' }}
                >
                  {importing ? 'Importing...' : `Import${file ? '' : ' (select file)'}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
