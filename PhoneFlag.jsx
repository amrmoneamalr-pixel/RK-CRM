import React from 'react';

// Detect country from phone number digits only — no + or 00 required
// Rules ordered from most specific to least specific
const RULES = [
  // Egypt — 01x prefix (10 digits after 0) or 201x
  { flag: '🇪🇬', test: (d) => /^(20)?(01[0125]\d{8})$/.test(d) || /^01[0125]\d{8}$/.test(d) },
  // Saudi Arabia — 05x or 966
  { flag: '🇸🇦', test: (d) => /^(966)?(05\d{8})$/.test(d) || /^9665\d{8}$/.test(d) || /^05\d{8}$/.test(d) },
  // UAE — 05x (9 digits) or 971
  { flag: '🇦🇪', test: (d) => /^(971)?(05\d{8})$/.test(d) || /^9715\d{8}$/.test(d) },
  // Kuwait — 965 or 5/6/9 + 7 digits
  { flag: '🇰🇼', test: (d) => /^965\d{8}$/.test(d) || /^[569]\d{7}$/.test(d) },
  // Qatar — 974 or 3/5/6/7 + 7 digits
  { flag: '🇶🇦', test: (d) => /^974\d{8}$/.test(d) || /^[3567]\d{7}$/.test(d) },
  // Bahrain — 973 or 3/6 + 7 digits
  { flag: '🇧🇭', test: (d) => /^973\d{8}$/.test(d) },
  // Oman — 968 or 9 + 7 digits
  { flag: '🇴🇲', test: (d) => /^968\d{8}$/.test(d) },
  // Jordan — 962 or 07x
  { flag: '🇯🇴', test: (d) => /^962\d{9}$/.test(d) || /^07[789]\d{7}$/.test(d) },
  // Lebanon — 961 or 03/07/08/09 + 6 digits
  { flag: '🇱🇧', test: (d) => /^961\d{8}$/.test(d) },
  // Iraq — 964 or 07x
  { flag: '🇮🇶', test: (d) => /^964\d{10}$/.test(d) || /^07[0-9]\d{8}$/.test(d) },
  // Libya — 218
  { flag: '🇱🇾', test: (d) => /^218\d{9}$/.test(d) },
  // Tunisia — 216
  { flag: '🇹🇳', test: (d) => /^216\d{8}$/.test(d) },
  // Algeria — 213
  { flag: '🇩🇿', test: (d) => /^213\d{9}$/.test(d) },
  // Morocco — 212
  { flag: '🇲🇦', test: (d) => /^212\d{9}$/.test(d) },
  // Sudan — 249
  { flag: '🇸🇩', test: (d) => /^249\d{9}$/.test(d) },
  // UK — 44
  { flag: '🇬🇧', test: (d) => /^44\d{10}$/.test(d) },
  // Germany — 49
  { flag: '🇩🇪', test: (d) => /^49\d{10,11}$/.test(d) },
  // France — 33
  { flag: '🇫🇷', test: (d) => /^33\d{9}$/.test(d) },
  // Turkey — 90
  { flag: '🇹🇷', test: (d) => /^90\d{10}$/.test(d) },
  // USA/Canada — 1
  { flag: '🇺🇸', test: (d) => /^1\d{10}$/.test(d) },
];

export function detectFlag(phone) {
  if (!phone) return '🇪🇬';
  // Strip everything except digits
  let digits = phone.replace(/[\s\-\+\(\)\.]/g, '');
  // Remove leading 00
  if (digits.startsWith('00')) digits = digits.slice(2);

  for (const { flag, test } of RULES) {
    if (test(digits)) return flag;
  }
  return '🇪🇬'; // default Egypt
}

export default function PhoneFlag({ phone, size = 14 }) {
  const flag = detectFlag(phone);
  return <span style={{ fontSize: size, lineHeight: 1 }}>{flag}</span>;
}
