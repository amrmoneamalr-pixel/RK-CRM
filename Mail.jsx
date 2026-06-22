import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { C, fmtDateTime } from './constants';
import { Mail, Send, Inbox, FileText, Plus, ChevronLeft, Search, Check, Paperclip, X, ChevronDown } from 'lucide-react';

const TITLE_ORDER = { top_management: 0, sales_manager: 1, team_leader: 2, sales: 3, marketing: 4, operation: 5 };

function RecipientDropdown({ profiles, recipients, onToggle, onSelectAll }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = profiles
    .filter(p => !search || (p.full_name || p.username || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (TITLE_ORDER[a.title] ?? 99) - (TITLE_ORDER[b.title] ?? 99));

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => recipients.includes(p.id));
  const label = recipients.length === 0 ? 'Select recipients...' : `${recipients.length} recipient${recipients.length > 1 ? 's' : ''} selected`;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between outline-none"
        style={{ backgroundColor: C.bg, border: `1px solid ${recipients.length > 0 ? C.gold : C.border}`, color: recipients.length > 0 ? C.gold : C.muted }}>
        <span>{label}</span>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 rounded-xl shadow-xl w-full"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, maxHeight: 280, display: 'flex', flexDirection: 'column' }}>
          
          {/* Search */}
          <div className="p-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>

          {/* Select All */}
          <div onClick={() => onSelectAll(filtered.map(p => p.id), allFilteredSelected)}
            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs font-medium"
            style={{ borderBottom: `1px solid ${C.border}`, color: C.gold, backgroundColor: `${C.gold}11` }}>
            <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: allFilteredSelected ? C.gold : C.surface, border: `1px solid ${allFilteredSelected ? C.gold : C.border}` }}>
              {allFilteredSelected && <Check size={10} color="#14181F" />}
            </div>
            Select All {search ? '(filtered)' : ''}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filtered.map(p => {
              const isSelected = recipients.includes(p.id);
              return (
                <div key={p.id} onClick={() => onToggle(p.id)}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: isSelected ? `${C.gold}15` : 'transparent', borderBottom: `1px solid ${C.border}33` }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isSelected ? C.gold : C.surface, border: `1px solid ${isSelected ? C.gold : C.border}` }}>
                    {isSelected && <Check size={10} color="#14181F" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: C.text }}>{p.full_name || p.username}</p>
                    {p.title && <p className="text-[10px] truncate" style={{ color: C.muted }}>{p.title.replace('_', ' ')}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {recipients.length > 0 && (
            <div className="p-2 shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => { onSelectAll(profiles.map(p => p.id), true); }}
                className="w-full text-xs py-1 rounded-lg"
                style={{ backgroundColor: C.bg, color: C.muted }}>Clear selection</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MailPage({ userId }) {
  const [view, setView] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadProfiles(); }, []);
  useEffect(() => { if (view !== 'compose') load(); }, [view]);

  const loadProfiles = async () => {
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
          .select('id, subject, body, created_at, sender_id, is_draft, attachments')
          .in('id', msgIds).eq('is_draft', false);

        const senderIds = [...new Set((msgData || []).map(m => m.sender_id).filter(Boolean))];
        let profileMap = {};
        if (senderIds.length > 0) {
          const { data: pd } = await supabase.from('profiles').select('id, full_name, username').in('id', senderIds);
          (pd || []).forEach(p => { profileMap[p.id] = p; });
        }

        const msgMap = {};
        (msgData || []).forEach(m => { msgMap[m.id] = { ...m, sender: profileMap[m.sender_id] || null }; });

        const combined = recData.filter(r => msgMap[r.message_id]).map(r => ({ ...r, messages: msgMap[r.message_id] }));
        setMessages(combined);
        setUnreadCount(combined.filter(d => !d.is_read).length);

      } else if (view === 'sent') {
        const { data: msgData } = await supabase
          .from('messages').select('id, subject, body, created_at, sender_id, is_draft, attachments')
          .eq('sender_id', userId).eq('is_draft', false).order('created_at', { ascending: false });

        const msgIds = (msgData || []).map(m => m.id);
        let recMap = {};
        if (msgIds.length > 0) {
          const { data: recData } = await supabase.from('message_recipients').select('message_id, recipient_id').in('message_id', msgIds);
          const recIds = [...new Set((recData || []).map(r => r.recipient_id))];
          let profMap = {};
          if (recIds.length > 0) {
            const { data: pd } = await supabase.from('profiles').select('id, full_name, username').in('id', recIds);
            (pd || []).forEach(p => { profMap[p.id] = p; });
          }
          (recData || []).forEach(r => {
            if (!recMap[r.message_id]) recMap[r.message_id] = [];
            recMap[r.message_id].push(profMap[r.recipient_id]);
          });
        }
        setMessages((msgData || []).map(m => ({ ...m, recipientProfiles: recMap[m.id] || [] })));

      } else if (view === 'drafts') {
        const { data } = await supabase.from('messages').select('id, subject, body, created_at, is_draft, attachments')
          .eq('sender_id', userId).eq('is_draft', true).order('created_at', { ascending: false });
        setMessages(data || []);
      }
    } catch (e) { console.warn('Mail load error:', e); setMessages([]); }
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

  const handleAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('mail-attachments').upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('mail-attachments').getPublicUrl(path);
      setAttachments(prev => [...prev, { name: file.name, url: urlData.publicUrl, size: file.size }]);
    }
    setUploading(false);
    e.target.value = '';
  };

  const sendMessage = async (isDraft = false) => {
    if (!subject.trim() || !body.trim()) return;
    if (!isDraft && recipients.length === 0) return;
    setSending(true);
    const { data: msg } = await supabase.from('messages').insert({
      sender_id: userId, subject: subject.trim(), body: body.trim(),
      is_draft: isDraft, attachments: attachments,
    }).select().single();
    if (msg && recipients.length > 0) {
      await supabase.from('message_recipients').insert(recipients.map(r => ({ message_id: msg.id, recipient_id: r })));
    }
    setSending(false);
    setSubject(''); setBody(''); setRecipients([]); setAttachments([]);
    setView(isDraft ? 'drafts' : 'sent');
  };

  const toggleRecipient = (id) => setRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const handleSelectAll = (ids, allSelected) => {
    if (allSelected) setRecipients(prev => prev.filter(id => !ids.includes(id)));
    else setRecipients(prev => [...new Set([...prev, ...ids])]);
  };

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

      <div className="flex-1 rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>

        {/* Compose */}
        {view === 'compose' && (
          <div className="p-5 space-y-3">
            <h3 className="font-bold text-base">New Message</h3>

            <div className="space-y-1">
              <span className="text-xs" style={{ color: C.muted }}>To</span>
              <RecipientDropdown profiles={profiles} recipients={recipients} onToggle={toggleRecipient} onSelectAll={handleSelectAll} />
            </div>

            <div className="space-y-1">
              <span className="text-xs" style={{ color: C.muted }}>Subject</span>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject..."
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }} />
            </div>

            <div className="space-y-1">
              <span className="text-xs" style={{ color: C.muted }}>Message</span>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..."
                rows={7} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }} />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                    style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
                    <Paperclip size={11} />
                    <a href={a.url} target="_blank" rel="noreferrer" style={{ color: C.gold }}>{a.name}</a>
                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
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
                <FileText size={14} /> Draft
              </button>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm disabled:opacity-40"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
                <Paperclip size={14} /> {uploading ? 'Uploading...' : 'Attach'}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleAttachment} />
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
              const senderName = view === 'inbox' ? (m?.sender?.full_name || m?.sender?.username || '—') : 'Me';
              const toNames = view === 'sent' ? (msg.recipientProfiles || []).map(p => p?.full_name || p?.username).filter(Boolean).join(', ') : '';
              const hasAttachments = (m?.attachments || []).length > 0;
              return (
                <div key={msg.id} onClick={() => openMessage(msg)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b hover:opacity-80"
                  style={{ borderColor: C.border, backgroundColor: isUnread ? `${C.gold}11` : 'transparent' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm ${isUnread ? 'font-bold' : 'font-medium'}`} style={{ color: C.text }}>
                        {view === 'inbox' ? `From: ${senderName}` : view === 'sent' ? `To: ${toNames || '—'}` : 'Draft'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasAttachments && <Paperclip size={12} style={{ color: C.muted }} />}
                        <span className="text-xs" style={{ color: C.muted }}>{fmtDateTime(m?.created_at)}</span>
                      </div>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${isUnread ? 'font-semibold' : ''}`} style={{ color: isUnread ? C.text : C.muted }}>
                      {m?.subject}
                    </p>
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
          const atts = m?.attachments || [];
          return (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => { setView(selected.messages ? 'inbox' : 'sent'); load(); }}
                  className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={deleteMessage} className="text-xs" style={{ color: '#C9714F' }}>Delete</button>
              </div>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
                <p className="text-xs mb-1" style={{ color: C.muted }}>
                  From: <span className="font-medium" style={{ color: C.text }}>{sender?.full_name || sender?.username || 'Me'}</span>
                  <span className="ml-2">{fmtDateTime(m?.created_at)}</span>
                </p>
                <h3 className="font-bold text-base">{m?.subject}</h3>
              </div>
              <div className="text-sm whitespace-pre-wrap" style={{ color: C.text, lineHeight: 1.8 }}>
                {m?.body}
              </div>
              {atts.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                  <p className="text-xs mb-2" style={{ color: C.muted }}>Attachments ({atts.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {atts.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.gold }}>
                        <Paperclip size={11} /> {a.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
