import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Send, MessageCircle } from 'lucide-react';

export default function TeamChat({ profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // Load messages on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('team_chat')
          .select('id, message, created_at, user_id, profiles(full_name, role)')
          .order('created_at', { ascending: true })
          .limit(200);
        if (mounted) {
          setMessages(data || []);
          setLoading(false);
        }
      } catch (e) {
        console.warn('team_chat load failed:', e);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Subscribe to realtime new messages
  useEffect(() => {
    const channel = supabase
      .channel('team_chat_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_chat' },
        async (payload) => {
          // Fetch profile data for the new message
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', payload.new.user_id)
            .single();
          setMessages((prev) => {
            // Avoid duplicates if already added optimistically
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, profiles: prof }];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await supabase.from('team_chat').insert({
        user_id: profile.id,
        message: text,
      });
    } catch (e) {
      console.warn('Failed to send message:', e);
      setInput(text); // Restore on error
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return null;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Group messages by sender (consecutive)
  const groupedMessages = [];
  let lastUserId = null;
  let lastDateKey = null;
  messages.forEach((m) => {
    const dateKey = new Date(m.created_at).toDateString();
    if (dateKey !== lastDateKey) {
      groupedMessages.push({ type: 'date', date: m.created_at, key: 'd-' + dateKey });
      lastDateKey = dateKey;
      lastUserId = null;
    }
    const isOwn = m.user_id === profile.id;
    const showName = m.user_id !== lastUserId;
    groupedMessages.push({ type: 'msg', msg: m, isOwn, showName });
    lastUserId = m.user_id;
  });

  return (
    <div className="flex flex-col" style={{ height: '100%', borderTop: `1px solid ${C.border}`, backgroundColor: C.surface }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        <MessageCircle size={14} style={{ color: C.gold }} />
        <span className="text-xs font-bold" style={{ color: C.text }}>Team Chat</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="text-center text-xs py-4" style={{ color: C.muted }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs py-4" style={{ color: C.muted }}>No messages yet. Say hi 👋</div>
        ) : (
          groupedMessages.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="flex items-center justify-center my-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: C.bg, color: C.muted }}>
                    {fmtDate(item.date) || 'Today'}
                  </span>
                </div>
              );
            }
            const m = item.msg;
            return (
              <div key={m.id} className={`flex ${item.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  {item.showName && !item.isOwn && (
                    <div className="text-[10px] px-2 mb-0.5" style={{ color: C.gold }}>
                      {m.profiles?.full_name || 'Unknown'}
                    </div>
                  )}
                  <div
                    className="px-2.5 py-1.5 rounded-lg text-xs"
                    style={{
                      backgroundColor: item.isOwn ? C.gold : C.bg,
                      color: item.isOwn ? '#14181F' : C.text,
                      borderTopLeftRadius: !item.isOwn && !item.showName ? '4px' : undefined,
                      borderTopRightRadius: item.isOwn && !item.showName ? '4px' : undefined,
                    }}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.message}</div>
                    <div className="text-[9px] mt-0.5 opacity-70 text-right">{fmtTime(m.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1.5 p-2 shrink-0" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40"
          style={{ backgroundColor: C.gold, color: '#14181F' }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
