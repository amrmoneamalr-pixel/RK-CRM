import React from 'react';

const COUNTRY_CODES = [
  { code: 'eg', name: 'Egypt',          dial: '+20',  tz: 'Africa/Cairo',           test: (d) => /^(20)?(01[0125]\d{8})$/.test(d) || /^01[0125]\d{8}$/.test(d) },
  { code: 'sa', name: 'Saudi Arabia',   dial: '+966', tz: 'Asia/Riyadh',            test: (d) => /^966[56]\d{8}$/.test(d) || /^05\d{8}$/.test(d) },
  { code: 'ae', name: 'UAE',            dial: '+971', tz: 'Asia/Dubai',             test: (d) => /^971[57]\d{8}$/.test(d) },
  { code: 'kw', name: 'Kuwait',         dial: '+965', tz: 'Asia/Kuwait',            test: (d) => /^965[569]\d{7}$/.test(d) },
  { code: 'qa', name: 'Qatar',          dial: '+974', tz: 'Asia/Qatar',             test: (d) => /^974\d{8}$/.test(d) },
  { code: 'bh', name: 'Bahrain',        dial: '+973', tz: 'Asia/Bahrain',           test: (d) => /^973\d{8}$/.test(d) },
  { code: 'om', name: 'Oman',           dial: '+968', tz: 'Asia/Muscat',            test: (d) => /^968[79]\d{7}$/.test(d) },
  { code: 'jo', name: 'Jordan',         dial: '+962', tz: 'Asia/Amman',             test: (d) => /^962[78]\d{8}$/.test(d) || /^07[789]\d{7}$/.test(d) },
  { code: 'lb', name: 'Lebanon',        dial: '+961', tz: 'Asia/Beirut',            test: (d) => /^961[37]\d{7}$/.test(d) },
  { code: 'iq', name: 'Iraq',           dial: '+964', tz: 'Asia/Baghdad',           test: (d) => /^964[7]\d{9}$/.test(d) || /^07[3-9]\d{8}$/.test(d) },
  { code: 'ly', name: 'Libya',          dial: '+218', tz: 'Africa/Tripoli',         test: (d) => /^218\d{9}$/.test(d) },
  { code: 'tn', name: 'Tunisia',        dial: '+216', tz: 'Africa/Tunis',           test: (d) => /^216\d{8}$/.test(d) },
  { code: 'dz', name: 'Algeria',        dial: '+213', tz: 'Africa/Algiers',         test: (d) => /^213\d{9}$/.test(d) },
  { code: 'ma', name: 'Morocco',        dial: '+212', tz: 'Africa/Casablanca',      test: (d) => /^212\d{9}$/.test(d) },
  { code: 'sd', name: 'Sudan',          dial: '+249', tz: 'Africa/Khartoum',        test: (d) => /^249\d{9}$/.test(d) },
  { code: 'ye', name: 'Yemen',          dial: '+967', tz: 'Asia/Aden',              test: (d) => /^967\d{9}$/.test(d) },
  { code: 'ps', name: 'Palestine',      dial: '+970', tz: 'Asia/Gaza',              test: (d) => /^970\d{9}$/.test(d) },
  { code: 'sy', name: 'Syria',          dial: '+963', tz: 'Asia/Damascus',          test: (d) => /^963\d{9}$/.test(d) },
  { code: 'tr', name: 'Turkey',         dial: '+90',  tz: 'Europe/Istanbul',        test: (d) => /^90[5]\d{9}$/.test(d) },
  { code: 'gb', name: 'UK',             dial: '+44',  tz: 'Europe/London',          test: (d) => /^44[7]\d{9}$/.test(d) },
  { code: 'de', name: 'Germany',        dial: '+49',  tz: 'Europe/Berlin',          test: (d) => /^49[1]\d{10}$/.test(d) },
  { code: 'fr', name: 'France',         dial: '+33',  tz: 'Europe/Paris',           test: (d) => /^33[67]\d{8}$/.test(d) },
  { code: 'it', name: 'Italy',          dial: '+39',  tz: 'Europe/Rome',            test: (d) => /^39[3]\d{9}$/.test(d) },
  { code: 'es', name: 'Spain',          dial: '+34',  tz: 'Europe/Madrid',          test: (d) => /^34[67]\d{8}$/.test(d) },
  { code: 'nl', name: 'Netherlands',    dial: '+31',  tz: 'Europe/Amsterdam',       test: (d) => /^31[6]\d{8}$/.test(d) },
  { code: 'be', name: 'Belgium',        dial: '+32',  tz: 'Europe/Brussels',        test: (d) => /^32[4]\d{8}$/.test(d) },
  { code: 'ch', name: 'Switzerland',    dial: '+41',  tz: 'Europe/Zurich',          test: (d) => /^41[7]\d{8}$/.test(d) },
  { code: 'se', name: 'Sweden',         dial: '+46',  tz: 'Europe/Stockholm',       test: (d) => /^46[7]\d{8}$/.test(d) },
  { code: 'no', name: 'Norway',         dial: '+47',  tz: 'Europe/Oslo',            test: (d) => /^47[49]\d{7}$/.test(d) },
  { code: 'dk', name: 'Denmark',        dial: '+45',  tz: 'Europe/Copenhagen',      test: (d) => /^45[2-9]\d{7}$/.test(d) },
  { code: 'pl', name: 'Poland',         dial: '+48',  tz: 'Europe/Warsaw',          test: (d) => /^48[5-7]\d{8}$/.test(d) },
  { code: 'pt', name: 'Portugal',       dial: '+351', tz: 'Europe/Lisbon',          test: (d) => /^351[9]\d{8}$/.test(d) },
  { code: 'gr', name: 'Greece',         dial: '+30',  tz: 'Europe/Athens',          test: (d) => /^30[69]\d{9}$/.test(d) },
  { code: 'at', name: 'Austria',        dial: '+43',  tz: 'Europe/Vienna',          test: (d) => /^43[6]\d{9}$/.test(d) },
  { code: 'fi', name: 'Finland',        dial: '+358', tz: 'Europe/Helsinki',        test: (d) => /^358[4]\d{8}$/.test(d) },
  { code: 'ie', name: 'Ireland',        dial: '+353', tz: 'Europe/Dublin',          test: (d) => /^353[8]\d{8}$/.test(d) },
  { code: 'ru', name: 'Russia',         dial: '+7',   tz: 'Europe/Moscow',          test: (d) => /^7[79]\d{9}$/.test(d) },
  { code: 'us', name: 'USA',            dial: '+1',   tz: 'America/New_York',       test: (d) => /^1[2-9]\d{9}$/.test(d) || /^[2-9]\d{9}$/.test(d) },
  { code: 'ca', name: 'Canada',         dial: '+1',   tz: 'America/Toronto',        test: (d) => /^1[2-9]\d{9}$/.test(d) },
  { code: 'br', name: 'Brazil',         dial: '+55',  tz: 'America/Sao_Paulo',      test: (d) => /^55[1-9]\d{10}$/.test(d) },
  { code: 'mx', name: 'Mexico',         dial: '+52',  tz: 'America/Mexico_City',    test: (d) => /^52[1-9]\d{9}$/.test(d) },
  { code: 'ar', name: 'Argentina',      dial: '+54',  tz: 'America/Argentina/Buenos_Aires', test: (d) => /^54[9]\d{10}$/.test(d) },
  { code: 'in', name: 'India',          dial: '+91',  tz: 'Asia/Kolkata',           test: (d) => /^91[6-9]\d{9}$/.test(d) },
  { code: 'pk', name: 'Pakistan',       dial: '+92',  tz: 'Asia/Karachi',           test: (d) => /^92[3]\d{9}$/.test(d) },
  { code: 'cn', name: 'China',          dial: '+86',  tz: 'Asia/Shanghai',          test: (d) => /^86[1]\d{10}$/.test(d) },
  { code: 'jp', name: 'Japan',          dial: '+81',  tz: 'Asia/Tokyo',             test: (d) => /^81[7-9]\d{9}$/.test(d) },
  { code: 'kr', name: 'South Korea',    dial: '+82',  tz: 'Asia/Seoul',             test: (d) => /^82[1]\d{9}$/.test(d) },
  { code: 'id', name: 'Indonesia',      dial: '+62',  tz: 'Asia/Jakarta',           test: (d) => /^62[8]\d{9,10}$/.test(d) },
  { code: 'my', name: 'Malaysia',       dial: '+60',  tz: 'Asia/Kuala_Lumpur',      test: (d) => /^60[1]\d{8,9}$/.test(d) },
  { code: 'sg', name: 'Singapore',      dial: '+65',  tz: 'Asia/Singapore',         test: (d) => /^65[89]\d{7}$/.test(d) },
  { code: 'th', name: 'Thailand',       dial: '+66',  tz: 'Asia/Bangkok',           test: (d) => /^66[689]\d{8}$/.test(d) },
  { code: 'ng', name: 'Nigeria',        dial: '+234', tz: 'Africa/Lagos',           test: (d) => /^234[7-9]\d{9}$/.test(d) },
  { code: 'za', name: 'South Africa',   dial: '+27',  tz: 'Africa/Johannesburg',    test: (d) => /^27[6-8]\d{8}$/.test(d) },
  { code: 'ke', name: 'Kenya',          dial: '+254', tz: 'Africa/Nairobi',         test: (d) => /^254[7]\d{8}$/.test(d) },
  { code: 'au', name: 'Australia',      dial: '+61',  tz: 'Australia/Sydney',       test: (d) => /^61[4]\d{8}$/.test(d) },
  { code: 'nz', name: 'New Zealand',    dial: '+64',  tz: 'Pacific/Auckland',       test: (d) => /^64[2]\d{7,9}$/.test(d) },
];

