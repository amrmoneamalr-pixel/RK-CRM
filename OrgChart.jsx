import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Plus, Pencil, Trash2, Check, X, Crown, Sparkles, Briefcase, Building2, Tag } from 'lucide-react';

// Icon shown next to each branch badge — cycles by index
const BRANCH_ICONS = [Sparkles, Briefcase, Building2, Tag];

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
    <div className="space-y-10 overflow-x-auto">
      {/* CSS tree lines */}
      <style>{`
        .rk-tree, .rk-tree ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .rk-tree > ul {
          padding-top: 0;
          display: flex;
          justify-content: center;
        }
        .rk-tree ul ul {
          padding-top: 26px;
          position: relative;
          display: flex;
          justify-content: center;
          gap: 14px;
        }
        .rk-tree li {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .rk-tree ul ul > li {
          padding: 26px 6px 0;
        }
        .rk-tree ul ul > li::before,
        .rk-tree ul ul > li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 1.5px solid ${treeLineColor};
          width: 50%;
          height: 26px;
        }
        .rk-tree ul ul > li::after {
          right: auto;
          left: 50%;
          border-left: 1.5px solid ${treeLineColor};
        }
        .rk-tree ul ul > li:only-child::after,
        .rk-tree ul ul > li:only-child::before {
          display: none;
        }
        .rk-tree ul ul > li:only-child {
          padding-top: 26px;
        }
        .rk-tree ul ul > li:only-child::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 1.5px solid ${treeLineColor};
          border-top: 0;
          width: 0;
          height: 26px;
          right: auto;
        }
        .rk-tree ul ul > li:first-child::before,
        .rk-tree ul ul > li:last-child::after {
          border: 0 none;
        }
        .rk-tree ul ul > li:last-child::before {
          border-right: 1.5px solid ${treeLineColor};
          border-radius: 0 6px 0 0;
        }
        .rk-tree ul ul > li:first-child::after {
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
      `}</style>

      {/* ─── Top Management ─── */}
      <section className="text-center">
        <BranchBadge label="Top Management" icon={Crown} />
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          {topManagement.map((n) => (
            <NodeCard key={n.id} node={n} isAdmin={isAdmin} users={users} onUpdate={updateNode} onDelete={deleteNode} accent />
          ))}
          {isAdmin && <AddCard onAdd={() => addNode(null, 0)} label="Add person" />}
        </div>
      </section>

      {/* ─── Each branch as its OWN vertical tree ─── */}
      {branches.map((branch, idx) => (
        <BranchSection
          key={branch.id}
          branch={branch}
          index={idx}
          childrenOf={childrenOf}
          isAdmin={isAdmin}
          users={users}
          onUpdate={updateNode}
          onDelete={deleteNode}
          onAdd={addNode}
        />
      ))}

      {/* Add branch button */}
      {isAdmin && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => addNode(null, 1)}
            className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg"
            style={{ color: C.gold, border: `1px dashed ${C.gold}`, backgroundColor: 'transparent' }}
          >
            <Plus size={12} /> Add another team / section
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Yellow pill badge (like TOP MANAGEMENT) ─────
function BranchBadge({ label, icon: Icon, editable, onEdit, onDelete }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
      style={{ backgroundColor: C.gold + '22', color: C.gold, border: `1.5px solid ${C.gold}` }}
    >
      {Icon && <Icon size={14} strokeWidth={2.5} />}
      <span className="font-display font-bold text-sm uppercase tracking-wider">
        {label}
      </span>
      {editable && (
        <div className="flex items-center gap-1.5 ml-1 pl-2" style={{ borderLeft: `1px solid ${C.gold}55` }}>
          <button onClick={onEdit} title="Edit label"><Pencil size={11} style={{ color: C.gold }} /></button>
          <button onClick={onDelete} title="Delete section"><Trash2 size={11} style={{ color: '#C9714F' }} /></button>
        </div>
      )}
    </div>
  );
}

// ─── One vertical branch section ─────
function BranchSection({ branch, index, childrenOf, isAdmin, users, onUpdate, onDelete, onAdd }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(branch.name);
  const children = childrenOf(branch.id);
  const Icon = BRANCH_ICONS[index % BRANCH_ICONS.length];

  const saveName = async () => {
    await onUpdate(branch.id, { name: name.trim() || 'Section' });
    setEditing(false);
  };

  const renderTreeNode = (node) => {
    const kids = childrenOf(node.id);
    const nextTier = (node.tier || 2) + 1;
    return (
      <li key={node.id}>
        <NodeCard
          node={node}
          isAdmin={isAdmin}
          users={users}
          onUpdate={onUpdate}
          onDelete={onDelete}
          small={node.tier >= 3}
        />
        {(kids.length > 0 || isAdmin) && (
          <ul>
            {kids.map(renderTreeNode)}
            {isAdmin && (
              <li>
                <AddCard onAdd={() => onAdd(node.id, nextTier)} label="Add" small={nextTier >= 3} />
              </li>
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section>
      <div className="rk-tree text-center">
        <ul>
          <li>
            {/* Yellow badge as root */}
            {editing ? (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full" style={{ backgroundColor: C.surface, border: `1.5px solid ${C.gold}` }}>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setName(branch.name); setEditing(false); } }}
                  className="text-sm font-bold outline-none px-1"
                  style={{ backgroundColor: 'transparent', color: C.gold, width: 200, textTransform: 'uppercase' }}
                />
                <button onClick={saveName}><Check size={13} style={{ color: C.gold }} /></button>
                <button onClick={() => { setName(branch.name); setEditing(false); }}><X size={13} style={{ color: C.muted }} /></button>
              </div>
            ) : (
              <>
                <BranchBadge
                  label={branch.name}
                  icon={Icon}
                  editable={isAdmin && !confirmDelete}
                  onEdit={() => setEditing(true)}
                  onDelete={() => setConfirmDelete(true)}
                />
                {confirmDelete && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs">
                    <span style={{ color: '#C9714F' }}>Delete section and everything under it?</span>
                    <button onClick={() => onDelete(branch.id)} className="px-2 py-0.5 rounded font-bold" style={{ backgroundColor: '#C9714F', color: '#fff' }}>Delete</button>
                    <button onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 rounded" style={{ color: C.muted, border: `1px solid ${C.border}` }}>Cancel</button>
                  </div>
                )}
              </>
            )}

            {/* Children tree below the badge */}
            {(children.length > 0 || isAdmin) && (
              <ul>
                {children.map(renderTreeNode)}
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
    </section>
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
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xs rounded px-2 py-1 outline-none" style={{ ...inputStyle, color: C.muted }} placeholder="Title / Role (e.g. HR, Team Leader)" />
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
