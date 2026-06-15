import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtTime, fmtDateTime } from './constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const REP_COLORS = [C.gold, '#6E8CAE', '#7FA887', '#9B7EBD', '#C9714F', '#E8C66B', '#5BA3D0'];
const MAX_SESSION_HOURS = 12; // sanity cap for a single merged block
const ONLINE_THRESHOLD_MS = 4 * 60 * 1000; // heartbeat is every 2 min
const MERGE_GAP_MS = 10 * 60 * 1000; // merge sessions less than 10 min apart

// Merge sessions (sorted ascending by login_at) that are close together
// (e.g. from page refreshes / multiple tabs) into single continuous blocks.
function mergeSessions(rows) {
  const merged = [];
  for (const r of rows) {
    const start = new Date(r.login_at).getTime();
    const end = new Date(r.ended_at || r.last_seen_at).getTime();
    const isOpen = !r.ended_at;
    if (merged.length > 0) {
      const last = merged[merged.length - 1];
      if (start - last.end <= MERGE_GAP_MS) {
        if (end > last.end) last.end = end;
        last.isOpen = last.isOpen || isOpen;
        continue;
      }
    }
    merged.push({ start, end, isOpen });
  }
  return merged;
}

export default function Activity({ isAdmin, currentUserTitle }) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [reps, setReps] = useState([]);
  const [status, setStatus] = useState([]);

  const [logUserId, setLogUserId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logSessions, setLogSessions] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [exports, setExports] = useState([]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (logUserId) loadLog();
  }, [logUserId, logDate]);

  const load = async () => {
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [{ data: sessions }, { data: profiles }] = await Promise.all([
      supabase.from('user_sessions').select('user_id, login_at, last_seen_at, ended_at').gte('login_at', sevenDaysAgo.toISOString()).order('login_at', { ascending: true }),
      supabase.from('profiles').select('id, full_name, username, is_pool').eq('is_pool', false).order('full_name'),
    ]);

    const profileMap = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p.full_name || p.username || 'Unknown'; });
    const visibleProfiles = (profiles || []).filter((p) =>
      currentUserTitle === 'top_management' || !['operation', 'marketing'].includes(p.title)
    );
    const repList = visibleProfiles.map((p) => ({ id: p.id, name: profileMap[p.id] }));
    setReps(repList);
    if (!logUserId && repList.length > 0) setLogUserId(repList[0].id);

    // Group by user, then merge close-together sessions per user
    const byUser = {};
    (sessions || []).forEach((s) => {
      (byUser[s.user_id] = byUser[s.user_id] || []).push(s);
    });

    // Build last 7 days (oldest -> newest)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const byDay = {};
    days.forEach((d) => {
      byDay[d] = { date: d, label: new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) };
    });

    const now = Date.now();
    const latestBlockByUser = {};

    Object.entries(byUser).forEach(([userId, rows]) => {
      const merged = mergeSessions(rows);
      merged.forEach((m) => {
        const day = new Date(m.start).toISOString().slice(0, 10);
        if (byDay[day]) {
          let hours = (m.end - m.start) / 3600000;
          hours = Math.max(0, Math.min(hours, MAX_SESSION_HOURS));
          const repName = profileMap[userId] || 'Unknown';
          byDay[day][repName] = (byDay[day][repName] || 0) + hours;
        }
      });
      if (merged.length > 0) latestBlockByUser[userId] = merged[merged.length - 1];
    });

    setChartData(days.map((d) => {
      const row = { ...byDay[d] };
      repList.forEach((r) => { row[r.name] = Math.round((row[r.name] || 0) * 10) / 10; });
      return row;
    }));

    setStatus(repList.map((r) => {
      const latest = latestBlockByUser[r.id];
      const online = latest && latest.isOpen && (now - latest.end) < ONLINE_THRESHOLD_MS;
      return { ...r, lastSeen: latest ? latest.end : null, online };
    }));

    if (isAdmin) {
      const { data: exportRows } = await supabase
        .from('export_log')
        .select('id, exported_at, description, profiles(full_name, username)')
        .order('exported_at', { ascending: false })
        .limit(20);
      setExports(exportRows || []);
    }

    setLoading(false);
  };

  const loadLog = async () => {
    setLogLoading(true);
    const { data } = await supabase
      .from('user_sessions')
      .select('login_at, last_seen_at, ended_at')
      .eq('user_id', logUserId)
      .order('login_at', { ascending: true })
      .limit(500);

    const dayStart = new Date(`${logDate}T00:00:00`).getTime();
    const dayEnd = new Date(`${logDate}T23:59:59.999`).getTime();
    const now = Date.now();

    const merged = mergeSessions(data || []);
    const sessions = merged
      .filter((m) => m.start <= dayEnd && m.end >= dayStart)
      .map((m) => {
        const online = m.isOpen && (now - m.end) < ONLINE_THRESHOLD_MS;
        const endLabel = online ? 'Now' : m.isOpen ? `${fmtTime(m.end)} (idle)` : fmtTime(m.end);
        let hours = (m.end - m.start) / 3600000;
        hours = Math.max(0, Math.min(hours, MAX_SESSION_HOURS));
        return { start: fmtTime(m.start), end: endLabel, hours };
      });

    setLogSessions(sessions);
    setLogLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const totalLogHours = logSessions.reduce((sum, s) => sum + s.hours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-lg mb-1">Team Activity</h2>
        <p className="text-sm" style={{ color: C.muted }}>Time each sales rep has the CRM open, per day (last 7 days)</p>
      </div>

      <div className="rounded-xl p-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {reps.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: C.muted }}>No team members yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: C.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.muted }} />
              {reps.map((r, i) => (
                <Bar key={r.id} dataKey={r.name} fill={REP_COLORS[i % REP_COLORS.length]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <h3 className="font-display font-bold text-sm mb-2">Status Now</h3>
        <div className="space-y-2">
          {status.map((s) => (
            <div key={s.id} className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <span className="text-sm font-medium">{s.name}</span>
              {s.online ? (
                <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#7FA887' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7FA887' }} /> Online now
                </span>
              ) : (
                <span className="text-xs" style={{ color: C.muted }}>
                  {s.lastSeen ? `Last active ${timeAgo(s.lastSeen)}` : 'No activity yet'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div>
          <h3 className="font-display font-bold text-sm mb-2">Recent Exports</h3>
          <p className="text-xs mb-2" style={{ color: C.muted }}>
            Every CSV export by Top Management or Operation is logged here.
          </p>
          <div className="rounded-xl p-3 space-y-1.5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            {exports.length === 0 ? (
              <p className="text-xs" style={{ color: C.muted }}>No exports yet.</p>
            ) : (
              exports.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="font-medium">{e.profiles?.full_name || e.profiles?.username || 'Unknown'}</span>
                    <span style={{ color: C.muted }}> — {e.description}</span>
                  </span>
                  <span className="text-xs shrink-0" style={{ color: C.muted }}>{fmtDateTime(e.exported_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-bold text-sm mb-2">Daily Session Log</h3>
        <div className="flex gap-2 mb-3">
          <select
            value={logUserId}
            onChange={(e) => setLogUserId(e.target.value)}
            className="rounded-lg px-2.5 py-2 text-sm outline-none flex-1"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
          >
            {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="rounded-lg px-2.5 py-2 text-sm outline-none"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
          />
        </div>

        <div className="rounded-xl p-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          {logLoading ? (
            <p className="text-xs" style={{ color: C.muted }}>Loading...</p>
          ) : logSessions.length === 0 ? (
            <p className="text-xs" style={{ color: C.muted }}>No sessions on this day.</p>
          ) : (
            <>
              <div className="space-y-1.5 mb-2">
                {logSessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{s.start} – {s.end}</span>
                    <span style={{ color: C.muted }}>{s.hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-bold" style={{ borderTop: `1px solid ${C.border}`, color: C.gold }}>
                <span>Total</span>
                <span>{totalLogHours.toFixed(1)}h</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(ms) {
  const diffMs = Date.now() - ms;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
