import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import {
  Sparkles, RotateCw, RefreshCw, Calendar, PhoneCall,
  CalendarClock, CalendarCheck, Target as TargetIcon, Users, ChevronDown, X, Check
} from 'lucide-react';

// ─── Period helpers ────────────────────────────────────────────────────
function getPeriodRange(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (period === 'daily') {
    const start = new Date(y, m, d, 0, 0, 0, 0);
    const end = new Date(y, m, d + 1, 0, 0, 0, 0);
    return { start, end, label: 'Today', subLabel: 'Today' };
  }
  if (period === 'weekly') {
    const dow = now.getDay();
    const daysBackToSat = (dow + 1) % 7;
    const start = new Date(y, m, d - daysBackToSat, 0, 0, 0, 0);
    const end = new Date(y, m, d + 1, 0, 0, 0, 0);
    return { start, end, label: "This Week's", subLabel: 'This Week' };
  }
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 1, 0, 0, 0, 0);
  return { start, end, label: "This Month's", subLabel: 'This Month' };
}

const fmtDateISO = (d) => d.toISOString();
const fmtDateOnly = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ─── Solid-color tile with a clean icon top-right ──────────────────────
function MetricTile({ icon: Icon, label, value, bg, sub, loading }) {
  return (
    <div className="rounded-xl p-5 relative" style={{ backgroundColor: bg, minHeight: 128 }}>
      {Icon && (
        <div
          className="absolute flex items-center justify-center rounded-lg"
          style={{
            top: 14, right: 14, width: 32, height: 32,
            backgroundColor: 'rgba(255,255,255,0.18)',
            color: '#fff',
          }}
        >
          <Icon size={16} strokeWidth={2} />
        </div>
      )}
      <div style={{ color: '#fff' }}>
        <div className="font-display font-bold leading-none mb-3" style={{ fontSize: '2.4rem' }}>
          {loading ? '—' : value}
        </div>
        <div className="text-sm font-semibold leading-tight">{label}</div>
        <div className="text-xs mt-0.5 opacity-80">{sub}</div>
      </div>
    </div>
  );
}

