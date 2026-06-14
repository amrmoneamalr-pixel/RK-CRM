import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Plus, Pencil, Trash2, Check, X, KeyRound, Eye, EyeOff } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

export default function TeamPage({ currentUserId }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('is_pool').order('full_name');
    setProfiles(data || []);
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Team Members</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold"
          style={{ backgroundColor: C.gold, color: '#14181F' }}
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      {error && <p className="text-xs" style={{ color: '#C9714F' }}>{error}</p>}

      <div className="space-y-2">
        {profiles.map((p) => (
          <UserRow key={p.id} profile={p} currentUserId={currentUserId} onChanged={load} setError={setError} />
        ))}
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSaved={load} setError={setError} />}
    </div>
  );
}

function RoleBadge({ role, isPool }) {
  if (isPool) return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${C.muted}22`, color: C.muted }}>Pool</span>;
  const color = role === 'admin' ? C.gold : '#6E8CAE';
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}22`, color }}>{role === 'admin' ? 'Admin' : 'Sales'}</span>;
}

function UserRow({ profile, currentUserId, onChanged, setError }) {
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [role, setRole] = useState(profile.role);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSelf = profile.id === currentUserId;

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, username: username.trim() || null, role })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      setError(error.message.includes('duplicate') ? 'Username already taken.' : error.message);
      return;
    }
    setEditing(false);
    onChanged();
  };

  const savePassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setError('');
    const { error } = await supabase.rpc('admin_reset_password', { p_id: profile.id, p_new_password: newPassword });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetting(false);
    setNewPassword('');
  };

  const remove = async () => {
    setSaving(true);
    setError('');
    const { error } = await supabase.rpc('admin_delete_user', { p_id: profile.id });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  };

  if (editing) {
    return (
      <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.gold}` }}>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputClass} style={inputStyle} />
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className={inputClass} style={inputStyle} autoCapitalize="none" autoCorrect="off" />
        {!profile.is_pool && (
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} style={inputStyle}>
            <option value="sales">Sales</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <div className="flex gap-2">
          <button onClick={saveEdit} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold disabled:opacity-50" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            <Check size={14} /> Save
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{profile.full_name || '—'}</span>
            <RoleBadge role={profile.role} isPool={profile.is_pool} />
            {isSelf && <span className="text-xs" style={{ color: C.muted }}>(You)</span>}
          </div>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>@{profile.username || '—'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setEditing(true)} title="Edit">
            <Pencil size={14} style={{ color: C.muted }} />
          </button>
          {!profile.is_pool && (
            <button onClick={() => setResetting((s) => !s)} title="Reset password">
              <KeyRound size={14} style={{ color: C.muted }} />
            </button>
          )}
          {!profile.is_pool && !isSelf && (
            !confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} title="Delete">
                <Trash2 size={14} style={{ color: '#C9714F' }} />
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs">
                <button onClick={remove} disabled={saving} className="font-bold" style={{ color: '#C9714F' }}>Delete?</button>
                <button onClick={() => setConfirmDelete(false)} style={{ color: C.muted }}>Cancel</button>
              </span>
            )
          )}
        </div>
      </div>

      {resetting && (
        <div className="flex gap-2 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="relative flex-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className={inputClass}
              style={{ ...inputStyle, paddingRight: '2.25rem' }}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: C.muted }} tabIndex={-1}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button onClick={savePassword} disabled={saving} className="px-3 py-2 rounded-lg text-sm font-bold shrink-0 disabled:opacity-50" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function AddUserModal({ onClose, onSaved, setError }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('sales');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const save = async () => {
    setLocalError('');
    if (!fullName.trim() || !username.trim() || password.length < 6) {
      setLocalError('Please fill in all fields. Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('admin_create_user', {
      p_username: username.trim(),
      p_full_name: fullName.trim(),
      p_password: password,
      p_role: role,
    });
    setSaving(false);
    if (error) {
      setLocalError(error.message.includes('Username already taken') ? 'Username already taken.' : error.message);
      return;
    }
    setError('');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: '#00000099' }}>
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base">Add User</h2>
          <button onClick={onClose}><X size={18} style={{ color: C.muted }} /></button>
        </div>
        <div className="space-y-3">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputClass} style={inputStyle} />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (for login)" className={inputClass} style={inputStyle} autoCapitalize="none" autoCorrect="off" />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputClass}
              style={{ ...inputStyle, paddingRight: '2.25rem' }}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: C.muted }} tabIndex={-1}>
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} style={inputStyle}>
            <option value="sales">Sales</option>
            <option value="admin">Admin</option>
          </select>
          {localError && <p className="text-xs" style={{ color: '#C9714F' }}>{localError}</p>}
          <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-lg font-bold text-sm disabled:opacity-50" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            {saving ? '...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
