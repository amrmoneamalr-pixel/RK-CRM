import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const REP_COLORS = [C.gold, '#6E8CAE', '#7FA887', '#9B7EBD', '#C9714F', '#E8C66B', '#5BA3D0'];
const MAX_SESSION_HOURS = 12; // sanity cap for a single session

export default function Activity() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [reps, setReps] = useState([]);
  const [status, setStatus] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [{ data: sessions }, { data: profiles }] = await Promise.all([
      supabase.from('user_sessions').select('user_id, login_at, last_seen_at').gte('login_at', sevenDaysAgo.toISOString()),
      supabase.from('profiles').select('id, full_name, username, is_pool').eq('is_pool', false).order('full_name'),
    ]);

    const profileMap = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p.full_name || p.username || 'Unknown'; });
    const repList = (profiles || []).map((p) => ({ id: p.id, name: profileMap[p.id] }));
    setReps(repList);

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

    (sessions || []).forEach((s) => {
      const day = s.login_at.slice(0, 10);
      if (!byDay[day]) return;
      let hours = (new Date(s.last_seen_at) - new Date(s.login_at)) / 3600000;
      hours = Math.max(0, Math.min(hours, MAX_SESSION_HOURS));
      const repName = profileMap[s.user_id] || 'Unknown';
      byDay[day][repName] = (byDay[day][repName] || 0) + hours;
    });

    setChartData(days.map((d) => {
      const row = { ...byDay[d] };
      repList.forEach((r) => { row[r.name] = Math.round((row[r.name] || 0) * 10) / 10; });
      return row;
    }));

    // Online status: last_seen within 5 minutes
    const now = Date.now();
    const latestByUser = {};
    (sessions || []).forEach((s) => {
      if (!latestByUser[s.user_id] || new Date(s.last_seen_at) > new Date(latestByUser[s.user_id])) {
        latestByUser[s.user_id] = s.last_seen_at;
      }
    });
    setStatus(repList.map((r) => {
      const lastSeen = latestByUser[r.id];
      return {
        ...r,
        lastSeen,
        online: lastSeen ? (now - new Date(lastSeen).getTime()) < 5 * 60 * 1000 : false,
      };
    }));

    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

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
                  {s.lastSeen ? `Last seen ${timeAgo(s.lastSeen)}` : 'No activity yet'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
