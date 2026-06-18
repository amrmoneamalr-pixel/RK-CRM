import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, LOCATIONS } from './constants';
import { ChevronRight, ChevronDown, Plus, Trash2, MapPin } from 'lucide-react';

export default function DevelopersBoard({ isAdmin }) {
  const [developers, setDevelopers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [newDevName, setNewDevName] = useState('');
  const [newProj, setNewProj] = useState({});   // { devId: { name, location } }

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: devs }, { data: projs }] = await Promise.all([
      supabase.from('developers').select('id, name').order('name'),
      supabase.from('developer_projects').select('id, developer_id, name, location').order('name'),
    ]);
    setDevelopers(devs || []);
    setProjects(projs || []);
    setLoading(false);
  };

  const addDeveloper = async () => {
    const name = newDevName.trim();
    if (!name) return;
    await supabase.from('developers').insert({ name });
    setNewDevName('');
    load();
  };

  const deleteDeveloper = async (id) => {
    await supabase.from('developers').delete().eq('id', id);
    load();
  };

  const addProject = async (devId) => {
    const p = newProj[devId] || {};
    if (!p.name?.trim() || !p.location) return;
    await supabase.from('developer_projects').insert({ developer_id: devId, name: p.name.trim(), location: p.location });
    setNewProj((prev) => ({ ...prev, [devId]: { name: '', location: '' } }));
    load();
  };

  const deleteProject = async (id) => {
    await supabase.from('developer_projects').delete().eq('id', id);
    load();
  };

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display font-bold text-lg">Developers & Projects</h2>

      {/* Add developer (admin only) */}
      {isAdmin && (
        <div className="flex gap-2">
          <input
            value={newDevName}
            onChange={(e) => setNewDevName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDeveloper()}
            placeholder="Add a developer..."
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          />
          <button
            onClick={addDeveloper}
            disabled={!newDevName.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40"
            style={{ backgroundColor: C.gold, color: '#14181F' }}
          >
            Add
          </button>
        </div>
      )}

      {/* Developer list */}
      <div className="space-y-2">
        {developers.map((dev) => {
          const devProjects = projects.filter((p) => p.developer_id === dev.id);
          const isOpen = expanded[dev.id];
          const np = newProj[dev.id] || { name: '', location: '' };

          return (
            <div key={dev.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {/* Developer header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                style={{ backgroundColor: C.surface }}
                onClick={() => toggle(dev.id)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown size={16} style={{ color: C.gold }} /> : <ChevronRight size={16} style={{ color: C.muted }} />}
                  <span className="font-bold text-sm">{dev.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.gold}22`, color: C.gold }}>
                    {devProjects.length} projects
                  </span>
                </div>
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); deleteDeveloper(dev.id); }} className="opacity-40 hover:opacity-100">
                    <Trash2 size={14} style={{ color: '#C9714F' }} />
                  </button>
                )}
              </div>

              {/* Projects */}
              {isOpen && (
                <div className="px-4 pb-3 pt-2 space-y-2" style={{ backgroundColor: C.bg }}>
                  {devProjects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: C.surface }}>
                      <div>
                        <span className="text-sm font-medium">{p.name}</span>
                        {p.location && (
                          <span className="ml-2 text-xs flex items-center gap-1 inline-flex" style={{ color: C.muted }}>
                            <MapPin size={11} /> {p.location}
                          </span>
                        )}
                      </div>
                      {isAdmin && (
                        <button onClick={() => deleteProject(p.id)} className="opacity-40 hover:opacity-100">
                          <Trash2 size={13} style={{ color: '#C9714F' }} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add project */}
                  {isAdmin && (
                    <div className="flex gap-2 pt-1">
                      <input
                        value={np.name}
                        onChange={(e) => setNewProj((prev) => ({ ...prev, [dev.id]: { ...np, name: e.target.value } }))}
                        placeholder="Project name..."
                        className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                      />
                      <select
                        value={np.location}
                        onChange={(e) => setNewProj((prev) => ({ ...prev, [dev.id]: { ...np, location: e.target.value } }))}
                        className="rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{ backgroundColor: C.surface, border: `1px solid ${np.location ? C.gold : C.border}`, color: np.location ? C.gold : C.muted }}
                      >
                        <option value="">Location *</option>
                        {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <button
                        onClick={() => addProject(dev.id)}
                        disabled={!np.name?.trim() || !np.location}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                        style={{ backgroundColor: C.gold, color: '#14181F' }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  )}
                  {isAdmin && (!np.name || !np.location) && np.name && (
                    <p className="text-xs" style={{ color: '#C9714F' }}>Location is required to add a project.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
