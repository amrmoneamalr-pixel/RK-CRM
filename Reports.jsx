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
  const compact = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
    return n.toLocaleString('en-US');
  };
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
              <th className="py-2">Deals (Count)</th>
              <th className="py-2">Sales / Target (EGP)</th>
              <th className="py-2">Progress</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const myClients = clients.filter((c) => c.owner_id === p.id);
              const active = myClients.filter((c) => c.stage !== 'won' && c.stage !== 'lost').length;
              const wonThisMonth = myClients.filter((c) => c.stage === 'won' && c.closed_at?.startsWith(mk));
              const dealsCount = wonThisMonth.length;
              const salesValue = wonThisMonth.reduce((sum, c) => sum + Number(c.deal_value || 0), 0);
              const target = targets.find((t) => t.owner_id === p.id);
              const dealsTarget = Number(target?.deals_target || 0);
              const pct = dealsTarget > 0 ? Math.round((salesValue / dealsTarget) * 100) : 0;
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="py-2 font-medium pl-2">{p.full_name || '—'}</td>
                  <td className="py-2" style={{ color: C.gold }}>{active}</td>
                  <td className="py-2">{dealsCount}</td>
                  <td className="py-2">{compact(salesValue)} / {compact(dealsTarget) || '—'}</td>
                  <td className="py-2" style={{ color: pct >= 100 ? '#7FA887' : pct >= 50 ? C.gold : C.muted }}>
                    {dealsTarget ? `${pct}%` : '—'}
                  </td>
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
  const compact = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
    return n.toLocaleString('en-US');
  };
  return (
    <div className="space-y-3">
      {profiles.map((p) => {
        const myClients = clients.filter((c) => c.owner_id === p.id);
        const wonThisMonth = myClients.filter((c) => c.stage === 'won' && c.closed_at?.startsWith(mk));
        const dealsCount = wonThisMonth.length;
        const salesValue = wonThisMonth.reduce((sum, c) => sum + Number(c.deal_value || 0), 0);
        const target = targets.find((t) => t.owner_id === p.id);
        const dt = Number(target?.deals_target || 0);
        const dp = dt ? Math.min(100, Math.round((salesValue / dt) * 100)) : 0;
        return (
          <div key={p.id} className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <p className="font-display font-bold text-sm mb-3">{p.full_name || p.username}</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: C.muted }}>
                  <span>Sales Value (EGP)</span>
                  <span>{compact(salesValue)} / {compact(dt) || '—'} {dt ? `(${dp}%)` : ''}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.bg }}>
                  <div className="h-full rounded-full" style={{ width: `${dp}%`, backgroundColor: dp >= 100 ? '#7FA887' : C.gold }} />
                </div>
              </div>
              <div className="text-xs" style={{ color: C.muted }}>
                Deals closed this month: <span style={{ color: C.text }}>{dealsCount}</span>
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
    const [{ data: p }, { data: c }, { data: a }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, title, is_pool, monthly_target').eq('is_pool', false).not('title', 'in', '("top_management","operation","marketing")'),
      supabase.from('clients').select('id, owner_id, stage, closed_at, deal_value, next_follow_up, call_result, last_contacted_at'),
      supabase.from('activities').select('id, owner_id, type, date'),
    ]);
    // sort: title order, then name
    const sortedProfiles = [...(p || [])].sort(sortByTitleThenName);
    setProfiles(sortedProfiles);
    setAllClients(c || []);
    setActivities(a || []);
    // Build targets array from profiles for backward compatibility
    setTargets(sortedProfiles.map(prof => ({
      owner_id: prof.id,
      deals_target: prof.monthly_target || 0,
      meetings_target: 0,
    })));
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
