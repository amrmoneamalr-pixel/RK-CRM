import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Briefcase, Plus, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

export default function DevelopersBoard() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [newDevName, setNewDevName] = useState('');
  const [addingDev, setAddingDev] = useState(false);
  const [newProjectName, setNewProjectName] = useState({});
  const [confirmDeleteDev, setConfirmDeleteDev] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: devs } = await supabase.from('developers').select('*').order('name');
    const { data: projects } = await supabase.from('developer_projects').select('*').order('name');
    const list = (devs || []).map((d) => ({
      ...d,
      projects: (projects || []).filter((p) => p.developer_id === d.id),
    }));
    setDevelopers(list);
    setLoading(false);
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addDeveloper = async () => {
    const name = newDevName.trim();
    if (!name) return;
    setAddingDev(true);
    setError('');
    const { error } = await supabase.from('developers').insert({ name });
    setAddingDev(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewDevName('');
    load();
  };

  const removeDeveloper = async (id) => {
    setError('');
    const { error } = await supabase.from('developers').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    setConfirmDeleteDev(null);
    load();
  };

  const addProject = async (developerId) => {
    const name = (newProjectName[developerId] || '').trim();
    if (!name) return;
    setError('');
    const { error } = await supabase.from('developer_projects').insert({ developer_id: developerId, name });
    if (error) {
      setError(error.message);
      return;
    }
    setNewProjectName((prev) => ({ ...prev, [developerId]: '' }));
    load();
  };

  const removeProject = async (id) => {
    setError('');
    const { error } = await supabase.from('developer_projects').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-lg flex items-center gap-2">
        <Briefcase size={18} style={{ color: C.gold }} /> Developers
      </h2>

      {error && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: '#C9714F' }}>
          <AlertCircle size={13} /> {error}
        </p>
      )}

      {/* Add new developer */}
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-display font-bold text-sm">Add a developer</h3>
        <div className="flex gap-2">
          <input
            value={newDevName}
            onChange={(e) => setNewDevName(e.target.value)}
            placeholder="e.g. Mountain View"
            className={inputClass}
            style={inputStyle}
            onKeyDown={(e) => { if (e.key === 'Enter') addDeveloper(); }}
          />
          <button
            onClick={addDeveloper}
            disabled={!newDevName.trim() || addingDev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shrink-0 disabled:opacity-40"
            style={{ backgroundColor: C.gold, color: '#14181F' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Developers list */}
      <div className="space-y-3">
        {developers.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>No developers yet. Add one above.</p>
        ) : (
          developers.map((dev) => {
            const isOpen = !!expanded[dev.id];
            return (
              <div key={dev.id} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => toggleExpand(dev.id)} className="flex items-center gap-2 text-left flex-1">
                    {isOpen ? <ChevronDown size={16} style={{ color: C.muted }} /> : <ChevronRight size={16} style={{ color: C.muted }} />}
                    <span className="font-display font-bold text-sm">{dev.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${C.gold}22`, color: C.gold }}>
                      {dev.projects.length} project{dev.projects.length === 1 ? '' : 's'}
                    </span>
                  </button>
                  {confirmDeleteDev === dev.id ? (
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span style={{ color: C.muted }}>Delete + all its projects?</span>
                      <button onClick={() => removeDeveloper(dev.id)} className="font-bold" style={{ color: '#C9714F' }}>Yes</button>
                      <button onClick={() => setConfirmDeleteDev(null)} style={{ color: C.muted }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteDev(dev.id)} className="shrink-0" style={{ color: '#C9714F' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="space-y-2 pl-2" style={{ borderLeft: `2px solid ${C.border}` }}>
                    {dev.projects.length === 0 ? (
                      <p className="text-xs pl-2" style={{ color: C.muted }}>No projects yet.</p>
                    ) : (
                      dev.projects.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 pl-2 py-1">
                          <span className="text-sm">{p.name}</span>
                          <button onClick={() => removeProject(p.id)} style={{ color: C.muted }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                    <div className="flex gap-2 pl-2 pt-1">
                      <input
                        value={newProjectName[dev.id] || ''}
                        onChange={(e) => setNewProjectName((prev) => ({ ...prev, [dev.id]: e.target.value }))}
                        placeholder="e.g. Creek View"
                        className={inputClass}
                        style={inputStyle}
                        onKeyDown={(e) => { if (e.key === 'Enter') addProject(dev.id); }}
                      />
                      <button
                        onClick={() => addProject(dev.id)}
                        disabled={!(newProjectName[dev.id] || '').trim()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold shrink-0 disabled:opacity-40"
                        style={{ backgroundColor: C.gold, color: '#14181F' }}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
