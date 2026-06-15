import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, monthKey, todayStr, fmtTime, fmtDate } from './constants';
import { Briefcase, Calendar, Phone, TrendingUp, Users, Clock } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_CALL_RESULTS  = ['Contacted', 'Not Interested', 'Not Qualified', 'Interest in Resale', 'Interest in Separate'];
const NO_REACH_RESULTS     = ['No Answer', 'Switched Off', 'Send WhatsApp'];
const NOT_QUAL_RESULTS     = ['Not Interested', 'Not Qualified'];
const INTEREST_RESULTS     = ['Interest in Resale', 'Interest in Separate'];
const DAILY_MEETING_TARGET = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const startOfDay  = () => new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
};
const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

// ─── Shared UI ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? C.gold : C.surface,
        color: active ? '#14181F' : C.muted,
        border: `1px solid ${active ? C.gold : C.border}`,
      }}
    >
      {children}
    </button>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      {title && (
        <h3 className="font-display font-bold text-sm flex items-center gap-2">
          {Icon && <Icon size={14} style={{ color: C.gold }} />} {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg p-3 gap-1" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
      <span className="text-xl font-bold font-display" style={{ color: color || C.gold }}>{value}</span>
      <span className="text-[11px] text-center leading-tight" style={{ color: C.muted }}>{label}</span>
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const w = Math.max(4, max ? (value / max) * 100 : 0);
  return (
    <div className="flex-1 h-4 rounded overflow-hidden" style={{ backgroundColor: C.bg }}>
      <div className="h-full rounded flex items-center justify-end px-1.5" style={{ width: `${w}%`, backgroundColor: color || C.gold }}>
        {value > 0 && <span className="text-[10px] font-bold" style={{ color: '#14181F' }}>{value}</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reports() {
  const [tab, setTab] = useState('daily');
  const [profiles, setProfiles]   = useState([]);
  const [clients, setClients]     = useState([]);
  const [activities, setActivities] = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const todayISO = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const [{ data: p }, { data: c }, { data: a }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('activities').select('*'),
      supabase.from('user_sessions').select('*').gte('last_seen_at', todayISO),
    ]);
    setProfiles(p || []);
    setClients(c || []);
    setActivities(a || []);
    setSessions(s || []);
    setLoading(false);
  };

  if (loading) return <p className="text-sm" style={{ color: C.muted }}>Loading...</p>;

  // Only show actual sales reps (exclude pool / non-sales)
  const salesProfiles = profiles.filter((p) => !p.is_pool);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <Briefcase size={18} style={{ color: C.gold }} /> Reports
        </h2>
        <div className="flex gap-2 flex-wrap">
          <TabButton active={tab === 'daily'}   onClick={() => setTab('daily')}>Daily</TabButton>
          <TabButton active={tab === 'weekly'}  onClick={() => setTab('weekly')}>Weekly</TabButton>
          <TabButton active={tab === 'monthly'} onClick={() => setTab('monthly')}>Monthly</TabButton>
          <TabButton active={tab === 'leads'}   onClick={() => setTab('leads')}>Lead Sources</TabButton>
        </div>
      </div>

      {tab === 'daily'   && <DailyReport   profiles={salesProfiles} clients={clients} activities={activities} sessions={sessions} />}
      {tab === 'weekly'  && <WeeklyReport  profiles={salesProfiles} clients={clients} activities={activities} />}
      {tab === 'monthly' && <MonthlyReport profiles={salesProfiles} clients={clients} activities={activities} />}
      {tab === 'leads'   && <LeadsReport   profiles={salesProfiles} clients={clients} />}
    </div>
  );
}

// ─── Daily Report ─────────────────────────────────────────────────────────────

function DailyReport({ profiles, clients, activities, sessions }) {
  const today = todayStr();

  // Activities logged today
  const todayActs = activities.filter((a) => a.date === today);

  return (
    <div className="space-y-5">

      {/* ── Per-rep breakdown ── */}
      <Card title="Today's Activity per Sales Rep" icon={Phone}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs" style={{ color: C.muted }}>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">First Login</th>
                <th className="py-2 pr-3 text-center">Follow-ups</th>
                <th className="py-2 pr-3 text-center">Active Calls</th>
                <th className="py-2 pr-3 text-center">Planned Meeting</th>
                <th className="py-2 pr-3 text-center">Actual Meeting</th>
                <th className="py-2 text-center">New Leads</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                // Sessions already filtered to today (last_seen_at >= today midnight UTC)
                const mySessions = sessions.filter((s) => s.user_id === p.id);
                // First login = earliest created_at (fallback to last_seen_at) among today's sessions
                const firstLoginTs = mySessions.length > 0
                  ? mySessions
                      .map((s) => s.created_at || s.last_seen_at)
                      .filter(Boolean)
                      .sort()[0]
                  : null;

                const myActs      = todayActs.filter((a) => a.owner_id === p.id);
                const followUps   = myActs.length;
                const plannedMtg  = myActs.filter((a) => a.type === 'planned_meeting').length;
                const actualMtg   = myActs.filter((a) => a.type === 'meeting').length;

                const myClients   = clients.filter((c) => c.owner_id === p.id);
                const activeCalls = myClients.filter((c) => ACTIVE_CALL_RESULTS.includes(c.call_result)).length;
                const newLeads    = clients.filter((c) => c.owner_id === p.id && c.created_at >= startOfDay()).length;

                const plannedColor = plannedMtg >= DAILY_MEETING_TARGET ? '#7FA887' : plannedMtg >= 1 ? C.gold : '#C9714F';

                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="py-2 pr-3 font-medium">{p.full_name || p.username || '—'}</td>
                    <td className="py-2 pr-3 text-xs" style={{ color: C.muted }}>
                      {firstLoginTs ? fmtTime(firstLoginTs) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-center" style={{ color: C.gold }}>{followUps}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: C.text }}>{activeCalls}</td>
                    <td className="py-2 pr-3 text-center font-bold" style={{ color: plannedColor }}>
                      {plannedMtg} / {DAILY_MEETING_TARGET}
                    </td>
                    <td className="py-2 pr-3 text-center" style={{ color: '#7FA887' }}>{actualMtg}</td>
                    <td className="py-2 text-center" style={{ color: C.muted }}>{newLeads}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs" style={{ color: C.muted }}>
          * Follow-ups = all activities logged today. Active Calls = clients this rep has reached/qualified (Contacted / Not Interested / Not Qualified / Interest in Resale or Separate). Meetings target: {DAILY_MEETING_TARGET}/day.
        </p>
      </Card>

      {/* ── Call result distribution (today's active clients) ── */}
      <Card title="Call Result Breakdown — All Clients" icon={TrendingUp}>
        <div className="space-y-3">
          {(() => {
            const groups = [
              { label: 'Contacted',            results: ['Contacted'],                          color: '#7FA887' },
              { label: 'No Answer / Off / WA', results: ['No Answer','Switched Off','Send WhatsApp'], color: '#8B93A3' },
              { label: 'Not Interested / Qualified', results: ['Not Interested','Not Qualified'], color: '#C9714F' },
              { label: 'Interest Resale / Separate', results: ['Interest in Resale','Interest in Separate'], color: '#9B7EBD' },
            ];
            const total = clients.filter((c) => c.call_result).length || 1;
            return groups.map((g) => {
              const count = clients.filter((c) => g.results.includes(c.call_result)).length;
              return (
                <div key={g.label} className="flex items-center gap-3">
                  <div className="w-44 text-xs shrink-0" style={{ color: C.muted }}>{g.label}</div>
                  <MiniBar value={count} max={total} color={g.color} />
                  <span className="text-xs w-8 text-right shrink-0" style={{ color: C.muted }}>{pct(count, total)}%</span>
                </div>
              );
            });
          })()}
        </div>
      </Card>

      {/* ── Meetings breakdown today ── */}
      <Card title="Meetings Today — Outcome Breakdown" icon={Calendar}>
        {(() => {
          const todayMeetings = todayActs.filter((a) => a.type === 'meeting');
          if (todayMeetings.length === 0) {
            return <p className="text-sm" style={{ color: C.muted }}>No meetings logged today yet.</p>;
          }
          // For meetings we look at the client's call_result as the outcome
          const meetingClientIds = [...new Set(todayMeetings.map((a) => a.client_id))];
          const meetingClients = clients.filter((c) => meetingClientIds.includes(c.id));

          const noReach    = meetingClients.filter((c) => ['No Answer','Switched Off','Send WhatsApp'].includes(c.call_result)).length;
          const notQual    = meetingClients.filter((c) => ['Not Interested','Not Qualified'].includes(c.call_result)).length;
          const interest   = meetingClients.filter((c) => ['Interest in Resale','Interest in Separate'].includes(c.call_result)).length;
          const contacted  = meetingClients.filter((c) => c.call_result === 'Contacted').length;
          const unknown    = meetingClients.length - noReach - notQual - interest - contacted;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBadge label="No Answer / Off / WA" value={noReach}   color="#8B93A3" />
              <StatBadge label="Not Int. / Not Qual." value={notQual}   color="#C9714F" />
              <StatBadge label="Interest Resale / Sep." value={interest} color="#9B7EBD" />
              <StatBadge label="Contacted"              value={contacted} color="#7FA887" />
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ─── Weekly Report ────────────────────────────────────────────────────────────

function WeeklyReport({ profiles, clients, activities }) {
  const weekStart = startOfWeek();
  const weekActs  = activities.filter((a) => a.date >= weekStart.slice(0, 10));
  const weekClients = clients.filter((c) => c.created_at >= weekStart);

  return (
    <div className="space-y-5">
      <Card title="This Week (Last 7 Days)" icon={Calendar}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs" style={{ color: C.muted }}>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3 text-center">Follow-ups</th>
                <th className="py-2 pr-3 text-center">Planned Meeting</th>
                <th className="py-2 pr-3 text-center">Actual Meeting</th>
                <th className="py-2 pr-3 text-center">Active Calls</th>
                <th className="py-2 text-center">New Leads</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const myActs     = weekActs.filter((a) => a.owner_id === p.id);
                const followUps  = myActs.length;
                const plannedMtg = myActs.filter((a) => a.type === 'planned_meeting').length;
                const actualMtg  = myActs.filter((a) => a.type === 'meeting').length;
                const myClients  = clients.filter((c) => c.owner_id === p.id);
                const activeCalls = myClients.filter((c) => ACTIVE_CALL_RESULTS.includes(c.call_result)).length;
                const newLeads   = weekClients.filter((c) => c.owner_id === p.id).length;
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="py-2 pr-3 font-medium">{p.full_name || p.username || '—'}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: C.gold }}>{followUps}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: '#D4A24E' }}>{plannedMtg}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: '#7FA887' }}>{actualMtg}</td>
                    <td className="py-2 pr-3 text-center">{activeCalls}</td>
                    <td className="py-2 text-center" style={{ color: C.muted }}>{newLeads}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Daily activity trend this week ── */}
      <Card title="Daily Follow-up Trend This Week" icon={TrendingUp}>
        {(() => {
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().slice(0, 10);
          });
          const counts = days.map((day) => ({ day, count: activities.filter((a) => a.date === day).length }));
          const max    = Math.max(1, ...counts.map((c) => c.count));
          return (
            <div className="space-y-2">
              {counts.map(({ day, count }) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs w-20 shrink-0" style={{ color: C.muted }}>
                    {new Date(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <MiniBar value={count} max={max} color={C.gold} />
                </div>
              ))}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ─── Monthly Report ───────────────────────────────────────────────────────────

function MonthlyReport({ profiles, clients, activities }) {
  const mKey       = monthKey();
  const monthStart = startOfMonth();
  const monthActs  = activities.filter((a) => a.date && a.date.startsWith(mKey));
  const monthName  = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <Card title={`Monthly Summary — ${monthName}`} icon={Briefcase}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs" style={{ color: C.muted }}>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3 text-center">Follow-ups</th>
                <th className="py-2 pr-3 text-center">Planned Meeting</th>
                <th className="py-2 pr-3 text-center">Actual Meeting</th>
                <th className="py-2 pr-3 text-center">Active Calls</th>
                <th className="py-2 pr-3 text-center">New Leads</th>
                <th className="py-2 text-center">Won</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const myActs      = monthActs.filter((a) => a.owner_id === p.id);
                const followUps   = myActs.length;
                const plannedMtg  = myActs.filter((a) => a.type === 'planned_meeting').length;
                const actualMtg   = myActs.filter((a) => a.type === 'meeting').length;
                const myClients   = clients.filter((c) => c.owner_id === p.id);
                const activeCalls = myClients.filter((c) => ACTIVE_CALL_RESULTS.includes(c.call_result)).length;
                const newLeads    = clients.filter((c) => c.owner_id === p.id && c.created_at >= monthStart).length;
                const won         = myClients.filter((c) => c.stage === 'won' && c.closed_at && c.closed_at.startsWith(mKey)).length;
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="py-2 pr-3 font-medium">{p.full_name || p.username || '—'}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: C.gold }}>{followUps}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: '#D4A24E' }}>{plannedMtg}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: '#7FA887' }}>{actualMtg}</td>
                    <td className="py-2 pr-3 text-center">{activeCalls}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: C.muted }}>{newLeads}</td>
                    <td className="py-2 text-center font-bold" style={{ color: '#7FA887' }}>{won}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Call result distribution this month ── */}
      <Card title="Call Results Distribution This Month" icon={TrendingUp}>
        {(() => {
          const groups = [
            { label: 'Contacted',                 results: ['Contacted'],                                  color: '#7FA887' },
            { label: 'No Answer / Off / WA',      results: ['No Answer', 'Switched Off', 'Send WhatsApp'], color: '#8B93A3' },
            { label: 'Not Interested / Qualified', results: ['Not Interested', 'Not Qualified'],            color: '#C9714F' },
            { label: 'Interest Resale / Separate', results: ['Interest in Resale', 'Interest in Separate'], color: '#9B7EBD' },
          ];
          const monthClients = clients.filter((c) => c.created_at >= monthStart);
          const total = monthClients.filter((c) => c.call_result).length || 1;
          return (
            <div className="space-y-3">
              {groups.map((g) => {
                const count = monthClients.filter((c) => g.results.includes(c.call_result)).length;
                return (
                  <div key={g.label} className="flex items-center gap-3">
                    <div className="w-44 text-xs shrink-0" style={{ color: C.muted }}>{g.label}</div>
                    <MiniBar value={count} max={total} color={g.color} />
                    <span className="text-xs w-8 text-right shrink-0" style={{ color: C.muted }}>{pct(count, total)}%</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ─── Lead Sources Report ──────────────────────────────────────────────────────

function LeadsReport({ profiles, clients }) {
  return (
    <div className="space-y-5">
      <Card title="New Leads vs Rotated — All Time" icon={Users}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs" style={{ color: C.muted }}>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3 text-center">Total Clients</th>
                <th className="py-2 pr-3 text-center">New Leads</th>
                <th className="py-2 pr-3 text-center">Rotated In</th>
                <th className="py-2 text-center">% Rotated</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const myClients  = clients.filter((c) => c.owner_id === p.id);
                const total      = myClients.length;
                const rotated    = myClients.filter((c) => c.previous_owners && c.previous_owners.length > 0).length;
                const fresh      = total - rotated;
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="py-2 pr-3 font-medium">{p.full_name || p.username || '—'}</td>
                    <td className="py-2 pr-3 text-center">{total}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: C.gold }}>{fresh}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: '#9B7EBD' }}>{rotated}</td>
                    <td className="py-2 text-center" style={{ color: C.muted }}>{pct(rotated, total)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── This month's new leads split ── */}
      <Card title={`New vs Rotated — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`} icon={Calendar}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs" style={{ color: C.muted }}>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3 text-center">Added This Month</th>
                <th className="py-2 pr-3 text-center">New Leads</th>
                <th className="py-2 pr-3 text-center">Rotated In</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const monthStart = startOfMonth();
                const myMonth   = clients.filter((c) => c.owner_id === p.id && c.created_at >= monthStart);
                const rotated   = myMonth.filter((c) => c.previous_owners && c.previous_owners.length > 0).length;
                const fresh     = myMonth.length - rotated;
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="py-2 pr-3 font-medium">{p.full_name || p.username || '—'}</td>
                    <td className="py-2 pr-3 text-center">{myMonth.length}</td>
                    <td className="py-2 pr-3 text-center" style={{ color: C.gold }}>{fresh}</td>
                    <td className="py-2 text-center" style={{ color: '#9B7EBD' }}>{rotated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
