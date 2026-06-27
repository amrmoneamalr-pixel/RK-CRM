import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, TITLES, titleLabel } from './constants';
import { Plus, Pencil, Trash2, Check, X, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

const TITLE_ORDER = ['top_management','sales_manager','team_leader','sales','marketing','operation'];

const TITLE_COLORS = {
  top_management: C.gold,
  operation: '#C9714F',
  sales_manager: '#6E8CAE',
  team_leader: '#7FA887',
  marketing: '#9B7EBD',
  sales: '#8B93A3',
};

export default function TeamPage({ currentUserId, currentUserTitle }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'pools' | 'credentials'

  const isTopManagement = currentUserTitle === 'top_management';
  const isOperation = currentUserTitle === 'operation';
  const showCredentialsTab = isTopManagement || isOperation;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('is_pool').order('full_name');
    setProfiles((data || []).sort((a, b) => (TITLE_ORDER.indexOf(a.title) - TITLE_ORDER.indexOf(b.title)) || (a.full_name || '').localeCompare(b.full_name || '')));
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  // Members tab — exclude pools entirely + apply visibility rules
  const visibleProfiles = profiles.filter((p) =>
    !p.is_pool && (
      currentUserTitle === 'top_management' || p.id === currentUserId || !['operation', 'marketing'].includes(p.title)
    )
  );

  // Pools tab — only pools, ordered by pool_key (matches the order in PoolPanels)
  const POOL_KEY_ORDER = ['newFresh','oldFresh','oldCampaign','cold','reRotation','noAnswer','notInterested','notQualified'];
  const poolsList = profiles
    .filter((p) => p.is_pool)
    .sort((a, b) => (POOL_KEY_ORDER.indexOf(a.pool_key) - POOL_KEY_ORDER.indexOf(b.pool_key)));

  const teamLeaders = profiles.filter((p) => p.title === 'team_leader' && !p.is_pool);

  const tabs = [
    { id: 'members', label: 'Users', count: visibleProfiles.length },
    { id: 'pools',   label: 'Pools', count: poolsList.length },
    ...(showCredentialsTab ? [{ id: 'credentials', label: 'Credentials' }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-lg">
            {activeTab === 'pools' ? 'Pools' : activeTab === 'credentials' ? 'Credentials' : 'Users'}
          </h2>
          {activeTab !== 'credentials' && (
            <span className="text-sm px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${C.gold}22`, color: C.gold }}>
              {activeTab === 'pools' ? poolsList.length : visibleProfiles.length}
            </span>
          )}
        </div>
        {activeTab === 'members' && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: C.gold, color: '#14181F' }}
          >
            <Plus size={14} /> Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize"
            style={{
              backgroundColor: activeTab === tab.id ? C.gold : C.surface,
              color: activeTab === tab.id ? '#14181F' : C.muted,
              border: `1px solid ${activeTab === tab.id ? C.gold : C.border}`,
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-xs" style={{ color: '#C9714F' }}>{error}</p>}

      {activeTab === 'members' && (
        <div className="space-y-2">
          {visibleProfiles.map((p) => (
            <UserRow key={p.id} profile={p} currentUserId={currentUserId} teamLeaders={teamLeaders} onChanged={load} setError={setError} />
          ))}
        </div>
      )}

      {activeTab === 'pools' && (
        <>
          <div className="rounded-lg px-3 py-2 mb-1 text-xs flex items-center gap-2"
            style={{ backgroundColor: '#5BE0EF11', border: `1px solid #5BE0EF44`, color: '#5BE0EF' }}>
            <Lock size={12} />
            <span>System pools — read-only. Changes can only be made via SQL.</span>
          </div>
          <div className="space-y-2">
            {poolsList.map((p) => (
              <PoolRow key={p.id} profile={p} />
            ))}
            {poolsList.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: C.muted }}>No pools configured.</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'credentials' && showCredentialsTab && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: C.surface, color: C.muted }} className="text-left text-xs">
                <th className="py-2.5 px-4 font-medium">Full Name</th>
                <th className="py-2.5 px-4 font-medium">Username</th>
                <th className="py-2.5 px-4 font-medium">Role</th>
                {isTopManagement && <th className="py-2.5 px-4 font-medium">Password</th>}
              </tr>
            </thead>
            <tbody>
              {(isTopManagement ? visibleProfiles : visibleProfiles.filter((p) => p.title !== 'top_management')).map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="py-2.5 px-4 font-medium">{p.full_name || '—'}</td>
                  <td className="py-2.5 px-4" style={{ color: C.gold }}>@{p.username || '—'}</td>
                  <td className="py-2.5 px-4 text-xs capitalize" style={{ color: C.muted }}>{(p.title || '').replace(/_/g, ' ')}</td>
                  {isTopManagement && (
                    <td className="py-2.5 px-4" style={{ color: C.muted }}>
                      {p.plain_password ? (
                        <span className="font-mono text-xs">{p.plain_password}</span>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddUserModal teamLeaders={teamLeaders} onClose={() => setShowAdd(false)} onSaved={load} setError={setError} />}
    </div>
  );
}

function TitleBadge({ title, isPool }) {
  if (isPool) return <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#5BE0EF22', color: '#5BE0EF' }}>Pool</span>;
  const color = TITLE_COLORS[title] || C.muted;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}22`, color }}>{titleLabel(title)}</span>;
}

// Read-only row for a system pool. No edit/delete/reset actions.
function PoolRow({ profile }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={{ color: '#5BE0EF' }}>{profile.full_name || profile.username || '—'}</span>
            <TitleBadge isPool />
          </div>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>
            pool_key: <span className="font-mono">{profile.pool_key || '—'}</span>
          </p>
        </div>
        <Lock size={14} style={{ color: C.muted, flexShrink: 0 }} />
      </div>
    </div>
  );
}

function UserRow({ profile, currentUserId, teamLeaders, onChanged, setError }) {
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [title, setTitle] = useState(profile.title || 'sales');
  const [teamLeaderId, setTeamLeaderId] = useState(profile.team_leader_id || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSelf = profile.id === currentUserId;

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    const role = ['top_management', 'operation'].includes(title) ? 'admin' : 'sales';
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        title,
        role,
        team_leader_id: title === 'sales' ? (teamLeaderId || null) : null,
      })
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
    if (!error) {
      await supabase.from('profiles').update({ plain_password: newPassword }).eq('id', profile.id);
    }
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
        <select value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle}>
          {TITLES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        {title === 'sales' && teamLeaders.length > 0 && (
          <select value={teamLeaderId} onChange={(e) => setTeamLeaderId(e.target.value)} className={inputClass} style={inputStyle}>
            <option value="">No team leader</option>
            {teamLeaders.map((tl) => <option key={tl.id} value={tl.id}>{tl.full_name || tl.username}</option>)}
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

  const leaderName = profile.team_leader_id ? (teamLeaders.find((tl) => tl.id === profile.team_leader_id)?.full_name || teamLeaders.find((tl) => tl.id === profile.team_leader_id)?.username) : null;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{profile.full_name || '—'}</span>
            <TitleBadge title={profile.title} />
            {isSelf && <span className="text-xs" style={{ color: C.muted }}>(You)</span>}
          </div>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>
            @{profile.username || '—'}{leaderName ? ` · Team: ${leaderName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setEditing(true)} title="Edit">
            <Pencil size={14} style={{ color: C.muted }} />
          </button>
          <button onClick={() => setResetting((s) => !s)} title="Reset password">
            <KeyRound size={14} style={{ color: C.muted }} />
          </button>
          {!isSelf && (
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

function AddUserModal({ teamLeaders, onClose, onSaved, setError }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState('sales');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const save = async () => {
    setLocalError('');
    if (!fullName.trim() || !username.trim() || password.length < 6) {
      setLocalError('Please fill in all fields. Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    const { data: newUser, error } = await supabase.rpc('admin_create_user', {
      p_username: username.trim(),
      p_full_name: fullName.trim(),
      p_password: password,
      p_title: title,
      p_team_leader_id: title === 'sales' && teamLeaderId ? teamLeaderId : null,
    });
    if (!error) {
      const { data: newProfile } = await supabase.from('profiles').select('id').eq('username', username.trim()).single();
      if (newProfile) await supabase.from('profiles').update({ plain_password: password }).eq('id', newProfile.id);
    }
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
          <select value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} style={inputStyle}>
            {TITLES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {title === 'sales' && teamLeaders.length > 0 && (
            <select value={teamLeaderId} onChange={(e) => setTeamLeaderId(e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">No team leader</option>
              {teamLeaders.map((tl) => <option key={tl.id} value={tl.id}>{tl.full_name || tl.username}</option>)}
            </select>
          )}
          {localError && <p className="text-xs" style={{ color: '#C9714F' }}>{localError}</p>}
          <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-lg font-bold text-sm disabled:opacity-50" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            {saving ? '...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}
