import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import {
  Sparkles, RotateCw, RefreshCw, Calendar, PhoneCall,
  CalendarClock, CalendarCheck, Target as TargetIcon
} from 'lucide-react';

// ─── Period helpers ────────────────────────────────────────────────────
// Week starts on Saturday. Month starts on the 1st.
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
const fmtDateOnly = (d) => d.toISOString().slice(0, 10);

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

// ─── Target tile (full width, with icon + progress bar) ────────────────
function TargetTile({ achieved, target, period, loading }) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const bg = pct >= 100 ? '#2E7D5C' : pct >= 50 ? '#B8852A' : '#8B3A2E';
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
          <span className="font-display font-bold leading-none" style={{ fontSize: '2.4rem' }}>
            {loading ? '—' : achieved}
          </span>
          <span className="text-base opacity-80">/ {target || '—'}</span>
          <span className="ml-auto mr-12 text-sm font-bold opacity-90">{pct}%</span>
        </div>
        <div className="text-sm font-semibold leading-tight">Target — Deals Closed</div>
        <div className="text-xs mt-0.5 opacity-80">{period}</div>
        <div className="h-1.5 mt-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#fff' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ profile }) {
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [target, setTarget] = useState(0);
  const [resolvedUserId, setResolvedUserId] = useState(profile?.id || null);
  const [debug, setDebug] = useState(null);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const userId = resolvedUserId;

  // If profile prop wasn't passed, fall back to the current auth user
  useEffect(() => {
    if (resolvedUserId) return;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) setResolvedUserId(data.user.id);
      } catch (e) { console.warn('auth.getUser failed', e); }
    })();
  }, [resolvedUserId]);

  useEffect(() => {
    if (!userId) return;
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const startISO = fmtDateISO(range.start);
      const endISO = fmtDateISO(range.end);
      const startDate = fmtDateOnly(range.start);
      const endDate = fmtDateOnly(new Date(range.end.getTime() - 1));

      const [freshRes, rotatedNewRes, reRotationRes, followupsRes, activitiesRes, targetRow, closedRes] = await Promise.all([
        supabase.from('client_ownership_log').select('client_id')
          .eq('owner_id', userId).eq('via_rotation', false)
          .gte('assigned_at', startISO).lt('assigned_at', endISO),
        supabase.from('client_ownership_log').select('client_id')
          .eq('owner_id', userId).eq('via_rotation', true).eq('stage_category', 'New Fresh Lead')
          .gte('assigned_at', startISO).lt('assigned_at', endISO),
        supabase.from('client_ownership_log').select('client_id')
          .eq('owner_id', userId).eq('via_rotation', true)
          .gte('assigned_at', startISO).lt('assigned_at', endISO),
        supabase.from('clients').select('id', { count: 'exact', head: true })
          .eq('owner_id', userId)
          .gte('next_follow_up', startDate).lte('next_follow_up', endDate),
        supabase.from('activities').select('client_id, notes, created_at')
          .eq('owner_id', userId)
          .gte('created_at', startISO).lt('created_at', endISO),
        supabase.from('targets').select('deals_target')
          .eq('owner_id', userId)
          .eq('month', new Date().toISOString().slice(0, 7))
          .maybeSingle(),
        supabase.from('clients').select('id', { count: 'exact', head: true })
          .eq('owner_id', userId).eq('stage', 'won')
          .gte('closed_at', startISO).lt('closed_at', endISO),
      ]);

      const distinct = (rows) => new Set((rows || []).map(r => r.client_id)).size;

      const ACTIVE = ['Contacted', 'Interest in Resale', 'Interest in Separate', 'Not Interested', 'Not Qualified'];
      const activeClients = new Set();
      const plannedClients = new Set();
      const actualClients = new Set();
      (activitiesRes.data || []).forEach(a => {
        const n = a.notes || '';
        ACTIVE.forEach(r => { if (n.includes('Action: ' + r)) activeClients.add(a.client_id); });
        if (n.includes('Planned Meeting')) plannedClients.add(a.client_id);
        if (n.includes('Actual Meeting')) actualClients.add(a.client_id);
      });

      setMetrics({
        fresh: distinct(freshRes.data),
        rotatedNew: distinct(rotatedNewRes.data),
        reRotation: distinct(reRotationRes.data),
        followups: followupsRes.count || 0,
        activeCalls: activeClients.size,
        plannedMeetings: plannedClients.size,
        actualMeetings: actualClients.size,
        closed: closedRes.count || 0,
      });

      // Debug snapshot
      setDebug({
        uid: userId,
        rangeStart: startISO,
        rangeEnd: endISO,
        followDateRange: `${startDate} → ${endDate}`,
        ownershipRows: (freshRes.data || []).length,
        rotationRows: (reRotationRes.data || []).length,
        activityRows: (activitiesRes.data || []).length,
        followupsCount: followupsRes.count,
        closedCount: closedRes.count,
        targetRow: targetRow?.data,
        errors: {
          fresh: freshRes.error?.message,
          rotated: rotatedNewRes.error?.message,
          rerotation: reRotationRes.error?.message,
          followups: followupsRes.error?.message,
          activities: activitiesRes.error?.message,
          closed: closedRes.error?.message,
        },
      });

      setTarget(targetRow?.data?.deals_target || 0);
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
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </p>
        </div>
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

      {/* Target */}
      <TargetTile
        achieved={metrics.closed || 0}
        target={target || 0}
        period={range.subLabel}
        loading={loading}
      />

      {/* Row 1: (1) Fresh · (4) Followups · (5) Active Calls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricTile
          icon={Sparkles}
          label="Fresh Leads"
          value={metrics.fresh || 0}
          bg="#2E7D5C"
          sub={range.subLabel}
          loading={loading}
        />
        <MetricTile
          icon={Calendar}
          label="Follow-ups"
          value={metrics.followups || 0}
          bg="#1E88B5"
          sub={range.subLabel}
          loading={loading}
        />
        <MetricTile
          icon={PhoneCall}
          label="Active Calls"
          value={metrics.activeCalls || 0}
          bg="#B8852A"
          sub={range.subLabel}
          loading={loading}
        />
      </div>

      {/* Row 2: (2) Rotated New Fresh · (3) Re-rotation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricTile
          icon={RotateCw}
          label="Rotated New Fresh"
          value={metrics.rotatedNew || 0}
          bg="#6D4F8C"
          sub={range.subLabel}
          loading={loading}
        />
        <MetricTile
          icon={RefreshCw}
          label="Re-rotation"
          value={metrics.reRotation || 0}
          bg="#C9714F"
          sub={range.subLabel}
          loading={loading}
        />
      </div>

      {/* Row 3: (6) Planned Meetings · (7) Actual Meetings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricTile
          icon={CalendarClock}
          label="Planned Meetings"
          value={metrics.plannedMeetings || 0}
          bg="#4A6FA5"
          sub={range.subLabel}
          loading={loading}
        />
        <MetricTile
          icon={CalendarCheck}
          label="Actual Meetings"
          value={metrics.actualMeetings || 0}
          bg="#2C3E50"
          sub={range.subLabel}
          loading={loading}
        />
      </div>

      <p className="text-[10px] text-center" style={{ color: C.muted }}>
        Showing data from {range.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to {new Date(range.end.getTime() - 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {/* Manual refresh button */}
      <div className="flex justify-center pt-1">
        <button
          onClick={loadMetrics}
          disabled={!userId || loading}
          className="text-xs px-4 py-1.5 rounded-lg disabled:opacity-40"
          style={{ backgroundColor: C.surface, color: C.gold, border: `1px solid ${C.border}` }}
        >
          {loading ? 'Loading…' : '↻ Refresh numbers'}
        </button>
      </div>

      {/* Debug overlay (temporary — to diagnose why numbers don't update) */}
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
