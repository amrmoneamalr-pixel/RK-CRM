import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function OrgChart({ isAdmin }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('org_chart_nodes').select('*').order('tier').order('sort_order');
    setNodes(data || []);
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const childrenOf = (parentId) => nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
  const topManagement = nodes.filter((n) => n.tier === 0 && !n.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const branches = nodes.filter((n) => n.tier === 1 && !n.parent_id).sort((a, b) => a.sort_order - b.sort_order);

  const addNode = async (parentId, tier) => {
    const siblings = childrenOf(parentId);
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

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display font-bold text-sm mb-3" style={{ color: C.gold }}>Top Management</h2>
        <div className="flex flex-wrap gap-3">
          {topManagement.map((n) => (
            <NodeCard key={n.id} node={n} isAdmin={isAdmin} onUpdate={updateNode} onDelete={deleteNode} accent />
          ))}
          {isAdmin && <AddCard onAdd={() => addNode(null, 0)} label="Add person" />}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-6">
        {branches.map((branch) => (
          <BranchColumn key={branch.id} node={branch} childrenOf={childrenOf} isAdmin={isAdmin} onUpdate={updateNode} onDelete={deleteNode} onAdd={addNode} />
        ))}
      </section>

      {isAdmin && (
        <button
          onClick={() => addNode(null, 1)}
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: C.muted }}
        >
          <Plus size={14} /> Add another team/branch
        </button>
      )}
    </div>
  );
}

function BranchColumn({ node, childrenOf, isAdmin, onUpdate, onDelete, onAdd }) {
  const children = childrenOf(node.id);
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <NodeCard node={node} isAdmin={isAdmin} onUpdate={onUpdate} onDelete={onDelete} accent />
      <div className="mt-3 pl-4 space-y-3 border-l" style={{ borderColor: C.border }}>
        {children.map((child) => {
          const grandchildren = childrenOf(child.id);
          return (
            <div key={child.id}>
              <NodeCard node={child} isAdmin={isAdmin} onUpdate={onUpdate} onDelete={onDelete} />
              <div className="mt-2 pl-4 space-y-2 border-l" style={{ borderColor: C.border }}>
                {grandchildren.map((gc) => (
                  <NodeCard key={gc.id} node={gc} isAdmin={isAdmin} onUpdate={onUpdate} onDelete={onDelete} small />
                ))}
                {isAdmin && <AddCard small onAdd={() => onAdd(child.id, 3)} label="Add" />}
              </div>
            </div>
          );
        })}
        {isAdmin && <AddCard onAdd={() => onAdd(node.id, 2)} label="Add" />}
      </div>
    </div>
  );
}

function NodeCard({ node, isAdmin, onUpdate, onDelete, accent, small }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const [title, setTitle] = useState(node.title || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const width = small ? '140px' : '160px';
  const inputStyle = { backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text };

  const save = async () => {
    await onUpdate(node.id, { name: name.trim() || 'New', title });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg p-2.5 space-y-1.5" style={{ backgroundColor: C.bg, border: `1px solid ${C.gold}`, minWidth: width }}>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm rounded px-2 py-1 outline-none" style={inputStyle} placeholder="Name" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xs rounded px-2 py-1 outline-none" style={{ ...inputStyle, color: C.muted }} placeholder="Title" />
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
    <div className="rounded-lg p-2.5" style={{ backgroundColor: C.bg, border: `1px solid ${accent ? C.gold : C.border}`, minWidth: width }}>
      <div className="text-sm font-bold">{node.name}</div>
      {node.title && <div className="text-xs" style={{ color: C.muted }}>{node.title}</div>}
      {isAdmin && (
        <div className="flex items-center gap-2 mt-1.5">
          <button onClick={() => setEditing(true)}><Pencil size={12} style={{ color: C.muted }} /></button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}><Trash2 size={12} style={{ color: '#C9714F' }} /></button>
          ) : (
            <>
              <button onClick={() => onDelete(node.id)} className="text-xs font-bold" style={{ color: '#C9714F' }}>Delete?</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs" style={{ color: C.muted }}>Cancel</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddCard({ onAdd, label, small }) {
  const width = small ? '140px' : '160px';
  return (
    <button
      onClick={onAdd}
      className="rounded-lg flex items-center justify-center gap-1 text-xs font-medium py-2.5"
      style={{ border: `1px dashed ${C.border}`, color: C.muted, minWidth: width }}
    >
      <Plus size={12} /> {label}
    </button>
  );
}
