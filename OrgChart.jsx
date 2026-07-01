import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Plus, Pencil, Trash2, Check, X, Crown, Sparkles, Briefcase, Building2 } from 'lucide-react';

// Fixed sections — labels are permanent, admin can only add/edit people under them
const SECTIONS = [
  { key: 'top_management', label: 'Top Management', icon: Crown,     flat: true  },
  { key: 'sales_manager',  label: 'Sales Team',     icon: Sparkles,  flat: false },
  { key: 'marketing_team', label: 'Marketing Team', icon: Briefcase, flat: false },
  { key: 'back_office',    label: 'Back Office',    icon: Building2, flat: false },
];

export default function OrgChart({ isAdmin }) {
  const [nodes, setNodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: n }, { data: u }] = await Promise.all([
      supabase.from('org_chart_nodes').select('*').order('sort_order'),
      supabase.from('profiles').select('id, full_name, username, title').eq('is_pool', false).order('full_name'),
    ]);
    setNodes(n || []);
    setUsers(u || []);
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const childrenOf = (parentId) => nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
  const rootsOfSection = (section) => nodes.filter((n) => n.section === section && !n.parent_id).sort((a, b) => a.sort_order - b.sort_order);

  // Add a new node.
  // If parentId is null → adds a top-level node in the passed `section`.
  // If parentId is set → adds a child; section is inherited from the parent.
  const addNode = async (parentId, section) => {
    const parentNode = parentId ? nodes.find((n) => n.id === parentId) : null;
    const finalSection = parentNode?.section || section;
    if (!finalSection) return;
    const siblings = parentId ? childrenOf(parentId) : rootsOfSection(finalSection);
    const maxSort = Math.max(0, ...siblings.map((n) => n.sort_order));
    const tier = parentNode ? (parentNode.tier || 0) + 1 : (finalSection === 'top_management' ? 0 : 2);
    await supabase.from('org_chart_nodes').insert({
      name: 'New',
      title: '',
      parent_id: parentId,
      tier,
      section: finalSection,
      sort_order: maxSort + 1,
    });
    load();
  };

  const updateNode = async (id, patch) => {
    await supabase.from('org_chart_nodes').update(patch).eq('id', id);
    load();
  };

  const deleteNode = async (id) => {
    // recursive delete: gather this + all descendants
    const gather = (nid, acc = []) => {
      const kids = nodes.filter((n) => n.parent_id === nid);
      kids.forEach((k) => { acc.push(k.id); gather(k.id, acc); });
      return acc;
    };
    const ids = [id, ...gather(id)];
    await supabase.from('org_chart_nodes').delete().in('id', ids);
    load();
  };

  const treeLineColor = C.border;

  // Recursive tree renderer
  const renderTreeNode = (node) => {
    const kids = childrenOf(node.id);
    const isDeep = (node.tier || 0) >= 3;
    return (
      <li key={node.id}>
        <NodeCard
          node={node}
          isAdmin={isAdmin}
          users={users}
          onUpdate={updateNode}
          onDelete={deleteNode}
          small={isDeep}
        />
        {(kids.length > 0 || isAdmin) && (
          <ul>
            {kids.map(renderTreeNode)}
            {isAdmin && (
              <li>
                <AddCard onAdd={() => addNode(node.id, null)} label="Add" small={isDeep} />
              </li>
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-10">
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

      {/* Render all 4 fixed sections */}
      {SECTIONS.map((sec) => {
        const rootNodes = rootsOfSection(sec.key);

        // Top Management: flat row (no tree)
        if (sec.flat) {
          return (
            <section key={sec.key} className="text-center">
              <BranchBadge label={sec.label} icon={sec.icon} />
              <div className="flex flex-wrap justify-center gap-3 mt-5">
                {rootNodes.map((n) => (
                  <NodeCard key={n.id} node={n} isAdmin={isAdmin} users={users} onUpdate={updateNode} onDelete={deleteNode} accent />
                ))}
                {isAdmin && <AddCard onAdd={() => addNode(null, sec.key)} label="Add person" />}
              </div>
            </section>
          );
        }

        // Other sections: yellow badge + tree (scrolls horizontally if wide)
        return (
          <section key={sec.key}>
            <div style={{ overflowX: 'auto', textAlign: 'center', width: '100%' }}>
              <div className="rk-tree" style={{ display: 'inline-block', minWidth: '100%', padding: '0 20px' }}>
                <ul>
                  <li>
                    <BranchBadge label={sec.label} icon={sec.icon} />
                    {(rootNodes.length > 0 || isAdmin) && (
                      <ul>
                        {rootNodes.map(renderTreeNode)}
                        {isAdmin && (
                          <li>
                            <AddCard onAdd={() => addNode(null, sec.key)} label="Add person" />
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Fixed yellow-pill section header (NOT editable) ─────
function BranchBadge({ label, icon: Icon }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
      style={{ backgroundColor: C.gold + '22', color: C.gold, border: `1.5px solid ${C.gold}` }}
    >
      {Icon && <Icon size={14} strokeWidth={2.5} />}
      <span className="font-display font-bold text-sm uppercase tracking-wider">
        {label}
      </span>
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
