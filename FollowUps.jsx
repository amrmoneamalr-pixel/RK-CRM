import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, stageOf, fmtDate, todayStr } from './constants';
import { Clock } from 'lucide-react';
import ClientModal from './ClientModal';

export default function FollowUps({ userId }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clients').select('*').eq('owner_id', userId)
      .not('next_follow_up', 'is', null).order('next_follow_up');
    setClients((data || []).filter((c) => c.stage !== 'won' && c.stage !== 'lost'));
    setLoading(false);
  };

  if (loading) return <p style={{ color: C.muted }} className="text-sm">Loading...</p>;

  const today = todayStr();
  const overdue = clients.filter((c) => c.next_follow_up < today);
  const dueToday = clients.filter((c) => c.next_follow_up === today);
  const upcoming = clients.filter((c) => c.next_follow_up > today);

  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock size={32} className="mx-auto mb-3" style={{ color: C.muted }} />
        <p className="font-display font-bold mb-1">No follow-ups scheduled</p>
        <p className="text-sm" style={{ color: C.muted }}>Open any client and set a "Next Follow-up Date" to see it here</p>
      </div>
    );
  }

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
      <Section title="Overdue" items={overdue} color="#C9714F" />
      <Section title="Today" items={dueToday} color={C.gold} />
      <Section title="Upcoming" items={upcoming} color="#6E8CAE" />
      {selected && <ClientModal mode="detail" userId={userId} client={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}