function TargetTile({ achieved, target, period, loading }) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const bg = pct >= 100 ? '#2E7D5C' : pct >= 50 ? '#B8852A' : '#8B3A2E';
  // Format big EGP numbers as 1.2M / 850K instead of 1,200,000 to fit nicely
  const compact = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
    return n.toLocaleString('en-US');
  };
  return (
    <div className="rounded-xl p-5 relative" style={{ backgroundColor: bg, minHeight: 128 }}>
      <div
        className="absolute flex items-center justify-center rounded-lg"
        style={{
          top: 14, right: 14, width: 32, height: 32,
          backgroundColor: 'rgba(255,255,255,0.18)',
          color: '#fff',
        }}
      >
        <TargetIcon size={16} strokeWidth={2} />
      </div>
      <div style={{ color: '#fff' }}>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-display font-bold leading-none" style={{ fontSize: '2.2rem' }}>
            {loading ? '—' : compact(achieved)}
          </span>
          <span className="text-base opacity-80">/ {compact(target) || '—'} EGP</span>
          <span className="ml-auto mr-12 text-sm font-bold opacity-90">{pct}%</span>
        </div>
        <div className="text-sm font-semibold leading-tight">Sales Target</div>
        <div className="text-xs mt-0.5 opacity-80">{period}</div>
        <div className="h-1.5 mt-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#fff' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Multi-select dropdown for admin user filter ───────────────────────
function UserMultiSelect({ users, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allSelected = selectedIds.length === users.length && users.length > 0;
  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };
  const selectAll = () => onChange(users.map(u => u.id));
  const clearAll = () => onChange([]);

  const summary = allSelected
    ? `All Sales (${users.length})`
    : selectedIds.length === 0
      ? 'None selected'
      : `${selectedIds.length} selected`;

  return (
    <div ref={ref} className="relative" style={{ minWidth: 220 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
      >
        <span className="flex items-center gap-2">
          <Users size={14} style={{ color: C.gold }} />
          {summary}
        </span>
        <ChevronDown size={14} style={{ color: C.muted }} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 rounded-lg z-20 shadow-lg"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, minWidth: 260, maxHeight: 360, overflowY: 'auto' }}
        >
          <div className="flex gap-1 p-2 sticky top-0" style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
            <button onClick={selectAll} className="flex-1 text-xs py-1 rounded" style={{ backgroundColor: C.bg, color: C.gold, border: `1px solid ${C.border}` }}>
              Select All
            </button>
            <button onClick={clearAll} className="flex-1 text-xs py-1 rounded" style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
              Clear
            </button>
          </div>
          {users.length === 0 && (
            <div className="text-xs text-center py-4" style={{ color: C.muted }}>No sales reps found.</div>
          )}
          {users.map(u => {
            const isOn = selectedIds.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggle(u.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:opacity-80"
                style={{ color: C.text }}
              >
                <div
                  className="flex items-center justify-center rounded"
                  style={{
                    width: 16, height: 16,
                    backgroundColor: isOn ? C.gold : 'transparent',
                    border: `1px solid ${isOn ? C.gold : C.border}`,
                  }}
                >
                  {isOn && <Check size={11} style={{ color: '#14181F' }} strokeWidth={3} />}
                </div>
                <span className="flex-1 truncate">{u.full_name || u.username || '—'}</span>
                {u.monthly_target > 0 && (
                  <span className="text-[10px] opacity-70">target: {u.monthly_target}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ profile }) {
  const [resolvedProfile, setResolvedProfile] = useState(profile || null);
  const effectiveProfile = resolvedProfile;

  const isAdmin = effectiveProfile?.role === 'admin'
    || effectiveProfile?.title === 'top_management'
    || effectiveProfile?.title === 'sales_manager'
    || effectiveProfile?.title === 'team_leader';

  // If profile wasn't passed as a prop, fetch it from the DB using the auth user
  useEffect(() => {
    if (effectiveProfile?.id) return;
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (!uid) return;
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, role, title, full_name, username, monthly_target')
          .eq('id', uid)
          .maybeSingle();
        if (prof) setResolvedProfile(prof);
        else setResolvedProfile({ id: uid });
      } catch (e) { console.warn('profile fetch failed', e); }
    })();
  }, [effectiveProfile]);

  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [target, setTarget] = useState(0);
  const [resolvedUserId, setResolvedUserId] = useState(profile?.id || null);

  // Keep userId in sync with effectiveProfile
  useEffect(() => {
    if (effectiveProfile?.id && effectiveProfile.id !== resolvedUserId) {
      setResolvedUserId(effectiveProfile.id);
    }
  }, [effectiveProfile, resolvedUserId]);
  const [debug, setDebug] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Admin-only: list of all sales reps + which ones are selected
  const [salesUsers, setSalesUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const userId = resolvedUserId;

  // Fallback userId
  useEffect(() => {
    if (resolvedUserId) return;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) setResolvedUserId(data.user.id);
      } catch (e) { console.warn('auth.getUser failed', e); }
    })();
  }, [resolvedUserId]);

  // Load sales reps list (admin only) — excludes marketing
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, monthly_target, title')
        .eq('role', 'sales')
        .eq('is_pool', false)
        .neq('title', 'marketing')
        .order('full_name');
      const list = data || [];
      setSalesUsers(list);
      setSelectedIds(list.map(u => u.id));
    })();
  }, [isAdmin]);

  // Effective owner IDs for queries
  // For admin: use selected sales rep IDs
  // For sales: use own ID
  // While the sales list is still loading for admin, return null (not empty) to skip query
  const effectiveUserIds = isAdmin
    ? (salesUsers.length === 0 ? null : selectedIds)
    : (userId ? [userId] : null);

  useEffect(() => {
    if (effectiveUserIds === null) return;       // still loading
    if (effectiveUserIds.length === 0) {         // explicitly cleared
      setMetrics({});
      setTarget(0);
      setLoading(false);
      setLastUpdated(new Date());
      return;
    }
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(effectiveUserIds), period]);

  // Auto-refresh: polling + custom event + focus
  useEffect(() => {
    if (effectiveUserIds === null || effectiveUserIds.length === 0) return;
    const handler = () => loadMetrics();
    window.addEventListener('rk-data-updated', handler);
    window.addEventListener('focus', handler);
    const interval = setInterval(handler, 15000);
    return () => {
      window.removeEventListener('rk-data-updated', handler);
      window.removeEventListener('focus', handler);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(effectiveUserIds), period]);

  const loadMetrics = async () => {
    if (!effectiveUserIds || effectiveUserIds.length === 0) {
      setMetrics({});
      setTarget(0);
      setLoading(false);
      setLastUpdated(new Date());
      return;
    }
    setLoading(true);
    try {
      const startISO = fmtDateISO(range.start);
      const endISO = fmtDateISO(range.end);

      const [freshRes, rotatedFreshRes, reRotationRes, activitiesRes, targetRows, closedRes] = await Promise.all([
        // (1) Fresh Leads — PERIOD
        supabase.from('client_ownership_log').select('client_id')
          .in('owner_id', effectiveUserIds)
          .eq('via_rotation', false)
          .eq('stage_category', 'New Fresh Lead')
          .gte('assigned_at', startISO).lt('assigned_at', endISO),

        // (4) Rotated Fresh — PERIOD
        supabase.from('client_ownership_log').select('client_id')
          .in('owner_id', effectiveUserIds)
          .eq('via_rotation', true)
          .eq('stage_category', 'New Fresh Lead')
          .gte('assigned_at', startISO).lt('assigned_at', endISO),

        // (5) Re-rotation — PERIOD
        supabase.from('client_ownership_log').select('client_id')
          .in('owner_id', effectiveUserIds)
          .eq('via_rotation', true)
          .neq('stage_category', 'New Fresh Lead')
          .gte('assigned_at', startISO).lt('assigned_at', endISO),

        // (2, 3, 6, 7) manual activities in period
        supabase.from('activities').select('client_id, notes, type')
          .in('owner_id', effectiveUserIds)
          .in('type', ['call', 'meeting'])
          .gte('created_at', startISO).lt('created_at', endISO),

        // Targets: sum monthly_target from profiles
        supabase.from('profiles').select('monthly_target')
          .in('id', effectiveUserIds),

        // Closed deals in period — get deal_value to sum
        supabase.from('clients').select('deal_value')
          .in('owner_id', effectiveUserIds)
          .eq('stage', 'won')
          .gte('closed_at', startISO).lt('closed_at', endISO),
      ]);

      const distinctIds = (rows) => new Set((rows || []).map(r => r.client_id)).size;

      const ACTIVE = ['Contacted', 'Interest in Resale', 'Interest in Separate', 'Not Interested', 'Not Qualified', 'Deal with the client'];
      const followupClients = new Set();
      const activeClients = new Set();
      const plannedClients = new Set();
      const actualClients = new Set();

      (activitiesRes.data || []).forEach(a => {
        followupClients.add(a.client_id);
        const n = a.notes || '';
        ACTIVE.forEach(r => { if (n.includes('Action: ' + r)) activeClients.add(a.client_id); });
        if (n.includes('Planned Meeting')) plannedClients.add(a.client_id);
        if (n.includes('Actual Meeting')) actualClients.add(a.client_id);
      });

      const summedTarget = (targetRows.data || []).reduce((sum, r) => sum + Number(r.monthly_target || 0), 0);
      const summedClosedValue = (closedRes.data || []).reduce((sum, r) => sum + Number(r.deal_value || 0), 0);

      setMetrics({
        fresh: distinctIds(freshRes.data),
        rotatedFresh: distinctIds(rotatedFreshRes.data),
        reRotation: distinctIds(reRotationRes.data),
        followups: followupClients.size,
        activeCalls: activeClients.size,
        plannedMeetings: plannedClients.size,
        actualMeetings: actualClients.size,
        closed: summedClosedValue,
        closedCount: (closedRes.data || []).length,
      });

      setTarget(summedTarget);

      setDebug({
        mode: isAdmin ? 'admin' : 'sales',
        userIds: effectiveUserIds,
        userCount: effectiveUserIds.length,
        period,
        rangeStart: startISO,
        rangeEnd: endISO,
        activityRows: (activitiesRes.data || []).length,
        rawRowCounts: {
          fresh: (freshRes.data || []).length,
          rotatedFresh: (rotatedFreshRes.data || []).length,
          reRotation: (reRotationRes.data || []).length,
        },
        distinctCounts: {
          fresh: distinctIds(freshRes.data),
          rotatedFresh: distinctIds(rotatedFreshRes.data),
          reRotation: distinctIds(reRotationRes.data),
          followups: followupClients.size,
          activeCalls: activeClients.size,
          closedDeals: (closedRes.data || []).length,
          closedValueEGP: summedClosedValue,
        },
        summedTarget,
        errors: {
          fresh: freshRes.error?.message,
          rotatedFresh: rotatedFreshRes.error?.message,
          reRotation: reRotationRes.error?.message,
          activities: activitiesRes.error?.message,
          targets: targetRows.error?.message,
          closed: closedRes.error?.message,
        },
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.warn('Dashboard load failed:', e);
      setDebug({ exception: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-lg">Dashboard</h2>
          <p className="text-xs" style={{ color: C.muted }}>
            {isAdmin
              ? `Team overview · ${selectedIds.length}/${salesUsers.length} sales reps selected`
              : `Welcome back, ${effectiveProfile?.full_name?.split(' ')[0] || 'there'}!`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <UserMultiSelect
              users={salesUsers}
              selectedIds={selectedIds}
              onChange={setSelectedIds}
            />
          )}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {[
              { id: 'daily',   label: 'Daily' },
              { id: 'weekly',  label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setPeriod(t.id)}
                className="px-4 py-1.5 text-xs font-bold transition-colors"
                style={{
                  backgroundColor: period === t.id ? C.gold : C.surface,
                  color: period === t.id ? '#14181F' : C.muted,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target */}
      <TargetTile
        achieved={metrics.closed || 0}
        target={target || 0}
        period={range.subLabel}
        loading={loading}
      />

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricTile icon={Sparkles}   label="Fresh Leads"   value={metrics.fresh || 0}        bg="#2E7D5C" sub={range.subLabel} loading={loading} />
        <MetricTile icon={Calendar}   label="Follow-ups"    value={metrics.followups || 0}    bg="#1E88B5" sub={range.subLabel} loading={loading} />
        <MetricTile icon={PhoneCall}  label="Active Calls"  value={metrics.activeCalls || 0}  bg="#B8852A" sub={range.subLabel} loading={loading} />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricTile icon={RotateCw}   label="Rotated Fresh" value={metrics.rotatedFresh || 0} bg="#6D4F8C" sub={range.subLabel} loading={loading} />
        <MetricTile icon={RefreshCw}  label="Re-rotation"   value={metrics.reRotation || 0}   bg="#C9714F" sub={range.subLabel} loading={loading} />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricTile icon={CalendarClock} label="Planned Meetings" value={metrics.plannedMeetings || 0} bg="#4A6FA5" sub={range.subLabel} loading={loading} />
        <MetricTile icon={CalendarCheck} label="Actual Meetings"  value={metrics.actualMeetings || 0}  bg="#2C3E50" sub={range.subLabel} loading={loading} />
      </div>

      <p className="text-[10px] text-center" style={{ color: C.muted }}>
        Showing data from {range.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to {new Date(range.end.getTime() - 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {/* Refresh + status */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          onClick={loadMetrics}
          disabled={!effectiveUserIds || effectiveUserIds.length === 0 || loading}
          className="text-xs px-4 py-1.5 rounded-lg disabled:opacity-40"
          style={{ backgroundColor: C.surface, color: C.gold, border: `1px solid ${C.border}` }}
        >
          {loading ? 'Loading…' : '↻ Refresh numbers'}
        </button>
        {lastUpdated && (
          <span className="text-[10px]" style={{ color: C.muted }}>
            Last updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {debug?.activityRows !== undefined && ` · ${debug.activityRows} activities loaded`}
          </span>
        )}
      </div>

      {debug && (
        <details className="rounded-lg p-2 text-[10px]" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
          <summary className="cursor-pointer" style={{ color: C.gold }}>🔧 Debug info (tap to expand)</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all" style={{ fontSize: 10 }}>
{JSON.stringify(debug, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
