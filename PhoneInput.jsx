import React, { useState, useRef, useEffect } from 'react';
import { C } from './constants';

const COUNTRIES = [
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: 'SY', dial: '+963', flag: '🇸🇾', name: 'Syria' },
  { code: 'LY', dial: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'SD', dial: '+249', flag: '🇸🇩', name: 'Sudan' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'USA' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turkey' },
];

// Parse a stored number into {dial, local}
function parsePhone(value) {
  if (!value) return { country: COUNTRIES[0], local: '' };
  for (const c of COUNTRIES.sort((a, b) => b.dial.length - a.dial.length)) {
    if (value.startsWith(c.dial)) {
      return { country: c, local: value.slice(c.dial.length) };
    }
  }
  return { country: COUNTRIES[0], local: value };
}

export default function PhoneInput({ value, onChange, placeholder, style, className }) {
  const parsed = parsePhone(value);
  const [country, setCountry] = useState(parsed.country);
  const [local, setLocal] = useState(parsed.local);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const emit = (c, l) => {
    const full = l.trim() ? c.dial + l.trim() : '';
    onChange(full);
  };

  const selectCountry = (c) => {
    setCountry(c);
    setOpen(false);
    setSearch('');
    emit(c, local);
  };

  const handleLocal = (e) => {
    const l = e.target.value.replace(/[^\d\s\-]/g, '');
    setLocal(l);
    emit(country, l);
  };

  const filtered = search
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search))
    : COUNTRIES;

  return (
    <div ref={ref} className={`flex gap-1 ${className || ''}`} style={style}>
      {/* Country selector */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setSearch(''); }}
          className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm h-full"
          style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text, minWidth: 72 }}
        >
          <span>{country.flag}</span>
          <span className="text-xs" style={{ color: C.muted }}>{country.dial}</span>
        </button>

        {open && (
          <div className="absolute z-50 top-10 left-0 rounded-xl shadow-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, width: 220 }}>
            <div className="p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectCountry(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:opacity-70"
                  style={{ backgroundColor: c.code === country.code ? `${C.gold}22` : 'transparent', color: C.text }}
                >
                  <span>{c.flag}</span>
                  <span className="flex-1 text-xs">{c.name}</span>
                  <span className="text-xs" style={{ color: C.muted }}>{c.dial}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Number input */}
      <input
        type="tel"
        value={local}
        onChange={handleLocal}
        placeholder={placeholder || '1xxxxxxxxx'}
        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
      />
    </div>
  );
}
