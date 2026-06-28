import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import {
  Sparkles, RotateCw, RefreshCw, Calendar, PhoneCall,
  CalendarClock, CalendarCheck, Target as TargetIcon, TrendingUp
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
    return { start, end, label: 'Today' };
  }
  if (period === 'weekly') {
    // Saturday = 6, Sunday = 0, Monday = 1 ... Friday = 5
    const dow = now.getDay();
    const daysBackToSat = (dow + 1) % 7; // Sat→0, Sun→1, Mon→2, ..., Fri→6
    const start = new Date(y, m, d - daysBackToSat, 0, 0, 0, 0);
    const end = new Date(y, m, d + 1, 0, 0, 0, 0);
    return { start, end, label: "This Week" };
  }
  // monthly
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 1, 0, 0, 0, 0);
  return { start, end, label: 'This Month' };
}

const fmtDateISO = (d) => d.toISOString();
const fmtDateOnly = (d) => d.toISOString().slice(0, 10);

// ─── Box component ─────────────────────────────────────────────────────
function MetricBox({ icon: Icon, label, value, color, sublabel, loading }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, backgroundColor: `${color}22`, color }}>
            <Icon size={14} />
          </div>
          <span className="text-xs font-bold" style={{ color: C.muted }}>{label}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display font-bold text-3xl" style={{ color: loading ? C.muted : C.text }}>
          {loading ? '—' : value}
        </span>
        {sublabel && !loading && <span className="text-xs" style={{ color: C.muted }}>{sublabel}</span>}
      </div>
    </div>
  );
}

