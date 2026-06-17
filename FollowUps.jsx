import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, stageOf, fmtDate, todayStr, COLD_RESULTS } from './constants';
import { Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ClientModal from './ClientModal';

function FollowUpChart({ title, data, color }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <h3 className="font-display font-bold text-sm mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
          <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: C.muted, fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}
            labelStyle={{ color: C.text, fontWeight: 'bold' }}
            itemStyle={{ color: color }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function FollowUps({ userId, isAdmin, hasTeamAccess }) {
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, [userId, hasTeamAccess]);

  const load = async () => {
    setLoading(true);
    // Own follow-ups
    const { data: own } = await supabase
      .from('clients').select('*').eq('owner_id', userId)
      .not('next_follow_up', 'is', null).order('next_follow_up');
    setClients((own || []).filter((c) => c.stage !== 'won' && c.stage !== 'lost'));

    // Charts data (team access only)
    if (hasTeamAccess) {
      const today = todayStr();
      const [{ data: allC }, { data: profs }] = await Promise.all([
        supabase.from('clients').select('owner_id, next_follow_up, call_result, last_contacted_at').not('next_follow_up', 'is', null),
        supabase.from('profiles').select('id, full_name, username, title, is_pool').neq('title', 'top_management').neq('title', 'operation').neq('title', 'marketing').eq('is_pool', false),
      ]);
      setAllClients(allC || []);
      setProfiles(profs || []);
    }
    setLoading(false);
  };

  const today = todayStr();

  // Build chart data
  const todayFollowups = profiles.map((p) => ({
    name: p.full_name || p.username,
    count: allClients.filter((c) => c.owner_id === p.id && c.next_follow_up === today).length,
  })).filter((d) => d.count > 0);

  const activeCalls = profiles.map((p) => ({
    name: p.full_name || p.username,
    count: allClients.filter((c) => c.owner_id === p.id && COLD_RESULTS.includes(c.call_result) && c.last_contacted_at?.slice(0, 10) === today).length,
  })).filter((d) => d.count > 0);

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const overdue = clients.filter((c) => c.next_follow_up < today);
  const dueToday = clients.filter((c) => c.next_follow_up === today);
  const upcoming = clients.filter((c) => c.next_follow_up > today);

  const Section = ({ title, items, color }) =>
    items.length > 0 && (
      <div>
        <h2 className="font-display font-bold text-sm mb-2" style={{ color }}>{title} ({items.length})</h2>
        <div className="space-y-2">
          {items.map((c) => {
            const st = stageOf(c.stage);
            return (
              <button key={c.id} onClick={() => setSelected(c)}
                className="w-full flex items-center justify-between p-3 rounded-lg text-left"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div>
                  <div className="font-bold text-sm">{c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>{c.project || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium" style={{ color }}>{fmtDate(c.next_follow_up)}</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${st.color}22`, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Charts for team access */}
      {hasTeamAccess && (
        <div className="space-y-4">
          <FollowUpChart title="Today's Follow-ups per Rep" data={todayFollowups} color="#6E8CAE" />
          <FollowUpChart title="Active Calls Today per Rep" data={activeCalls} color={C.gold} />
        </div>
      )}

      {/* Own follow-ups */}
      {clients.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={32} className="mx-auto mb-3" style={{ color: C.muted }} />
          <p className="font-display font-bold mb-1">No follow-ups scheduled</p>
          <p className="text-sm" style={{ color: C.muted }}>Open any client and set a "Next Follow-up Date" to see it here</p>
        </div>
      ) : (
        <>
          <Section title="Overdue" items={overdue} color="#C9714F" />
          <Section title="Today" items={dueToday} color={C.gold} />
          <Section title="Upcoming" items={upcoming} color="#6E8CAE" />
        </>
      )}

      {selected && <ClientModal mode="detail" userId={userId} client={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}
