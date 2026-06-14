import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, STAGES, fmtMoney, fmtDate, todayStr } from './constants';
import { Plus, Search, ChevronUp, ChevronDown, Users } from 'lucide-react';
import ClientModal from './ClientModal';

export default function ClientsBoard({ userId }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const moveStage = async (id, stage) => {
    const patch = { stage };
    const client = clients.find((c) => c.id === id);
    if (stage === 'won' && client && !client.closed_at) patch.closed_at = todayStr();
    await supabase.from('clients').update(patch).eq('id', id);
    load();
  };

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.project || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  if (loading) return <p style={{ color: C.muted }} className="text-sm">جاري التحميل...</p>;

  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <Users size={32} className="mx-auto mb-3" style={{ color: C.muted }} />
        <p className="font-display font-bold mb-1">لسه معندك عملاء</p>
        <p className="text-sm mb-4" style={{ color: C.muted }}>دوس "عميل جديد" عشان تبدأ تتابع أول عميل</p>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: C.gold, color: '#14181F' }}>
          + عميل جديد
        </button>
        {showAdd && <ClientModal mode="add" userId={userId} onClose={() => setShowAdd(false)} onSaved={load} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم، المشروع أو رقم التليفون..."
          className="rounded-lg px-3 py-2 text-sm outline-none w-full"
          style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text, paddingRight: '2.25rem' }}
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STAGES.map((stage) => {
          const stageClients = filtered.filter((c) => c.stage === stage.id);
          return (
            <div key={stage.id} className="shrink-0 w-64 sm:w-auto sm:flex-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</span>
                <span className="text-xs" style={{ color: C.muted }}>{stageClients.length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {stageClients.map((c) => (
                  <ClientCard key={c.id} client={c} onOpen={() => setSelected(c)} onMoveStage={moveStage} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-5 left-5 z-20 flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm shadow-lg"
        style={{ backgroundColor: C.gold, color: '#14181F' }}
      >
        <Plus size={18} /> عميل جديد
      </button>

      {showAdd && <ClientModal mode="add" userId={userId} onClose={() => setShowAdd(false)} onSaved={load} />}
      {selected && <ClientModal mode="detail" userId={userId} client={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </div>
  );
}

function ClientCard({ client, onOpen, onMoveStage }) {
  const idx = STAGES.findIndex((s) => s.id === client.stage);
  const stage = STAGES[idx];
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <button onClick={onOpen} className="w-full text-right">
        <div className="font-bold text-sm mb-1">{client.name}</div>
        {client.project && <div className="text-xs mb-1" style={{ color: C.muted }}>{client.project}</div>}
        <div className="flex items-center gap-2 flex-wrap">
          {client.budget ? <span className="text-xs" style={{ color: C.gold }}>{fmtMoney(client.budget)} ج.م</span> : null}
          {client.next_follow_up && (
            <span className="text-[11px]" style={{ color: client.next_follow_up < todayStr() ? '#C9714F' : C.muted }}>
              متابعة: {fmtDate(client.next_follow_up)}
            </span>
          )}
        </div>
      </button>
      <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <button
          disabled={idx === 0}
          onClick={() => onMoveStage(client.id, STAGES[idx - 1].id)}
          className="flex-1 flex items-center justify-center py-1 rounded disabled:opacity-30"
          style={{ backgroundColor: C.bg }}
        >
          <ChevronUp size={14} style={{ color: C.muted, transform: 'rotate(-90deg)' }} />
        </button>
        <span className="text-[11px] px-2" style={{ color: stage.color }}>{stage.label}</span>
        <button
          disabled={idx === STAGES.length - 1}
          onClick={() => onMoveStage(client.id, STAGES[idx + 1].id)}
          className="flex-1 flex items-center justify-center py-1 rounded disabled:opacity-30"
          style={{ backgroundColor: C.bg }}
        >
          <ChevronDown size={14} style={{ color: C.muted, transform: 'rotate(-90deg)' }} />
        </button>
      </div>
    </div>
  );
}
