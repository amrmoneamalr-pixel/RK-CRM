import React from 'react';
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode } from 'libphonenumber-js';

// Get country name from country code
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function detectCountry(phone) {
  if (!phone) return { code: 'EG', name: 'Egypt' };
  try {
    // Try parsing as-is first
    let parsed = parsePhoneNumberFromString(phone);
    // If no result, try with EG as default country
    if (!parsed || !parsed.country) {
      parsed = parsePhoneNumberFromString(phone, 'EG');
    }
    if (parsed && parsed.country) {
      const name = regionNames.of(parsed.country) || parsed.country;
      return { code: parsed.country.toLowerCase(), name };
    }
  } catch (e) {}
  return { code: 'eg', name: 'Egypt' };
}

export default function PhoneFlag({ phone, size = 18 }) {
  const [show, setShow] = React.useState(false);
  const { code, name } = detectCountry(phone);
  return (
    <span
      className="relative inline-flex items-center"
      style={{ verticalAlign: 'middle' }}
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
        <span
          className="absolute left-1/2 z-50 whitespace-nowrap rounded px-2 py-1 text-xs font-medium pointer-events-none"
          style={{ bottom: '110%', transform: 'translateX(-50%)', backgroundColor: '#1E2530', color: '#FFFFFF', border: '1px solid #2D3748', boxShadow: '0 2px 8px #0006' }}
        >
          {name}
        </span>
      )}
    </span>
  );
}
