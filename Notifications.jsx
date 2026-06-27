import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import {
  Bell, X, Check, Sparkles, Archive, Snowflake, PhoneCall,
  RotateCw, AlertTriangle, Clock, Inbox
} from 'lucide-react';

// Map a notification.category -> sidebar tab key + icon + color
const CATEGORY_META = {
  newFresh:       { tab: 'newFresh',     icon: Sparkles,      color: '#7FA887' },
  oldFresh:       { tab: 'oldFresh',     icon: Archive,       color: '#9B7EBD' },
  cold:           { tab: 'cold',         icon: Snowflake,     color: '#8B93A3' },
  reRotation:     { tab: 'reRotation',   icon: RotateCw,      color: '#E0A458' },
  callbackToday:  { tab: 'callbackToday',icon: PhoneCall,     color: '#6E8CAE' },
  adminLateFresh: { tab: 'late',         icon: AlertTriangle, color: '#C9714F' },
  adminNoAction:  { tab: 'newFresh',     icon: Clock,         color: '#C9714F' },
};

function fmtAgo(iso) {
  const d = new Date(iso);
  const diffSec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function Notifications({ userId, onSelectCategory }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  // Initial unread count
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);
        if (!cancelled) setUnread(count || 0);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('notifications_realtime_' + userId)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setUnread((u) => u + 1);
          setItems((prev) => {
            if (prev.some(n => n.id === payload.new.id)) return prev;
            return [payload.new, ...prev].slice(0, 50);
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Click outside to close
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadList = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('id, category, client_id, title, body, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setItems(data || []);
    } catch (e) {}
    setLoading(false);
  };

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadList();
  };

  const markOneRead = async (id) => {
    setItems((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('is_read', false);
    } catch (e) {}
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await supabase.from('notifications').update({ is_read: true })
        .eq('user_id', userId).eq('is_read', false);
    } catch (e) {}
  };

  const handleClickItem = (n) => {
    if (!n.is_read) markOneRead(n.id);
    const meta = CATEGORY_META[n.category];
    if (meta && onSelectCategory) onSelectCategory(meta.tab);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button onClick={toggleOpen}
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 relative"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: unread > 0 ? C.gold : C.muted }}
        title="Notifications">
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ backgroundColor: '#D6453E', color: '#fff' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 rounded-xl shadow-2xl flex flex-col"
          style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            width: 340,
            maxHeight: 460,
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 shrink-0"
            style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: C.gold }} />
              <span className="text-sm font-bold" style={{ color: C.text }}>Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: `${C.gold}22`, color: C.gold }}>{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {items.some(n => !n.is_read) && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded"
                  style={{ color: C.muted }}
                  title="Mark all as read">
                  <Check size={12} /> Mark all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded" style={{ color: C.muted }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
            {loading ? (
              <div className="text-center text-xs py-6" style={{ color: C.muted }}>Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8" style={{ color: C.muted }}>
                <Inbox size={24} className="mx-auto mb-2 opacity-60" />
                <div className="text-xs">No notifications yet</div>
              </div>
            ) : (
              items.map((n) => {
                const meta = CATEGORY_META[n.category] || { icon: Bell, color: C.muted };
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors"
                    style={{
                      backgroundColor: n.is_read ? 'transparent' : `${C.gold}0E`,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <div className="flex items-center justify-center rounded-full shrink-0 mt-0.5"
                      style={{ width: 28, height: 28, backgroundColor: `${meta.color}22`, color: meta.color }}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate" style={{ color: C.text }}>{n.title}</span>
                        {!n.is_read && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#D6453E' }} />
                        )}
                      </div>
                      {n.body && (
                        <div className="text-xs truncate mt-0.5" style={{ color: C.muted }}>{n.body}</div>
                      )}
                      <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{fmtAgo(n.created_at)}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
