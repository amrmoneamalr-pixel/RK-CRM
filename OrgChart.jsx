import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Plus, Pencil, Trash2, Check, X, Crown } from 'lucide-react';

export default function OrgChart({ isAdmin }) {
  const [nodes, setNodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: n }, { data: u }] = await Promise.all([
      supabase.from('org_chart_nodes').select('*').order('tier').order('sort_order'),
      supabase.from('profiles').select('id, full_name, username, title').eq('is_pool', false).order('full_name'),
    ]);
    setNodes(n || []);
    setUsers(u || []);
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const childrenOf = (parentId) => nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
  const topManagement = nodes.filter((n) => n.tier === 0 && !n.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const branches = nodes.filter((n) => n.tier === 1 && !n.parent_id).sort((a, b) => a.sort_order - b.sort_order);

  const addNode = async (parentId, tier) => {
    const siblings = parentId ? childrenOf(parentId) : nodes.filter((n) => n.tier === tier && !n.parent_id);
    const maxSort = Math.max(0, ...siblings.map((n) => n.sort_order));
    await supabase.from('org_chart_nodes').insert({ name: 'New', title: '', parent_id: parentId, tier, sort_order: maxSort + 1 });
    load();
  };

  const updateNode = async (id, patch) => {
    await supabase.from('org_chart_nodes').update(patch).eq('id', id);
    load();
  };

  const deleteNode = async (id) => {
    await supabase.from('org_chart_nodes').delete().eq('id', id);
    load();
  };

  const treeLineColor = C.border;

  return (
    <div className="space-y-6 overflow-x-auto">
      {/* CSS tree: lines connecting parent to children */}
      <style>{`
        .rk-tree, .rk-tree ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .rk-tree ul {
          padding-top: 26px;
          position: relative;
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        .rk-tree li {
          padding: 26px 6px 0;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .rk-tree li::before,
        .rk-tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 1.5px solid ${treeLineColor};
          width: 50%;
          height: 26px;
        }
        .rk-tree li::after {
          right: auto;
          left: 50%;
          border-left: 1.5px solid ${treeLineColor};
        }
        .rk-tree li:only-child::after,
        .rk-tree li:only-child::before {
          display: none;
        }
        .rk-tree li:only-child { padding-top: 26px; }
        .rk-tree li:first-child::before,
        .rk-tree li:last-child::after {
          border: 0 none;
        }
        .rk-tree li:last-child::before {
          border-right: 1.5px solid ${treeLineColor};
          border-radius: 0 6px 0 0;
        }
        .rk-tree li:first-child::after {
          border-radius: 6px 0 0 0;
        }
        .rk-tree ul ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 1.5px solid ${treeLineColor};
          width: 0;
          height: 26px;
        }
        .rk-tree > ul {
          padding-top: 0;
        }
        .rk-vline {
          width: 1.5px;
          background-color: ${treeLineColor};
          margin: 0 auto;
        }
        .rk-hline {
          height: 1.5px;
          background-color: ${treeLineColor};
        }
      `}</style>

      {/* ─── LEVEL 0: Top Management row ─── */}
      <section className="text-center">
        <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full" style={{ backgroundColor: C.gold + '22', color: C.gold }}>
          <Crown size={12} strokeWidth={2.5} />
          <span className="font-display font-bold text-xs uppercase tracking-wider">Top Management</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {topManagement.map((n) => (
            <NodeCard key={n.id} node={n} isAdmin={isAdmin} users={users} onUpdate={updateNode} onDelete={deleteNode} accent />
          ))}
          {isAdmin && <AddCard onAdd={() => addNode(null, 0)} label="Add person" />}
        </div>
      </section>

      {/* Connector: TM → branches */}
      {branches.length > 0 && (
        <div className="flex flex-col items-center" style={{ gap: 0 }}>
          <div className="rk-vline" style={{ height: 20 }} />
          <div className="rk-hline" style={{ width: `${Math.min(80, branches.length * 25)}%` }} />
        </div>
      )}

      {/* ─── LEVEL 1+: Branches as tree columns ─── */}
      <div
        className="grid gap-4 pb-4"
        style={{ gridTemplateColumns: `repeat(${branches.length || 1}, minmax(240px, 1fr))` }}
      >
        {branches.map((branch) => (
          <BranchTree
            key={branch.id}
            branch={branch}
            childrenOf={childrenOf}
            isAdmin={isAdmin}
            users={users}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onAdd={addNode}
          />
        ))}
      </div>

      {isAdmin && (
        <div className="flex justify-center">
          <button
            onClick={() => addNode(null, 1)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ color: C.muted, border: `1px dashed ${C.border}` }}
          >
            <Plus size={12} /> Add another team/branch
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Branch subtree: uses CSS tree pattern for connecting lines ────
function BranchTree({ branch, childrenOf, isAdmin, users, onUpdate, onDelete, onAdd }) {
  const children = childrenOf(branch.id); // tier 2 nodes

  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
    >
      {/* Small connector up from branch node to horizontal splitter */}
      <div className="rk-vline" style={{ height: 12, marginTop: -20, marginBottom: 4 }} />

      <div className="rk-tree">
        <ul>
          <li>
            <NodeCard node={branch} isAdmin={isAdmin} users={users} onUpdate={onUpdate} onDelete={onDelete} accent />
            {(children.length > 0 || isAdmin) && (
              <ul>
                {children.map((child) => {
                  const grandchildren = childrenOf(child.id); // tier 3
                  return (
                    <li key={child.id}>
                      <NodeCard node={child} isAdmin={isAdmin} users={users} onUpdate={onUpdate} onDelete={onDelete} />
                      {(grandchildren.length > 0 || isAdmin) && (
                        <ul>
                          {grandchildren.map((gc) => (
                            <li key={gc.id}>
                              <NodeCard node={gc} isAdmin={isAdmin} users={users} onUpdate={onUpdate} onDelete={onDelete} small />
                            </li>
                          ))}
                          {isAdmin && (
                            <li>
                              <AddCard small onAdd={() => onAdd(child.id, 3)} label="Add" />
                            </li>
                          )}
                        </ul>
                      )}
                    </li>
                  );
                })}
                {isAdmin && (
                  <li>
                    <AddCard onAdd={() => onAdd(branch.id, 2)} label="Add" />
                  </li>
                )}
              </ul>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

function NodeCard({ node, isAdmin, users, onUpdate, onDelete, accent, small }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const [title, setTitle] = useState(node.title || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const width = small ? '140px' : '170px';
  const inputStyle = { backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text };

  const selectUser = (userName) => {
    const u = (users || []).find((u) => (u.full_name || u.username) === userName);
    setName(userName);
    if (u) setTitle(u.title ? u.title.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
  };

  const save = async () => {
    await onUpdate(node.id, { name: name.trim() || 'New', title });
    setEditing(false);
  };

  if (editing) {
    const userNames = (users || []).map((u) => u.full_name || u.username).filter(Boolean);
    return (
      <div className="rounded-lg p-2.5 space-y-1.5 shrink-0" style={{ backgroundColor: C.bg, border: `1px solid ${C.gold}`, width }}>
        <select value={name} onChange={(e) => selectUser(e.target.value)} className="w-full text-sm rounded px-2 py-1 outline-none" style={inputStyle}>
          <option value="">— Select user —</option>
          {userNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xs rounded px-2 py-1 outline-none" style={{ ...inputStyle, color: C.muted }} placeholder="Title / Role" />
        <div className="flex gap-1">
          <button onClick={save} className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs font-bold" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            <Check size={12} /> Save
          </button>
          <button onClick={() => setEditing(false)} className="px-2 py-1 rounded" style={{ backgroundColor: C.surface, color: C.muted }}>
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-2.5 shrink-0 text-center"
      style={{ backgroundColor: C.bg, border: `1.5px solid ${accent ? C.gold : C.border}`, width }}
    >
      <div className="text-sm font-bold" style={{ color: C.text }}>{node.name}</div>
      {node.title && <div className="text-[11px]" style={{ color: C.muted }}>{node.title}</div>}
      {isAdmin && (
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <button onClick={() => setEditing(true)} title="Edit"><Pencil size={12} style={{ color: C.muted }} /></button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} title="Delete"><Trash2 size={12} style={{ color: '#C9714F' }} /></button>
          ) : (
            <>
              <button onClick={() => onDelete(node.id)} className="text-[10px] font-bold" style={{ color: '#C9714F' }}>Delete?</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[10px]" style={{ color: C.muted }}>Cancel</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddCard({ onAdd, label, small }) {
  const width = small ? '140px' : '170px';
  return (
    <button
      onClick={onAdd}
      className="rounded-lg flex items-center justify-center gap-1 text-xs font-medium py-2.5 shrink-0"
      style={{ border: `1px dashed ${C.border}`, color: C.muted, width, backgroundColor: 'transparent' }}
    >
      <Plus size={12} /> {label}
    </button>
  );
}
