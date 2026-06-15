import React from 'react';

// A clearer WhatsApp badge: green circle with a white glyph (bigger & higher contrast
// than a plain colored outline icon on a dark background).
export function WhatsAppIcon({ size = 18 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: '#25D366' }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="#fff">
        <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.1-.2-.1-.4.1-.6.2-.2.5-.5.6-.7.1-.2.1-.4 0-.5-.1-.2-.6-1.5-.8-2-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3 1 2.6 1.1 2.8.1.2 1.9 3 4.6 4.1 2.3.9 2.3.6 2.7.6.4 0 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.6-.3z"/>
        <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.6.9 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.2 1 1-3.1-.2-.3C3.5 14.9 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/>
      </svg>
    </span>
  );
}

export function FacebookIcon({ size = 18 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: '#1877F2' }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="#fff">
        <path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7C18.3 21.1 22 17 22 12z"/>
      </svg>
    </span>
  );
}

export function InstagramIcon({ size = 18 }) {
  const gid = 'ig-grad-' + size;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <linearGradient id={gid} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFDC80" />
            <stop offset="30%" stopColor="#FCAF45" />
            <stop offset="55%" stopColor="#E1306C" />
            <stop offset="100%" stopColor="#5851DB" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill={`url(#${gid})`} />
        <rect x="6.5" y="6.5" width="11" height="11" rx="3" fill="none" stroke="#fff" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2.6" fill="none" stroke="#fff" strokeWidth="1.4" />
        <circle cx="15.4" cy="8.6" r="0.8" fill="#fff" />
      </svg>
    </span>
  );
}

export function TiktokIcon({ size = 18 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: '#000' }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
        <path fill="#69C9D0" d="M19.6 7.8a4.6 4.6 0 0 1-2.7-1v6.9a5.3 5.3 0 1 1-4.6-5.3v2.3a3 3 0 1 0 2.2 2.9V2h2.4a4.6 4.6 0 0 0 2.7 4.1z"/>
        <path fill="#EE1D52" d="M19.6 7.8V6.1A4.6 4.6 0 0 1 17 5V11.7a5.3 5.3 0 1 1-4.6-5.3v2.3a3 3 0 1 0 2.2 2.9V2h2.4a4.6 4.6 0 0 0 2.6 5.8z"/>
        <path fill="#fff" d="M16.9 5a4.6 4.6 0 0 0 2.7 2.8V6.1A2.9 2.9 0 0 1 16.9 5zM12.4 8.7a5.3 5.3 0 0 0-2.4 10A5.3 5.3 0 0 0 14.6 13V6.7A4.6 4.6 0 0 0 17 7.8V5.8a2.9 2.9 0 0 1-2.4-2.9h-2.2v9a3 3 0 1 1-2.2-2.9V8.7z"/>
      </svg>
    </span>
  );
}

const SOURCE_ICONS = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  TikTok: TiktokIcon,
  WhatsApp: WhatsAppIcon,
};

export function sourceIcon(source) {
  if (!source) return null;
  const key = Object.keys(SOURCE_ICONS).find((k) => source.toLowerCase().includes(k.toLowerCase()));
  return key ? SOURCE_ICONS[key] : null;
}

// Renders a source name with its brand icon (if any) next to it.
export function SourceTag({ source, size = 16 }) {
  if (!source) return <span>—</span>;
  const Icon = sourceIcon(source);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {Icon && <Icon size={size} />}
      <span>{source}</span>
    </span>
  );
}
