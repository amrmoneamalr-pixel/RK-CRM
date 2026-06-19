import React from 'react';

// Detect country flag from phone number prefix
const DIAL_CODES = [
  { dial: '20',  flag: '🇪🇬' }, // Egypt — first (most common)
  { dial: '966', flag: '🇸🇦' },
  { dial: '971', flag: '🇦🇪' },
  { dial: '965', flag: '🇰🇼' },
  { dial: '974', flag: '🇶🇦' },
  { dial: '973', flag: '🇧🇭' },
  { dial: '968', flag: '🇴🇲' },
  { dial: '962', flag: '🇯🇴' },
  { dial: '961', flag: '🇱🇧' },
  { dial: '964', flag: '🇮🇶' },
  { dial: '963', flag: '🇸🇾' },
  { dial: '218', flag: '🇱🇾' },
  { dial: '216', flag: '🇹🇳' },
  { dial: '213', flag: '🇩🇿' },
  { dial: '212', flag: '🇲🇦' },
  { dial: '249', flag: '🇸🇩' },
  { dial: '44',  flag: '🇬🇧' },
  { dial: '49',  flag: '🇩🇪' },
  { dial: '33',  flag: '🇫🇷' },
  { dial: '39',  flag: '🇮🇹' },
  { dial: '90',  flag: '🇹🇷' },
  { dial: '1',   flag: '🇺🇸' },
];

export function detectFlag(phone) {
  if (!phone) return '🇪🇬'; // default Egypt
  const digits = phone.replace(/[\s\-\+\(\)]/g, '');
  // Egyptian numbers start with 01 or 201
  if (digits.startsWith('01') || digits.startsWith('201')) return '🇪🇬';
  if (digits.startsWith('00')) {
    const withoutPrefix = digits.slice(2);
    for (const { dial, flag } of DIAL_CODES) {
      if (withoutPrefix.startsWith(dial)) return flag;
    }
  }
  if (digits.startsWith('+')) {
    const withoutPlus = digits.slice(1);
    for (const { dial, flag } of DIAL_CODES) {
      if (withoutPlus.startsWith(dial)) return flag;
    }
  }
  return '🇪🇬'; // default Egypt
}

export default function PhoneFlag({ phone, size = 14 }) {
  const flag = detectFlag(phone);
  return (
    <span style={{ fontSize: size, lineHeight: 1 }} title={phone}>
      {flag}
    </span>
  );
}
