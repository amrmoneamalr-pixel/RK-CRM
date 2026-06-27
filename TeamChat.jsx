import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Send, MessageCircle, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';

const BUCKET = 'chat-attachments';

export default function TeamChat({ profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState(null); // { file, previewUrl }
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load messages on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('team_chat')
          .select('id, message, created_at, user_id, attachment_url, attachment_name, attachment_type, profiles(full_name, role)')
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
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', payload.new.user_id)
            .single();
          setMessages((prev) => {
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

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 10 MB cap
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large (max 10 MB)');
      e.target.value = '';
      return;
    }
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl });
    e.target.value = '';
  };

  const clearPendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  };

  const uploadFile = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pendingFile) || sending) return;
    setSending(true);
    const fileSnapshot = pendingFile;
    setInput('');
    clearPendingFile();

    try {
      let attachment_url = null;
      let attachment_name = null;
      let attachment_type = null;
      if (fileSnapshot) {
        attachment_url = await uploadFile(fileSnapshot.file);
        attachment_name = fileSnapshot.file.name;
        attachment_type = fileSnapshot.file.type || 'application/octet-stream';
      }
      await supabase.from('team_chat').insert({
        user_id: profile.id,
        message: text || '',
        attachment_url,
        attachment_name,
        attachment_type,
      });
    } catch (e) {
      console.warn('Failed to send message:', e);
      alert('Failed to send: ' + (e.message || 'Unknown error'));
      setInput(text);
      if (fileSnapshot) setPendingFile(fileSnapshot);
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

  const renderAttachment = (m, isOwn) => {
    if (!m.attachment_url) return null;
    const isImage = (m.attachment_type || '').startsWith('image/');
    if (isImage) {
      return (
        <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={m.attachment_url}
            alt={m.attachment_name || 'image'}
            className="rounded-md max-w-full"
            style={{ maxHeight: '180px', objectFit: 'cover' }}
          />
        </a>
      );
    }
    return (
      <a
        href={m.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-md text-xs"
        style={{
          backgroundColor: isOwn ? 'rgba(0,0,0,0.12)' : C.surface,
          color: isOwn ? '#14181F' : C.text,
          textDecoration: 'none',
        }}
      >
        <FileText size={14} />
        <span className="truncate" style={{ maxWidth: '180px' }}>{m.attachment_name || 'file'}</span>
      </a>
    );
  };

  return (
    <div className="flex flex-col" style={{ height: '100%', borderTop: `1px solid ${C.border}`, backgroundColor: C.surface }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        <MessageCircle size={14} style={{ color: C.gold }} />
        <span className="text-xs font-bold" style={{ color: C.text }}>Team Chat</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-2" style={{ minHeight: 0 }}>
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
                    <div className="text-xs px-2 mb-0.5 font-semibold" style={{ color: C.gold }}>
                      {m.profiles?.full_name || 'Unknown'}
                    </div>
                  )}
                  <div
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: item.isOwn ? C.gold : C.bg,
                      color: item.isOwn ? '#14181F' : C.text,
                      borderTopLeftRadius: !item.isOwn && !item.showName ? '4px' : undefined,
                      borderTopRightRadius: item.isOwn && !item.showName ? '4px' : undefined,
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {m.message && <div className="whitespace-pre-wrap break-words">{m.message}</div>}
                    {renderAttachment(m, item.isOwn)}
                    <div className="text-[10px] mt-1 opacity-70 text-right">{fmtTime(m.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pending file preview */}
      {pendingFile && (
        <div className="flex items-center gap-2 px-2 py-1.5 shrink-0" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          {pendingFile.previewUrl ? (
            <img src={pendingFile.previewUrl} alt="preview" className="rounded" style={{ width: 32, height: 32, objectFit: 'cover' }} />
          ) : (
            <div className="flex items-center justify-center rounded" style={{ width: 32, height: 32, backgroundColor: C.surface }}>
              <FileText size={16} style={{ color: C.muted }} />
            </div>
          )}
          <span className="flex-1 text-xs truncate" style={{ color: C.text }}>{pendingFile.file.name}</span>
          <button onClick={clearPendingFile} className="p-1 rounded hover:opacity-70" style={{ color: C.muted }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-1.5 p-2 shrink-0" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFilePick}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40 shrink-0"
          style={{ color: C.muted, backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          title="Attach file"
        >
          <Paperclip size={15} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 rounded-lg px-2.5 py-1.5 text-sm outline-none"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}
        />
        <button
          onClick={send}
          disabled={(!input.trim() && !pendingFile) || sending}
          className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40 shrink-0"
          style={{ backgroundColor: C.gold, color: '#14181F' }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
