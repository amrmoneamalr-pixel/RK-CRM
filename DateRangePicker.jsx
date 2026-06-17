import React, { useState, useRef, useEffect } from 'react';
import { C } from './constants';

const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function CalendarMonth({ year, month, from, to, hovered, onDay, onHover, onPrev, onNext, showPrev, showNext }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const inRange = (d) => {
    const iso = isoDate(year, month, d);
    const end = to || hovered;
    if (from && end) {
      const [a, b] = from <= end ? [from, end] : [end, from];
      return iso >= a && iso <= b;
    }
    return false;
  };

  const isFrom = (d) => isoDate(year, month, d) === from;
  const isTo = (d) => isoDate(year, month, d) === (to || hovered);

  return (
    <div className="p-3 select-none" style={{ minWidth: 220 }}>
      <div className="flex items-center justify-between mb-2">
        {showPrev
          ? <button onClick={onPrev} className="px-2 py-0.5 text-sm rounded hover:opacity-70" style={{ color: C.text }}>{'<'}</button>
          : <span className="w-6" />}
        <span className="text-xs font-bold" style={{ color: C.text }}>{MONTHS[month]} {year}</span>
        {showNext
          ? <button onClick={onNext} className="px-2 py-0.5 text-sm rounded hover:opacity-70" style={{ color: C.text }}>{'>'}</button>
          : <span className="w-6" />}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS.map((d) => <div key={d} className="text-xs py-0.5" style={{ color: C.muted }}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const active = isFrom(d) || isTo(d);
          const range = inRange(d);
          return (
            <div
              key={d}
              onClick={() => onDay(isoDate(year, month, d))}
              onMouseEnter={() => onHover(isoDate(year, month, d))}
              className="text-xs py-1 rounded cursor-pointer text-center transition-colors"
              style={{
                backgroundColor: active ? C.gold : range ? `${C.gold}33` : 'transparent',
                color: active ? '#14181F' : range ? C.gold : C.text,
                fontWeight: active ? 'bold' : 'normal',
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({ from, to, onChange, placeholder = 'Select date range' }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const handleDay = (iso) => {
    if (!from || (from && to)) {
      onChange(iso, null);
    } else {
      if (iso < from) onChange(iso, from);
      else onChange(from, iso);
      setOpen(false);
    }
  };

  const label = from && to ? `${from}  →  ${to}` : from ? `${from}  →  ...` : '';

  const shortcuts = [
    { label: '3 Days', fn: () => { const d = new Date(); const f = new Date(d); f.setDate(d.getDate()-2); onChange(f.toISOString().slice(0,10), d.toISOString().slice(0,10)); setOpen(false); }},
    { label: '5 Days', fn: () => { const d = new Date(); const f = new Date(d); f.setDate(d.getDate()-4); onChange(f.toISOString().slice(0,10), d.toISOString().slice(0,10)); setOpen(false); }},
    { label: '7 Days', fn: () => { const d = new Date(); const f = new Date(d); f.setDate(d.getDate()-6); onChange(f.toISOString().slice(0,10), d.toISOString().slice(0,10)); setOpen(false); }},
    { label: 'Next Week', fn: () => { const d = new Date(); const f = new Date(d); f.setDate(d.getDate()+1); const t = new Date(d); t.setDate(d.getDate()+7); onChange(f.toISOString().slice(0,10), t.toISOString().slice(0,10)); setOpen(false); }},
    { label: 'Month', fn: () => { const d = new Date(); onChange(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`, d.toISOString().slice(0,10)); setOpen(false); }},
    { label: 'Year', fn: () => { const d = new Date(); onChange(`${d.getFullYear()}-01-01`, d.toISOString().slice(0,10)); setOpen(false); }},
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded px-2 py-1 text-xs text-left outline-none truncate"
        style={{ backgroundColor: C.surface, border: `1px solid ${(from || to) ? C.gold : C.border}`, color: (from || to) ? C.gold : C.muted, minWidth: 120 }}
      >
        {label || placeholder}
      </button>

      {open && (
        <div
          className="absolute z-50 top-8 left-0 rounded-xl shadow-xl"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, minWidth: 480 }}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="p-2 text-xs font-medium border-b" style={{ borderColor: C.border, color: C.muted }}>
            Please select a date range
            <button onClick={() => setOpen(false)} className="float-right px-2 rounded" style={{ backgroundColor: C.bg, color: C.muted }}>Close</button>
          </div>
          <div className="flex">
            <CalendarMonth
              year={viewYear} month={viewMonth}
              from={from} to={to} hovered={hovered}
              onDay={handleDay} onHover={setHovered}
              onPrev={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v-1); } else setViewMonth(v => v-1); }}
              onNext={null} showPrev showNext={false}
            />
            <div style={{ width: 1, backgroundColor: C.border }} />
            <CalendarMonth
              year={nextYear} month={nextMonth}
              from={from} to={to} hovered={hovered}
              onDay={handleDay} onHover={setHovered}
              onPrev={null} showPrev={false}
              onNext={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v+1); } else setViewMonth(v => v+1); }}
              showNext
            />
          </div>
          <div className="px-3 py-2 text-xs border-t flex flex-wrap gap-2 items-center" style={{ borderColor: C.border, color: C.muted }}>
            <span>Shortcuts</span>
            {shortcuts.map((sh) => (
              <button key={sh.label} onClick={sh.fn} className="underline" style={{ color: C.gold }}>{sh.label}</button>
            ))}
            {(from || to) && (
              <button onClick={() => { onChange(null, null); }} className="ml-auto" style={{ color: '#C9714F' }}>Clear</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
