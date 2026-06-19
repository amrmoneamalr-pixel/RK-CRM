import React from 'react';

const COUNTRY_CODES = [
  { code: 'eg', name: 'Egypt',           test: (d) => /^(20)?(01[0125]\d{8})$/.test(d) || /^01[0125]\d{8}$/.test(d) },
  { code: 'sa', name: 'Saudi Arabia',    test: (d) => /^(966)?(05\d{8})$/.test(d) || /^9665\d{8}$/.test(d) || /^05\d{8}$/.test(d) },
  { code: 'ae', name: 'UAE',             test: (d) => /^(971)?(05\d{8})$/.test(d) || /^9715\d{8}$/.test(d) },
  { code: 'kw', name: 'Kuwait',          test: (d) => /^965\d{8}$/.test(d) },
  { code: 'qa', name: 'Qatar',           test: (d) => /^974\d{8}$/.test(d) },
  { code: 'bh', name: 'Bahrain',         test: (d) => /^973\d{8}$/.test(d) },
  { code: 'om', name: 'Oman',            test: (d) => /^968\d{8}$/.test(d) },
  { code: 'jo', name: 'Jordan',          test: (d) => /^962\d{9}$/.test(d) || /^07[789]\d{7}$/.test(d) },
  { code: 'lb', name: 'Lebanon',         test: (d) => /^961\d{8}$/.test(d) },
  { code: 'iq', name: 'Iraq',            test: (d) => /^964\d{10}$/.test(d) || /^07[0-9]\d{8}$/.test(d) },
  { code: 'ly', name: 'Libya',           test: (d) => /^218\d{9}$/.test(d) },
  { code: 'tn', name: 'Tunisia',         test: (d) => /^216\d{8}$/.test(d) },
  { code: 'dz', name: 'Algeria',         test: (d) => /^213\d{9}$/.test(d) },
  { code: 'ma', name: 'Morocco',         test: (d) => /^212\d{9}$/.test(d) },
  { code: 'sd', name: 'Sudan',           test: (d) => /^249\d{9}$/.test(d) },
  { code: 'ye', name: 'Yemen',           test: (d) => /^967\d{9}$/.test(d) },
  { code: 'ps', name: 'Palestine',       test: (d) => /^970\d{9}$/.test(d) },
  { code: 'tr', name: 'Turkey',          test: (d) => /^90\d{10}$/.test(d) },
  { code: 'gb', name: 'UK',              test: (d) => /^44\d{10}$/.test(d) },
  { code: 'de', name: 'Germany',         test: (d) => /^49\d{10,11}$/.test(d) },
  { code: 'fr', name: 'France',          test: (d) => /^33\d{9}$/.test(d) },
  { code: 'it', name: 'Italy',           test: (d) => /^39\d{9,10}$/.test(d) },
  { code: 'es', name: 'Spain',           test: (d) => /^34\d{9}$/.test(d) },
  { code: 'nl', name: 'Netherlands',     test: (d) => /^31\d{9}$/.test(d) },
  { code: 'be', name: 'Belgium',         test: (d) => /^32\d{8,9}$/.test(d) },
  { code: 'ch', name: 'Switzerland',     test: (d) => /^41\d{9}$/.test(d) },
  { code: 'se', name: 'Sweden',          test: (d) => /^46\d{7,9}$/.test(d) },
  { code: 'no', name: 'Norway',          test: (d) => /^47\d{8}$/.test(d) },
  { code: 'dk', name: 'Denmark',         test: (d) => /^45\d{8}$/.test(d) },
  { code: 'pl', name: 'Poland',          test: (d) => /^48\d{9}$/.test(d) },
  { code: 'ru', name: 'Russia',          test: (d) => /^7\d{10}$/.test(d) },
  { code: 'us', name: 'USA',             test: (d) => /^1\d{10}$/.test(d) },
  { code: 'ca', name: 'Canada',          test: (d) => /^1[2-9]\d{9}$/.test(d) },
  { code: 'au', name: 'Australia',       test: (d) => /^61\d{9}$/.test(d) },
  { code: 'in', name: 'India',           test: (d) => /^91\d{10}$/.test(d) },
  { code: 'pk', name: 'Pakistan',        test: (d) => /^92\d{10}$/.test(d) },
  { code: 'cn', name: 'China',           test: (d) => /^86\d{11}$/.test(d) },
  { code: 'jp', name: 'Japan',           test: (d) => /^81\d{10}$/.test(d) },
  { code: 'br', name: 'Brazil',          test: (d) => /^55\d{10,11}$/.test(d) },
  { code: 'ng', name: 'Nigeria',         test: (d) => /^234\d{10}$/.test(d) },
  { code: 'za', name: 'South Africa',    test: (d) => /^27\d{9}$/.test(d) },
  { code: 'et', name: 'Ethiopia',        test: (d) => /^251\d{9}$/.test(d) },
  { code: 'ke', name: 'Kenya',           test: (d) => /^254\d{9}$/.test(d) },
  { code: 'gh', name: 'Ghana',           test: (d) => /^233\d{9}$/.test(d) },
  { code: 'mx', name: 'Mexico',          test: (d) => /^52\d{10}$/.test(d) },
  { code: 'ar', name: 'Argentina',       test: (d) => /^54\d{10}$/.test(d) },
  { code: 'id', name: 'Indonesia',       test: (d) => /^62\d{9,11}$/.test(d) },
  { code: 'my', name: 'Malaysia',        test: (d) => /^60\d{9,10}$/.test(d) },
  { code: 'sg', name: 'Singapore',       test: (d) => /^65\d{8}$/.test(d) },
  { code: 'th', name: 'Thailand',        test: (d) => /^66\d{9}$/.test(d) },
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

export default function PhoneFlag({ phone, size = 18 }) {
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
