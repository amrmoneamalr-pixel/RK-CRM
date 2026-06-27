import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, monthKey, fmtDate, todayStr, COLD_RESULTS } from './constants';
import { Briefcase, TrendingUp, Target, ChevronLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const TITLE_ORDER = ['top_management','sales_manager','team_leader','sales','marketing','operation'];
const sortByTitleThenName = (a, b) =>
  (TITLE_ORDER.indexOf(a.title) - TITLE_ORDER.indexOf(b.title)) ||
  (a.full_name || '').localeCompare(b.full_name || '');

// ── sub-tabs ──────────────────────────────────────────────────
const TABS = [
  { id: 'followup', label: 'Follow-up Charts', icon: TrendingUp },
  { id: 'team', label: 'Team Reports', icon: Briefcase },
  { id: 'target', label: 'Monthly Targets', icon: Target },
];

function Chart({ title, data, color }) {
  if (!data || data.length === 0) return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <h3 className="font-display font-bold text-sm mb-2">{title}</h3>
      <p className="text-xs" style={{ color: C.muted }}>No data for today.</p>
    </div>
  );
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <h3 className="font-display font-bold text-sm mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 50 }}>
          <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: C.muted, fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }} labelStyle={{ color: C.text, fontWeight: 'bold' }} itemStyle={{ color: color }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="count" position="top" style={{ fill: C.text, fontSize: 11, fontWeight: 'bold' }} />
            {data.map((_, i) => <Cell key={i} fill={color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FollowUpTab({ profiles, allClients }) {
  const today = todayStr();
  const todayFU = profiles.map((p) => ({ name: p.full_name || p.username, count: allClients.filter((c) => c.owner_id === p.id && c.next_follow_up === today).length })).filter((d) => d.count > 0);
  const activeCalls = profiles.map((p) => ({ name: p.full_name || p.username, count: allClients.filter((c) => c.owner_id === p.id && COLD_RESULTS.includes(c.call_result) && c.last_contacted_at?.slice(0,10) === today).length })).filter((d) => d.count > 0);
  return (
    <div className="space-y-4">
      <Chart title="Today's Follow-ups per Rep" data={todayFU} color="#6E8CAE" />
      <Chart title="Active Calls Today per Rep" data={activeCalls} color={C.gold} />
    </div>
  );
}

function TeamTab({ profiles, clients, activities, targets }) {
  const funnelTotal = STAGES.map((s) => ({ ...s, count: clients.filter((c) => c.stage === s.id).length }));
  const funnelMax = Math.max(1, ...funnelTotal.map((f) => f.count));
  const mk = monthKey();
  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-display font-bold text-sm mb-4">Team Sales Funnel</h3>
        <div className="space-y-2.5">
          {funnelTotal.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-28 text-xs shrink-0" style={{ color: C.muted }}>{s.label}</div>
              <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: C.bg }}>
                <div className="h-full rounded-md flex items-center justify-end px-2" style={{ width: `${Math.max(6, (s.count / funnelMax) * 100)}%`, backgroundColor: s.color }}>
                  {s.count > 0 && <span className="text-[11px] font-bold" style={{ color: '#14181F' }}>{s.count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4 overflow-x-auto" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h3 className="font-display font-bold text-sm mb-4">Sales Performance — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: C.muted }} className="text-left text-xs">
              <th className="py-2 pl-2">Name</th>
              <th className="py-2">Active Clients</th>
              <th className="py-2">Meetings</th>
              <th className="py-2">Deals / Target</th>
              <th className="py-2">Progress</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const myClients = clients.filter((c) => c.owner_id === p.id);
              const active = myClients.filter((c) => c.stage !== 'won' && c.stage !== 'lost').length;
              const meetings = activities.filter((a) => a.owner_id === p.id && a.type === 'meeting' && a.date?.startsWith(mk)).length;
              const deals = myClients.filter((c) => c.stage === 'won' && c.closed_at?.startsWith(mk)).length;
              const target = targets.find((t) => t.owner_id === p.id);
              const dealsTarget = target?.deals_target || 0;
              const meetingsTarget = target?.meetings_target || 0;
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="py-2 font-medium pl-2">{p.full_name || '—'}</td>
                  <td className="py-2" style={{ color: C.gold }}>{active}</td>
                  <td className="py-2">{meetings} / {meetingsTarget || '—'}</td>
                  <td className="py-2">{deals} / {dealsTarget || '—'}</td>
                  <td className="py-2" style={{ color: C.muted }}>{dealsTarget ? `${Math.round((deals / dealsTarget) * 100)}%` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TargetTab({ profiles, clients, activities, targets }) {
  const mk = monthKey();
  return (
    <div className="space-y-3">
      {profiles.map((p) => {
        const myClients = clients.filter((c) => c.owner_id === p.id);
        const deals = myClients.filter((c) => c.stage === 'won' && c.closed_at?.startsWith(mk)).length;
        const meetings = activities.filter((a) => a.owner_id === p.id && a.type === 'meeting' && a.date?.startsWith(mk)).length;
        const target = targets.find((t) => t.owner_id === p.id);
        const dt = target?.deals_target || 0;
        const mt = target?.meetings_target || 0;
        const dp = dt ? Math.min(100, Math.round((deals / dt) * 100)) : 0;
        const mp = mt ? Math.min(100, Math.round((meetings / mt) * 100)) : 0;
        return (
          <div key={p.id} className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <p className="font-display font-bold text-sm mb-3">{p.full_name || p.username}</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: C.muted }}>
                  <span>Deals</span><span>{deals} / {dt || '—'} {dt ? `(${dp}%)` : ''}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.bg }}>
                  <div className="h-full rounded-full" style={{ width: `${dp}%`, backgroundColor: '#7FA887' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: C.muted }}>
                  <span>Meetings</span><span>{meetings} / {mt || '—'} {mt ? `(${mp}%)` : ''}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.bg }}>
                  <div className="h-full rounded-full" style={{ width: `${mp}%`, backgroundColor: C.gold }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('followup');
  const [profiles, setProfiles] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const mk = monthKey();
    const [{ data: p }, { data: c }, { data: a }, { data: t }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, title, is_pool').eq('is_pool', false).not('title', 'in', '("top_management","operation","marketing")'),
      supabase.from('clients').select('id, owner_id, stage, closed_at, next_follow_up, call_result, last_contacted_at'),
      supabase.from('activities').select('id, owner_id, type, date'),
      supabase.from('targets').select('*').eq('month', mk),
    ]);
    // sort: title order, then name (within the included titles: sales_manager > team_leader > sales)
    const sortedProfiles = [...(p || [])].sort(sortByTitleThenName);
    setProfiles(sortedProfiles);
    setAllClients(c || []);
    setActivities(a || []);
    setTargets(t || []);
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
            style={{ backgroundColor: activeTab === id ? C.gold : C.surface, color: activeTab === id ? '#14181F' : C.muted, border: `1px solid ${activeTab === id ? C.gold : C.border}` }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
      {activeTab === 'followup' && <FollowUpTab profiles={profiles} allClients={allClients} />}
      {activeTab === 'team' && <TeamTab profiles={profiles} clients={allClients} activities={activities} targets={targets} />}
      {activeTab === 'target' && <TargetTab profiles={profiles} clients={allClients} activities={activities} targets={targets} />}
    </div>
  );
}