export function detectCountry(phone) {
  if (!phone) return { code: 'eg', name: 'Egypt', dial: '+20', tz: 'Africa/Cairo' };
  let digits = phone.replace(/[\s\-\+\(\)\.]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  for (const c of COUNTRY_CODES) {
    if (c.test(digits)) return c;
  }
  return { code: 'eg', name: 'Egypt', dial: '+20', tz: 'Africa/Cairo' };
}

function localTime(tz) {
  try {
    return new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function PhoneFlag({ phone, size = 18 }) {
  const [show, setShow] = React.useState(false);
  const [time, setTime] = React.useState('');
  const country = detectCountry(phone);

  React.useEffect(() => {
    if (!show) return;
    setTime(localTime(country.tz));
    const t = setInterval(() => setTime(localTime(country.tz)), 10000);
    return () => clearInterval(t);
  }, [show, country.tz]);

  return (
    <span className="relative inline-flex items-center gap-1" style={{ verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <img
        src={`https://flagcdn.com/w20/${country.code}.png`}
        srcSet={`https://flagcdn.com/w40/${country.code}.png 2x`}
        alt={country.name}
        style={{ width: size, height: 'auto', borderRadius: 2, display: 'block', cursor: 'default' }}
      />
      <span className="text-xs" style={{ color: '#8A9BB0', fontSize: 10 }}>{country.dial}</span>
      {show && (
        <span className="absolute left-1/2 z-50 whitespace-nowrap rounded-lg px-3 py-2 pointer-events-none"
          style={{ bottom: '120%', transform: 'translateX(-50%)', backgroundColor: '#1E2530', border: '1px solid #2D3748', boxShadow: '0 4px 12px #0008' }}>
          <div className="text-xs font-bold" style={{ color: '#FFFFFF' }}>{country.name}</div>
          <div className="text-xs mt-0.5" style={{ color: '#C9A84C' }}>🕐 {time}</div>
        </span>
      )}
    </span>
  );
}