// ─── Target box (special) ──────────────────────────────────────────────
function TargetBox({ achieved, target, period, loading }) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const color = pct >= 100 ? '#7FA887' : pct >= 50 ? C.gold : '#C9714F';
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.gold}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TargetIcon size={14} style={{ color: C.gold }} />
          <span className="text-xs font-bold" style={{ color: C.muted }}>{period} Target — Deals Closed</span>
        </div>
        <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display font-bold text-3xl" style={{ color: loading ? C.muted : C.text }}>
          {loading ? '—' : achieved}
        </span>
        <span className="text-sm" style={{ color: C.muted }}>
          / {target || '—'}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.bg }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ profile }) {
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [target, setTarget] = useState(null);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const userId = profile?.id;

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
      const endDate = fmtDateOnly(new Date(range.end.getTime() - 1)); // inclusive end day

      // Run all queries in parallel
      const [
        freshRes,           // (1) Fresh leads (first assignment in period)
        rotatedNewRes,      // (2) Rotated NEW Fresh in period
        reRotationRes,      // (3) Any re-rotation received in period
        followupsRes,       // (4) Today's/Week's/Month's followups (next_follow_up in period)
        activitiesRes,      // (5,6,7) all activities in period
        targetRow,          // monthly target
        closedRes,          // closed deals in period (stage = 'won')
      ] = await Promise.all([
        supabase
          .from('client_ownership_log')
          .select('client_id', { count: 'exact', head: false })
          .eq('owner_id', userId)
          .eq('via_rotation', false)
          .gte('assigned_at', startISO)
          .lt('assigned_at', endISO),

        supabase
          .from('client_ownership_log')
          .select('client_id', { count: 'exact', head: false })
          .eq('owner_id', userId)
          .eq('via_rotation', true)
          .eq('stage_category', 'New Fresh Lead')
          .gte('assigned_at', startISO)
          .lt('assigned_at', endISO),

        supabase
          .from('client_ownership_log')
          .select('client_id', { count: 'exact', head: false })
          .eq('owner_id', userId)
          .eq('via_rotation', true)
          .gte('assigned_at', startISO)
          .lt('assigned_at', endISO),

        supabase
          .from('clients')
          .select('id', { count: 'exact', head: false })
          .eq('owner_id', userId)
          .gte('next_follow_up', startDate)
          .lte('next_follow_up', endDate),

        supabase
          .from('activities')
          .select('client_id, type, notes, date, created_at, owner_id')
          .eq('owner_id', userId)
          .gte('created_at', startISO)
          .lt('created_at', endISO),

        supabase
          .from('targets')
          .select('deals_target')
          .eq('owner_id', userId)
          .eq('month', new Date().toISOString().slice(0, 7))
          .maybeSingle(),

        supabase
          .from('clients')
          .select('id', { count: 'exact', head: false })
          .eq('owner_id', userId)
          .eq('stage', 'won')
          .gte('closed_at', startISO)
          .lt('closed_at', endISO),
      ]);

      // Deduplicate: count distinct client_ids
      const distinctIds = (rows) => new Set((rows || []).map(r => r.client_id)).size;

      // Active Calls: distinct clients where call_result is one of the response types
      const ACTIVE_RESULTS = ['Contacted', 'Interest in Resale', 'Interest in Separate', 'Not Interested', 'Not Qualified'];
      const activities = activitiesRes.data || [];

      const activeCallClients = new Set();
      const plannedMeetingClients = new Set();
      const actualMeetingClients = new Set();
      activities.forEach(a => {
        const notes = a.notes || '';
        // Active call check (based on Action: ... in notes)
        ACTIVE_RESULTS.forEach(res => {
          if (notes.includes('Action: ' + res)) activeCallClients.add(a.client_id);
        });
        // Meeting checks (we tag these explicitly in the notes when saving)
        if (notes.includes('Planned Meeting')) plannedMeetingClients.add(a.client_id);
        if (notes.includes('Actual Meeting')) actualMeetingClients.add(a.client_id);
      });

      setMetrics({
        fresh: distinctIds(freshRes.data),
        rotatedNew: distinctIds(rotatedNewRes.data),
        reRotation: distinctIds(reRotationRes.data),
        followups: (followupsRes.count || 0),
        activeCalls: activeCallClients.size,
        plannedMeetings: plannedMeetingClients.size,
        actualMeetings: actualMeetingClients.size,
        closed: closedRes.count || 0,
      });

      setTarget(targetRow?.data?.deals_target || 0);
    } catch (e) {
      console.warn('Dashboard load failed:', e);
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
        {/* Period switcher */}
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

      {/* Target — full width */}
      <TargetBox
        achieved={metrics.closed || 0}
        target={target || 0}
        period={range.label}
        loading={loading}
      />

      {/* Row 1: Fresh / Followups / Active Calls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricBox
          icon={Sparkles}
          label={`${range.label}'s Fresh Leads`}
          value={metrics.fresh || 0}
          color="#7FA887"
          loading={loading}
        />
        <MetricBox
          icon={Calendar}
          label={`${range.label}'s Follow-ups`}
          value={metrics.followups || 0}
          color="#6E8CAE"
          loading={loading}
        />
        <MetricBox
          icon={PhoneCall}
          label={`${range.label}'s Active Calls`}
          value={metrics.activeCalls || 0}
          color={C.gold}
          loading={loading}
        />
      </div>

      {/* Row 2: Rotated New Fresh / Re-rotation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricBox
          icon={RotateCw}
          label={`${range.label}'s Rotated New Fresh`}
          value={metrics.rotatedNew || 0}
          color="#9B7EBD"
          loading={loading}
        />
        <MetricBox
          icon={RefreshCw}
          label={`${range.label}'s Re-rotation`}
          value={metrics.reRotation || 0}
          color="#E0A458"
          loading={loading}
        />
      </div>

      {/* Row 3: Meetings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricBox
          icon={CalendarClock}
          label={`${range.label}'s Planned Meetings`}
          value={metrics.plannedMeetings || 0}
          color="#5BA3D0"
          loading={loading}
        />
        <MetricBox
          icon={CalendarCheck}
          label={`${range.label}'s Actual Meetings`}
          value={metrics.actualMeetings || 0}
          color="#7FA887"
          loading={loading}
        />
      </div>

      {/* Subtle period range footer */}
      <p className="text-[10px] text-center" style={{ color: C.muted }}>
        Showing data from {range.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to {new Date(range.end.getTime() - 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}
