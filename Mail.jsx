import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDateTime } from './constants';
import { Mail, Send, Inbox, FileText, Plus, ChevronLeft, Search, Check } from 'lucide-react';

export default function MailPage({ userId }) {
  const [view, setView] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Compose
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');

  useEffect(() => { loadProfiles(); }, []);
  useEffect(() => { if (view !== 'compose') load(); }, [view]);

  const loadProfiles = async () => {
    // Load ALL users regardless of title
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, title')
      .eq('is_pool', false)
      .order('full_name');
    setProfiles((data || []).filter(p => p.id !== userId));
  };

  const load = async () => {
    setLoading(true);
    try {
      if (view === 'inbox') {
        const { data: recData } = await supabase
          .from('message_recipients')
          .select('id, is_read, created_at, message_id')
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false });

        if (!recData || recData.length === 0) {
          setMessages([]); setUnreadCount(0); setLoading(false); return;
        }

        const msgIds = recData.map(r => r.message_id);
        const { data: msgData } = await supabase
          .from('messages')
          .select('id, subject, body, created_at, sender_id, is_draft')
          .in('id', msgIds)
          .eq('is_draft', false);

        const senderIds = [...new Set((msgData || []).map(m => m.sender_id).filter(Boolean))];
        let profileMap = {};
        if (senderIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, username')
            .in('id', senderIds);
          (profileData || []).forEach(p => { profileMap[p.id] = p; });
        }

        const msgMap = {};
        (msgData || []).forEach(m => {
          msgMap[m.id] = { ...m, sender: profileMap[m.sender_id] || null };
        });

        const combined = recData
          .filter(r => msgMap[r.message_id])
          .map(r => ({ ...r, messages: msgMap[r.message_id] }));

        setMessages(combined);
        setUnreadCount(combined.filter(d => !d.is_read).length);

      } else if (view === 'sent') {
        const { data: msgData } = await supabase
          .from('messages')
          .select('id, subject, body, created_at, sender_id, is_draft')
          .eq('sender_id', userId)
          .eq('is_draft', false)
          .order('created_at', { ascending: false });

        const msgIds = (msgData || []).map(m => m.id);
        let recMap = {};
        if (msgIds.length > 0) {
          const { data: recData } = await supabase
            .from('message_recipients')
            .select('message_id, recipient_id')
            .in('message_id', msgIds);
          const recIds = [...new Set((recData || []).map(r => r.recipient_id))];
          let profMap = {};
          if (recIds.length > 0) {
            const { data: profData } = await supabase
              .from('profiles').select('id, full_name, username').in('id', recIds);
            (profData || []).forEach(p => { profMap[p.id] = p; });
          }
          (recData || []).forEach(r => {
            if (!recMap[r.message_id]) recMap[r.message_id] = [];
            recMap[r.message_id].push(profMap[r.recipient_id]);
          });
        }
        setMessages((msgData || []).map(m => ({ ...m, recipientProfiles: recMap[m.id] || [] })));

      } else if (view === 'drafts') {
        const { data } = await supabase
          .from('messages')
          .select('id, subject, body, created_at, is_draft')
          .eq('sender_id', userId)
          .eq('is_draft', true)
          .order('created_at', { ascending: false });
        setMessages(data || []);
      }
    } catch (e) {
      console.warn('Mail load error:', e);
      setMessages([]);
    }
    setLoading(false);
  };

  const openMessage = async (msg) => {
    setSelected(msg);
    setView('read');
    if (!msg.is_read && msg.id) {
      await supabase.from('message_recipients').update({ is_read: true }).eq('id', msg.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const sendMessage = async (isDraft = false) => {
    if (!subject.trim() || !body.trim()) return;
    if (!isDraft && recipients.length === 0) return;
    setSending(true);
    const { data: msg } = await supabase.from('messages').insert({
      sender_id: userId, subject: subject.trim(), body: body.trim(), is_draft: isDraft,
    }).select().single();
    if (msg && recipients.length > 0) {
      await supabase.from('message_recipients').insert(
        recipients.map(r => ({ message_id: msg.id, recipient_id: r }))
      );
    }
    setSending(false);
    setSubject(''); setBody(''); setRecipients([]); setRecipientSearch('');
    setView(isDraft ? 'drafts' : 'sent');
  };

  const toggleRecipient = (id) => {
    setRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const selectAll = () => {
    const filtered = profiles.filter(p =>
      !recipientSearch || (p.full_name || p.username || '').toLowerCase().includes(recipientSearch.toLowerCase())
    );
    const allIds = filtered.map(p => p.id);
    const allSelected = allIds.every(id => recipients.includes(id));
    if (allSelected) setRecipients(prev => prev.filter(id => !allIds.includes(id)));
    else setRecipients(prev => [...new Set([...prev, ...allIds])]);
  };

  const filteredProfiles = profiles.filter(p =>
    !recipientSearch || (p.full_name || p.username || '').toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const deleteMessage = async () => {
    if (!selected) return;
    if (selected.messages) await supabase.from('message_recipients').delete().eq('id', selected.id);
    else await supabase.from('messages').delete().eq('id', selected.id);
    setView(selected.messages ? 'inbox' : 'sent');
    setSelected(null);
    load();
  };

  const sidebarItems = [
    { key: 'compose', icon: Plus, label: 'Compose' },
    { key: 'inbox', icon: Inbox, label: 'Inbox', badge: unreadCount },
    { key: 'sent', icon: Send, label: 'Sent' },
    { key: 'drafts', icon: FileText, label: 'Drafts' },
  ];

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* Sidebar */}
      <div className="w-44 shrink-0 space-y-1">
        {sidebarItems.map(({ key, icon: Icon, label, badge }) => (
          <button key={key} onClick={() => setView(key)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: view === key ? C.gold : C.surface, color: view === key ? '#14181F' : C.muted, border: `1px solid ${view === key ? C.gold : C.border}` }}>
            <div className="flex items-center gap-2"><Icon size={14} />{label}</div>
            {badge > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#D6453E', color: '#fff' }}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>

        {/* Compose */}
        {view === 'compose' && (
          <div className="p-5 space-y-4">
            <h3 className="font-bold text-base">New Message</h3>

            {/* Recipients box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: C.muted }}>
                  To: {recipients.length > 0 ? <span style={{ color: C.gold }}>{recipients.length} selected</span> : 'Select recipients'}
                </span>
                <button onClick={selectAll} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                  {filteredProfiles.every(p => recipients.includes(p.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="relative" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                  <input value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-8 pr-3 py-2 text-xs outline-none"
                    style={{ backgroundColor: C.bg, color: C.text }} />
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: C.bg }}>
                  {filteredProfiles.map(p => {
                    const isSelected = recipients.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => toggleRecipient(p.id)}
                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: isSelected ? `${C.gold}15` : 'transparent', borderBottom: `1px solid ${C.border}33` }}>
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isSelected ? C.gold : C.surface, border: `1px solid ${isSelected ? C.gold : C.border}` }}>
                          {isSelected && <Check size={10} color="#14181F" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: C.text }}>{p.full_name || p.username}</p>
                          {p.title && <p className="text-[10px] truncate" style={{ color: C.muted }}>{p.title}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }} />

            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..."
              rows={7} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }} />

            <div className="flex gap-2">
              <button onClick={() => sendMessage(false)}
                disabled={!subject.trim() || !body.trim() || recipients.length === 0 || sending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40"
                style={{ backgroundColor: C.gold, color: '#14181F' }}>
                <Send size={14} /> {sending ? 'Sending...' : 'Send'}
              </button>
              <button onClick={() => sendMessage(true)}
                disabled={!subject.trim() || !body.trim() || sending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
                <FileText size={14} /> Save Draft
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        {(view === 'inbox' || view === 'sent' || view === 'drafts') && (
          <div>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: C.border }}>
              <h3 className="font-bold text-sm capitalize">{view}</h3>
              {loading && <span className="text-xs" style={{ color: C.muted }}>Loading...</span>}
            </div>
            {messages.length === 0 && !loading ? (
              <div className="text-center py-16">
                <Mail size={28} className="mx-auto mb-2" style={{ color: C.muted }} />
                <p className="text-sm" style={{ color: C.muted }}>No messages</p>
              </div>
            ) : messages.map((msg) => {
              const m = view === 'inbox' ? msg.messages : msg;
              const isUnread = view === 'inbox' && !msg.is_read;
              const senderName = view === 'inbox'
                ? (m?.sender?.full_name || m?.sender?.username || '—')
                : 'Me';
              const toNames = view === 'sent'
                ? (msg.recipientProfiles || []).map(p => p?.full_name || p?.username).filter(Boolean).join(', ')
                : '';
              return (
                <div key={msg.id} onClick={() => openMessage(msg)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b hover:opacity-80"
                  style={{ borderColor: C.border, backgroundColor: isUnread ? `${C.gold}11` : 'transparent' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'}`} style={{ color: C.text }}>
                        {view === 'inbox' ? `From: ${senderName}` : view === 'sent' ? `To: ${toNames || '—'}` : 'Draft'}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: C.muted }}>{fmtDateTime(m?.created_at)}</span>
                    </div>
                    <p className={`text-xs truncate ${isUnread ? 'font-semibold' : ''}`} style={{ color: isUnread ? C.text : C.muted }}>{m?.subject}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: C.muted }}>{m?.body?.slice(0, 80)}</p>
                  </div>
                  {isUnread && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: C.gold }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Read message */}
        {view === 'read' && selected && (() => {
          const m = selected.messages || selected;
          const sender = m?.sender;
          return (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => { setView(selected.messages ? 'inbox' : 'sent'); load(); }}
                  className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={deleteMessage} className="text-xs" style={{ color: '#C9714F' }}>Delete</button>
              </div>
              <h3 className="font-bold text-base">{m?.subject}</h3>
              <p className="text-xs" style={{ color: C.muted }}>
                From: <span style={{ color: C.text }}>{sender?.full_name || sender?.username || 'Me'}</span>
                {' · '}{fmtDateTime(m?.created_at)}
              </p>
              <div className="rounded-lg p-4 text-sm whitespace-pre-wrap" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text, lineHeight: 1.7 }}>
                {m?.body}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
