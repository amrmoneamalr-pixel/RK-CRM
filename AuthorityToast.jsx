// AuthorityToast.jsx
// Global toast for "This is not your authority" (and related denials).
// Mount <AuthorityToast /> ONCE at the app root (e.g. in App.jsx next to Layout).
// Then anywhere in the app: showAuthorityToast('Optional custom message');
// If no message is passed, defaults to "This is not your authority".

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { C } from './constants';

const DEFAULT_MSG = 'This is not your authority';

// Global window helper so any component (or plain JS) can trigger the toast.
export const showAuthorityToast = (message = DEFAULT_MSG) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('rk-authority-toast', { detail: { message } })
  );
};

export default function AuthorityToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MSG);

  useEffect(() => {
    let timer = null;

    const onEvent = (e) => {
      const msg = (e && e.detail && e.detail.message) || DEFAULT_MSG;
      setMessage(msg);
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 2200);
    };

    window.addEventListener('rk-authority-toast', onEvent);
    return () => {
      window.removeEventListener('rk-authority-toast', onEvent);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100000,
        backgroundColor: C.surface,
        border: `1.5px solid ${C.gold}`,
        borderRadius: 12,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        fontFamily: 'inherit',
        pointerEvents: 'none',
        animation: 'rkAuthorityFadeIn 0.15s ease-out',
      }}
      role="alert"
      aria-live="polite"
    >
      <ShieldAlert size={18} style={{ color: C.gold, flexShrink: 0 }} />
      <span
        style={{
          color: C.text,
          fontSize: 14,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {message}
      </span>
      <style>{`
        @keyframes rkAuthorityFadeIn {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
