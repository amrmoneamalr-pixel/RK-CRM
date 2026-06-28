import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import {
  Send, MessageCircle, Paperclip, X, FileText, Image as ImageIcon,
  Star, ArrowLeft, Download, FileSpreadsheet, FileVideo, Archive
} from 'lucide-react';

const BUCKET = 'chat-attachments';

// Pick a small icon for a file based on its MIME type / extension
const iconForFile = (name, type) => {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (t.includes('spreadsheet') || /\.(xlsx?|csv)$/.test(n)) return FileSpreadsheet;
  if (t.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/.test(n)) return FileVideo;
  if (t.includes('zip') || t.includes('rar') || /\.(zip|rar|7z)$/.test(n)) return Archive;
  return FileText;
};

export default function TeamChat({ profile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState(null);
  const [starredIds, setStarredIds] = useState(new Set());
  const [view, setView] = useState('chat');           // 'chat' | 'media' | 'starred'
  const [mediaTab, setMediaTab] = useState('images'); // 'images' | 'files'
  const [lightbox, setLightbox] = useState(null);     // { url, name } | null
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load messages
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('team_chat')
          .select('id, message, created_at, user_id, attachment_url, attachment_name, attachment_type, profiles(full_name, role)')
          .order('created_at', { ascending: true })
          .limit(500);
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

  // Load starred IDs for current user
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('team_chat_starred')
          .select('message_id')
          .eq('user_id', profile.id);
        setStarredIds(new Set((data || []).map(r => r.message_id)));
      } catch (e) {
        console.warn('starred load failed:', e);
      }
    })();
  }, [profile?.id]);

  // Realtime — new messages
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

  // Auto-scroll to bottom on new chat messages (only when in chat view)
  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      let attachment_url = null, attachment_name = null, attachment_type = null;
      if (fileSnapshot) {
        attachment_url = await uploadFile(fileSnapshot.file);
        attachment_name = fileSnapshot.file.name;
        attachment_type = fileSnapshot.file.type || 'application/octet-stream';
      }
      await supabase.from('team_chat').insert({
        user_id: profile.id,
        message: text || '',
        attachment_url, attachment_name, attachment_type,
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const toggleStar = async (messageId) => {
    const isStarred = starredIds.has(messageId);
    // optimistic UI
    setStarredIds(prev => {
      const n = new Set(prev);
      if (isStarred) n.delete(messageId); else n.add(messageId);
      return n;
    });
    try {
      if (isStarred) {
        await supabase.from('team_chat_starred').delete().eq('user_id', profile.id).eq('message_id', messageId);
      } else {
        await supabase.from('team_chat_starred').insert({ user_id: profile.id, message_id: messageId });
      }
    } catch (e) {
      console.warn('toggle star failed:', e);
      // revert
      setStarredIds(prev => {
        const n = new Set(prev);
        if (isStarred) n.add(messageId); else n.delete(messageId);
        return n;
      });
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
  const fmtFullDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ─── Group messages by sender (for chat view) ────────────────────────
  const groupedMessages = [];
  let lastUserId = null, lastDateKey = null;
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

  // ─── Derived lists ────────────────────────────────────────────────────
  const mediaMessages = messages.filter(m => m.attachment_url);
  const imagesList = mediaMessages.filter(m => (m.attachment_type || '').startsWith('image/'));
  const filesList  = mediaMessages.filter(m => !(m.attachment_type || '').startsWith('image/'));
  const starredMessages = messages.filter(m => starredIds.has(m.id));

  const renderAttachment = (m, isOwn) => {
    if (!m.attachment_url) return null;
    const isImage = (m.attachment_type || '').startsWith('image/');
    if (isImage) {
      return (
        <button
          onClick={() => setLightbox({ url: m.attachment_url, name: m.attachment_name || 'image' })}
          className="block mt-1"
        >
          <img
            src={m.attachment_url}
            alt={m.attachment_name || 'image'}
            className="rounded-md max-w-full"
            style={{ maxHeight: '180px', objectFit: 'cover' }}
          />
        </button>
      );
    }
    const Icon = iconForFile(m.attachment_name, m.attachment_type);
    return (
      <a
        href={m.attachment_url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-md text-xs"
        style={{
          backgroundColor: isOwn ? 'rgba(0,0,0,0.12)' : C.surface,
          color: isOwn ? '#14181F' : C.text,
          textDecoration: 'none',
        }}
      >
        <Icon size={14} />
        <span className="truncate" style={{ maxWidth: '180px' }}>{m.attachment_name || 'file'}</span>
      </a>
    );
  };

  // ─── Header ───────────────────────────────────────────────────────────
  const renderHeader = () => {
    if (view !== 'chat') {
      const title = view === 'media' ? 'Media & Files' : 'Starred Messages';
      return (
        <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          <button onClick={() => setView('chat')} className="flex items-center justify-center w-6 h-6 rounded" style={{ color: C.muted }} title="Back to chat">
            <ArrowLeft size={14} />
          </button>
          <span className="text-xs font-bold flex-1" style={{ color: C.text }}>{title}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        <MessageCircle size={14} style={{ color: C.gold }} />
        <span className="text-xs font-bold flex-1" style={{ color: C.text }}>Team Chat</span>
        <button
          onClick={() => { setView('media'); setMediaTab('images'); }}
          className="flex items-center justify-center w-6 h-6 rounded relative"
          style={{ color: mediaMessages.length > 0 ? C.gold : C.muted }}
          title="Media & files"
        >
          <ImageIcon size={13} />
          {mediaMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full"
              style={{ backgroundColor: C.gold, color: '#14181F', minWidth: 12, height: 12, lineHeight: '12px' }}>
              {mediaMessages.length > 99 ? '99+' : mediaMessages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('starred')}
          className="flex items-center justify-center w-6 h-6 rounded relative"
          style={{ color: starredIds.size > 0 ? '#FFB800' : C.muted }}
          title="Starred messages"
        >
          <Star size={13} fill={starredIds.size > 0 ? '#FFB800' : 'transparent'} />
          {starredIds.size > 0 && (
            <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full"
              style={{ backgroundColor: '#FFB800', color: '#14181F', minWidth: 12, height: 12, lineHeight: '12px' }}>
              {starredIds.size > 99 ? '99+' : starredIds.size}
            </span>
          )}
        </button>
      </div>
    );
  };

  // ─── Media Panel ──────────────────────────────────────────────────────
  const renderMediaPanel = () => (
    <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
      <div className="flex gap-1 px-2 py-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
        <button
          onClick={() => setMediaTab('images')}
          className="flex-1 py-1 rounded-md text-xs font-bold"
          style={{
            backgroundColor: mediaTab === 'images' ? C.gold : 'transparent',
            color: mediaTab === 'images' ? '#14181F' : C.muted,
            border: `1px solid ${C.border}`,
          }}
        >
          Images ({imagesList.length})
        </button>
        <button
          onClick={() => setMediaTab('files')}
          className="flex-1 py-1 rounded-md text-xs font-bold"
          style={{
            backgroundColor: mediaTab === 'files' ? C.gold : 'transparent',
            color: mediaTab === 'files' ? '#14181F' : C.muted,
            border: `1px solid ${C.border}`,
          }}
        >
          Files ({filesList.length})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0 }}>
        {mediaTab === 'images' ? (
          imagesList.length === 0 ? (
            <div className="text-center text-xs py-8" style={{ color: C.muted }}>No images shared yet.</div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {imagesList.map(m => (
                <button
                  key={m.id}
                  onClick={() => setLightbox({ url: m.attachment_url, name: m.attachment_name || 'image' })}
                  className="aspect-square rounded overflow-hidden block"
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                  title={`${m.profiles?.full_name || 'Unknown'} • ${fmtFullDate(m.created_at)}`}
                >
                  <img src={m.attachment_url} alt={m.attachment_name} className="w-full h-full" style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )
        ) : (
          filesList.length === 0 ? (
            <div className="text-center text-xs py-8" style={{ color: C.muted }}>No files shared yet.</div>
          ) : (
            <div className="space-y-1.5">
              {filesList.map(m => {
                const Icon = iconForFile(m.attachment_name, m.attachment_type);
                return (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-md"
                    style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-center rounded shrink-0" style={{ width: 28, height: 28, backgroundColor: C.surface, color: C.gold }}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate" style={{ color: C.text }}>{m.attachment_name || 'file'}</div>
                      <div className="text-[10px]" style={{ color: C.muted }}>
                        {m.profiles?.full_name || 'Unknown'} · {fmtFullDate(m.created_at)}
                      </div>
                    </div>
                    <a
                      href={m.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center w-7 h-7 rounded shrink-0"
                      style={{ color: C.muted }}
                      title="Open / download"
                    >
                      <Download size={13} />
                    </a>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );

  // ─── Starred Panel ────────────────────────────────────────────────────
  const renderStarredPanel = () => (
    <div className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ minHeight: 0 }}>
      {starredMessages.length === 0 ? (
        <div className="text-center text-xs py-8" style={{ color: C.muted }}>
          <Star size={20} className="mx-auto mb-2 opacity-50" />
          <div>No starred messages yet.</div>
          <div className="mt-1 opacity-60">Hover a message and click the star to save it.</div>
        </div>
      ) : (
        starredMessages.map(m => (
          <div key={m.id} className="rounded-lg p-2" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold" style={{ color: C.gold }}>{m.profiles?.full_name || 'Unknown'}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]" style={{ color: C.muted }}>
                  {fmtFullDate(m.created_at)} · {fmtTime(m.created_at)}
                </span>
                <button onClick={() => toggleStar(m.id)} className="flex items-center" title="Unstar">
                  <Star size={12} fill="#FFB800" style={{ color: '#FFB800' }} />
                </button>
              </div>
            </div>
            {m.message && <div className="text-xs whitespace-pre-wrap break-words" style={{ color: C.text }}>{m.message}</div>}
            {renderAttachment(m, false)}
          </div>
        ))
      )}
    </div>
  );

  // ─── Lightbox ─────────────────────────────────────────────────────────
  const renderLightbox = () => {
    if (!lightbox) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: '#000000EE' }}
        onClick={() => setLightbox(null)}
      >
        <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          <img src={lightbox.url} alt={lightbox.name} className="max-w-full max-h-[85vh] rounded-lg" />
          <div className="absolute top-2 right-2 flex gap-1">
            <a
              href={lightbox.url} target="_blank" rel="noopener noreferrer" download={lightbox.name}
              className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
              title="Open / download"
            >
              <Download size={14} />
            </a>
            <button
              onClick={() => setLightbox(null)}
              className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: '100%', borderTop: `1px solid ${C.border}`, backgroundColor: C.surface }}>
      {renderHeader()}

      {view === 'media' && renderMediaPanel()}
      {view === 'starred' && renderStarredPanel()}

      {view === 'chat' && (
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
              const isStarred = starredIds.has(m.id);
              return (
                <div key={m.id} className={`flex ${item.isOwn ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[85%] flex items-center gap-1 ${item.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex flex-col">
                      {item.showName && !item.isOwn && (
                        <div className="text-xs px-2 mb-0.5 font-semibold" style={{ color: C.gold }}>
                          {m.profiles?.full_name || 'Unknown'}
                        </div>
                      )}
                      <div
                        className="px-3 py-2 rounded-lg text-sm relative"
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
                        <div className="text-[10px] mt-1 opacity-70 text-right flex items-center justify-end gap-1">
                          {isStarred && <Star size={9} fill="#FFB800" style={{ color: '#FFB800' }} />}
                          <span>{fmtTime(m.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStar(m.id)}
                      className={`flex items-center justify-center w-6 h-6 rounded transition-opacity ${isStarred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      style={{ color: isStarred ? '#FFB800' : C.muted }}
                      title={isStarred ? 'Unstar' : 'Star'}
                    >
                      <Star size={12} fill={isStarred ? '#FFB800' : 'transparent'} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pending file preview — only in chat view */}
      {view === 'chat' && pendingFile && (
        <div className="flex items-center gap-2 px-2 py-1.5 shrink-0" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          {pendingFile.previewUrl ? (
            <img src={pendingFile.previewUrl} alt="preview" className="rounded" style={{ width: 32, height: 32, objectFit: 'cover' }} />
          ) : (
            <div className="flex items-center justify-center rounded" style={{ width: 32, height: 32, backgroundColor: C.surface }}>
              <FileText size={16} style={{ color: C.muted }} />
            </div>
          )}
          <span className="flex-1 text-xs truncate" style={{ color: C.text }}>{pendingFile.file.name}</span>
          <button onClick={clearPendingFile} className="p-1 rounded" style={{ color: C.muted }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input — only in chat view */}
      {view === 'chat' && (
        <div className="flex items-center gap-1.5 p-2 shrink-0" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          <input
            ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden"
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
            type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type a message..." disabled={sending}
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
      )}

      {renderLightbox()}
    </div>
  );
}
