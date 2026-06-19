import React from 'react';

const COUNTRY_CODES = [
  // Egypt first (most common)
  { code: 'eg', name: 'Egypt',          test: (d) => /^(20)?(01[0125]\d{8})$/.test(d) || /^01[0125]\d{8}$/.test(d) },
  // Arab World
  { code: 'sa', name: 'Saudi Arabia',   test: (d) => /^966[56]\d{8}$/.test(d) || /^05\d{8}$/.test(d) },
  { code: 'ae', name: 'UAE',            test: (d) => /^971[57]\d{8}$/.test(d) },
  { code: 'kw', name: 'Kuwait',         test: (d) => /^965[569]\d{7}$/.test(d) },
  { code: 'qa', name: 'Qatar',          test: (d) => /^974\d{8}$/.test(d) },
  { code: 'bh', name: 'Bahrain',        test: (d) => /^973\d{8}$/.test(d) },
  { code: 'om', name: 'Oman',           test: (d) => /^968[79]\d{7}$/.test(d) },
  { code: 'jo', name: 'Jordan',         test: (d) => /^962[78]\d{8}$/.test(d) || /^07[789]\d{7}$/.test(d) },
  { code: 'lb', name: 'Lebanon',        test: (d) => /^961[37]\d{7}$/.test(d) },
  { code: 'iq', name: 'Iraq',           test: (d) => /^964[7]\d{9}$/.test(d) || /^07[3-9]\d{8}$/.test(d) },
  { code: 'ly', name: 'Libya',          test: (d) => /^218\d{9}$/.test(d) },
  { code: 'tn', name: 'Tunisia',        test: (d) => /^216\d{8}$/.test(d) },
  { code: 'dz', name: 'Algeria',        test: (d) => /^213\d{9}$/.test(d) },
  { code: 'ma', name: 'Morocco',        test: (d) => /^212\d{9}$/.test(d) },
  { code: 'sd', name: 'Sudan',          test: (d) => /^249\d{9}$/.test(d) },
  { code: 'ye', name: 'Yemen',          test: (d) => /^967\d{9}$/.test(d) },
  { code: 'ps', name: 'Palestine',      test: (d) => /^970\d{9}$/.test(d) },
  { code: 'sy', name: 'Syria',          test: (d) => /^963\d{9}$/.test(d) },
  // Europe
  { code: 'tr', name: 'Turkey',         test: (d) => /^90[5]\d{9}$/.test(d) },
  { code: 'gb', name: 'UK',             test: (d) => /^44[7]\d{9}$/.test(d) },
  { code: 'de', name: 'Germany',        test: (d) => /^49[1]\d{10}$/.test(d) },
  { code: 'fr', name: 'France',         test: (d) => /^33[67]\d{8}$/.test(d) },
  { code: 'it', name: 'Italy',          test: (d) => /^39[3]\d{9}$/.test(d) },
  { code: 'es', name: 'Spain',          test: (d) => /^34[67]\d{8}$/.test(d) },
  { code: 'nl', name: 'Netherlands',    test: (d) => /^31[6]\d{8}$/.test(d) },
  { code: 'be', name: 'Belgium',        test: (d) => /^32[4]\d{8}$/.test(d) },
  { code: 'ch', name: 'Switzerland',    test: (d) => /^41[7]\d{8}$/.test(d) },
  { code: 'se', name: 'Sweden',         test: (d) => /^46[7]\d{8}$/.test(d) },
  { code: 'no', name: 'Norway',         test: (d) => /^47[49]\d{7}$/.test(d) },
  { code: 'dk', name: 'Denmark',        test: (d) => /^45[2-9]\d{7}$/.test(d) },
  { code: 'pl', name: 'Poland',         test: (d) => /^48[5-7]\d{8}$/.test(d) },
  { code: 'pt', name: 'Portugal',       test: (d) => /^351[9]\d{8}$/.test(d) },
  { code: 'gr', name: 'Greece',         test: (d) => /^30[69]\d{9}$/.test(d) },
  { code: 'at', name: 'Austria',        test: (d) => /^43[6]\d{9}$/.test(d) },
  { code: 'fi', name: 'Finland',        test: (d) => /^358[4]\d{8}$/.test(d) },
  { code: 'ie', name: 'Ireland',        test: (d) => /^353[8]\d{8}$/.test(d) },
  { code: 'cz', name: 'Czech Republic', test: (d) => /^420[67]\d{8}$/.test(d) },
  { code: 'ro', name: 'Romania',        test: (d) => /^40[7]\d{8}$/.test(d) },
  { code: 'hu', name: 'Hungary',        test: (d) => /^36[37]\d{8}$/.test(d) },
  // Americas
  { code: 'us', name: 'USA',            test: (d) => /^1[2-9]\d{9}$/.test(d) },
  { code: 'ca', name: 'Canada',         test: (d) => /^1[2-9]\d{9}$/.test(d) },
  { code: 'br', name: 'Brazil',         test: (d) => /^55[1-9]\d{10}$/.test(d) },
  { code: 'mx', name: 'Mexico',         test: (d) => /^52[1-9]\d{9}$/.test(d) },
  { code: 'ar', name: 'Argentina',      test: (d) => /^54[9]\d{10}$/.test(d) },
  { code: 'co', name: 'Colombia',       test: (d) => /^57[3]\d{9}$/.test(d) },
  { code: 'cl', name: 'Chile',          test: (d) => /^56[9]\d{8}$/.test(d) },
  { code: 'pe', name: 'Peru',           test: (d) => /^51[9]\d{8}$/.test(d) },
  // Asia
  { code: 'ru', name: 'Russia',         test: (d) => /^7[79]\d{9}$/.test(d) },
  { code: 'in', name: 'India',          test: (d) => /^91[6-9]\d{9}$/.test(d) },
  { code: 'pk', name: 'Pakistan',       test: (d) => /^92[3]\d{9}$/.test(d) },
  { code: 'cn', name: 'China',          test: (d) => /^86[1]\d{10}$/.test(d) },
  { code: 'jp', name: 'Japan',          test: (d) => /^81[7-9]\d{9}$/.test(d) },
  { code: 'kr', name: 'South Korea',    test: (d) => /^82[1]\d{9}$/.test(d) },
  { code: 'id', name: 'Indonesia',      test: (d) => /^62[8]\d{9,10}$/.test(d) },
  { code: 'my', name: 'Malaysia',       test: (d) => /^60[1]\d{8,9}$/.test(d) },
  { code: 'sg', name: 'Singapore',      test: (d) => /^65[89]\d{7}$/.test(d) },
  { code: 'th', name: 'Thailand',       test: (d) => /^66[689]\d{8}$/.test(d) },
  { code: 'ph', name: 'Philippines',    test: (d) => /^63[9]\d{9}$/.test(d) },
  { code: 'vn', name: 'Vietnam',        test: (d) => /^84[3-9]\d{8}$/.test(d) },
  { code: 'bd', name: 'Bangladesh',     test: (d) => /^880[1]\d{9}$/.test(d) },
  { code: 'lk', name: 'Sri Lanka',      test: (d) => /^94[7]\d{8}$/.test(d) },
  { code: 'np', name: 'Nepal',          test: (d) => /^977[9]\d{8}$/.test(d) },
  { code: 'kz', name: 'Kazakhstan',     test: (d) => /^7[67]\d{9}$/.test(d) },
  // Africa
  { code: 'ng', name: 'Nigeria',        test: (d) => /^234[7-9]\d{9}$/.test(d) },
  { code: 'za', name: 'South Africa',   test: (d) => /^27[6-8]\d{8}$/.test(d) },
  { code: 'ke', name: 'Kenya',          test: (d) => /^254[7]\d{8}$/.test(d) },
  { code: 'et', name: 'Ethiopia',       test: (d) => /^251[9]\d{8}$/.test(d) },
  { code: 'gh', name: 'Ghana',          test: (d) => /^233[2-5]\d{8}$/.test(d) },
  { code: 'tz', name: 'Tanzania',       test: (d) => /^255[7]\d{8}$/.test(d) },
  { code: 'ug', name: 'Uganda',         test: (d) => /^256[7]\d{8}$/.test(d) },
  { code: 'sn', name: 'Senegal',        test: (d) => /^221[7]\d{8}$/.test(d) },
  { code: 'ci', name: 'Ivory Coast',    test: (d) => /^225[0]\d{9}$/.test(d) },
  // Oceania
  { code: 'au', name: 'Australia',      test: (d) => /^61[4]\d{8}$/.test(d) },
  { code: 'nz', name: 'New Zealand',    test: (d) => /^64[2]\d{7,9}$/.test(d) },
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
