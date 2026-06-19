import React from 'react';

const COUNTRY_CODES = [
  { code: 'eg', name: 'Egypt',        test: (d) => /^(20)?(01[0125]\d{8})$/.test(d) || /^01[0125]\d{8}$/.test(d) },
  { code: 'sa', name: 'Saudi Arabia', test: (d) => /^(966)?(05\d{8})$/.test(d) || /^9665\d{8}$/.test(d) || /^05\d{8}$/.test(d) },
  { code: 'ae', name: 'UAE',          test: (d) => /^(971)?(05\d{8})$/.test(d) || /^9715\d{8}$/.test(d) },
  { code: 'kw', name: 'Kuwait',       test: (d) => /^965\d{8}$/.test(d) },
  { code: 'qa', name: 'Qatar',        test: (d) => /^974\d{8}$/.test(d) },
  { code: 'bh', name: 'Bahrain',      test: (d) => /^973\d{8}$/.test(d) },
  { code: 'om', name: 'Oman',         test: (d) => /^968\d{8}$/.test(d) },
  { code: 'jo', name: 'Jordan',       test: (d) => /^962\d{9}$/.test(d) || /^07[789]\d{7}$/.test(d) },
  { code: 'lb', name: 'Lebanon',      test: (d) => /^961\d{8}$/.test(d) },
  { code: 'iq', name: 'Iraq',         test: (d) => /^964\d{10}$/.test(d) || /^07[0-9]\d{8}$/.test(d) },
  { code: 'ly', name: 'Libya',        test: (d) => /^218\d{9}$/.test(d) },
  { code: 'tn', name: 'Tunisia',      test: (d) => /^216\d{8}$/.test(d) },
  { code: 'dz', name: 'Algeria',      test: (d) => /^213\d{9}$/.test(d) },
  { code: 'ma', name: 'Morocco',      test: (d) => /^212\d{9}$/.test(d) },
  { code: 'sd', name: 'Sudan',        test: (d) => /^249\d{9}$/.test(d) },
  { code: 'gb', name: 'UK',           test: (d) => /^44\d{10}$/.test(d) },
  { code: 'de', name: 'Germany',      test: (d) => /^49\d{10,11}$/.test(d) },
  { code: 'fr', name: 'France',       test: (d) => /^33\d{9}$/.test(d) },
  { code: 'tr', name: 'Turkey',       test: (d) => /^90\d{10}$/.test(d) },
  { code: 'us', name: 'USA',          test: (d) => /^1\d{10}$/.test(d) },
];

export function detectCountry(phone) {
  if (!phone) return { code: 'eg', name: 'Egypt' };
  let digits = phone.replace(/[\s\-\+\(\)\.]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  for (const { code, name, test } of COUNTRY_CODES) {
    if (test(digits)) return { code, name };
  }
  return { code: 'eg', name: 'Egypt' };
}

export default function PhoneFlag({ phone, size = 16 }) {
  const [show, setShow] = React.useState(false);
  const { code, name } = detectCountry(phone);
  return (
    <span className="relative inline-flex items-center" style={{ verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <img
        src={`https://flagcdn.com/w20/${code}.png`}
        srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
        alt={name}
        style={{ width: size, height: 'auto', borderRadius: 2, display: 'block', cursor: 'default' }}
      />
      {show && (
        <span className="absolute left-1/2 z-50 whitespace-nowrap rounded px-2 py-1 text-xs font-medium pointer-events-none"
          style={{ bottom: '110%', transform: 'translateX(-50%)', backgroundColor: '#1E2530', color: '#FFFFFF', border: '1px solid #2D3748', boxShadow: '0 2px 8px #0006' }}>
          {name}
        </span>
      )}
    </span>
  );
}

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
