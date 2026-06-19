import React from 'react';

const COUNTRY_CODES = [
  { code: 'eg', test: (d) => /^(20)?(01[0125]\d{8})$/.test(d) || /^01[0125]\d{8}$/.test(d) },
  { code: 'sa', test: (d) => /^(966)?(05\d{8})$/.test(d) || /^9665\d{8}$/.test(d) || /^05\d{8}$/.test(d) },
  { code: 'ae', test: (d) => /^(971)?(05\d{8})$/.test(d) || /^9715\d{8}$/.test(d) },
  { code: 'kw', test: (d) => /^965\d{8}$/.test(d) },
  { code: 'qa', test: (d) => /^974\d{8}$/.test(d) },
  { code: 'bh', test: (d) => /^973\d{8}$/.test(d) },
  { code: 'om', test: (d) => /^968\d{8}$/.test(d) },
  { code: 'jo', test: (d) => /^962\d{9}$/.test(d) || /^07[789]\d{7}$/.test(d) },
  { code: 'lb', test: (d) => /^961\d{8}$/.test(d) },
  { code: 'iq', test: (d) => /^964\d{10}$/.test(d) || /^07[0-9]\d{8}$/.test(d) },
  { code: 'ly', test: (d) => /^218\d{9}$/.test(d) },
  { code: 'tn', test: (d) => /^216\d{8}$/.test(d) },
  { code: 'dz', test: (d) => /^213\d{9}$/.test(d) },
  { code: 'ma', test: (d) => /^212\d{9}$/.test(d) },
  { code: 'sd', test: (d) => /^249\d{9}$/.test(d) },
  { code: 'gb', test: (d) => /^44\d{10}$/.test(d) },
  { code: 'de', test: (d) => /^49\d{10,11}$/.test(d) },
  { code: 'fr', test: (d) => /^33\d{9}$/.test(d) },
  { code: 'tr', test: (d) => /^90\d{10}$/.test(d) },
  { code: 'us', test: (d) => /^1\d{10}$/.test(d) },
];

export function detectCountryCode(phone) {
  if (!phone) return 'eg';
  let digits = phone.replace(/[\s\-\+\(\)\.]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  for (const { code, test } of COUNTRY_CODES) {
    if (test(digits)) return code;
  }
  return 'eg';
}

export default function PhoneFlag({ phone, size = 16 }) {
  const code = detectCountryCode(phone);
  return (
    <img
      src={`https://flagcdn.com/w20/${code}.png`}
      srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
      alt={code.toUpperCase()}
      style={{ width: size, height: 'auto', borderRadius: 2, display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
