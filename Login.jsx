import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import rkLogo from './rk-logo.png.png';
import { Eye, EyeOff } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

function CovoLogo({ height = 90 }) {
  return (
    <svg viewBox="0 0 420 160" height={height} xmlns="http://www.w3.org/2000/svg">
      {/* Elephant */}
      <g transform="translate(10, 10)">
        {/* Body */}
        <ellipse cx="75" cy="100" rx="45" ry="38" fill="none" stroke="#111" strokeWidth="3.5"/>
        {/* Head */}
        <circle cx="105" cy="62" r="28" fill="none" stroke="#111" strokeWidth="3.5"/>
        {/* Ear */}
        <ellipse cx="84" cy="58" rx="16" ry="20" fill="none" stroke="#111" strokeWidth="3"/>
        {/* Eye */}
        <circle cx="112" cy="56" r="3" fill="#111"/>
        {/* Trunk */}
        <path d="M118 75 Q135 90 128 108 Q122 120 115 118" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round"/>
        {/* Tail */}
        <path d="M32 95 Q18 100 20 112" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
        {/* Legs */}
        <rect x="45" y="130" width="14" height="22" rx="7" fill="none" stroke="#111" strokeWidth="3"/>
        <rect x="65" y="132" width="14" height="20" rx="7" fill="none" stroke="#111" strokeWidth="3"/>
        <rect x="84" y="132" width="14" height="20" rx="7" fill="none" stroke="#111" strokeWidth="3"/>
        <rect x="103" y="130" width="14" height="22" rx="7" fill="none" stroke="#111" strokeWidth="3"/>
      </g>

      {/* COVO text */}
      <text x="195" y="88" fontFamily="'Arial Black', Arial, sans-serif" fontWeight="900" fontSize="58" fill="#111" letterSpacing="-1">COVO</text>

      {/* 4 colored bars */}
      <rect x="195" y="96" width="38" height="6" rx="3" fill="#6366f1"/>
      <rect x="240" y="96" width="38" height="6" rx="3" fill="#ec4899"/>
      <rect x="285" y="96" width="38" height="6" rx="3" fill="#f59e0b"/>
      <rect x="330" y="96" width="38" height="6" rx="3" fill="#10b981"/>

      {/* CRM */}
      <text x="240" y="120" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="15" fill="#555" letterSpacing="6">C R M</text>

      {/* Divider */}
      <line x1="195" y1="128" x2="375" y2="128" stroke="#ccc" strokeWidth="1"/>

      {/* Tagline */}
      <text x="195" y="145" fontFamily="Arial, sans-serif" fontSize="10" fill="#888">Connecting Opportunities · Visualizing Outcomes</text>
    </svg>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: email, error: lookupError } = await supabase.rpc('get_email_for_username', {
        p_username: username.trim(),
      });
      if (lookupError || !email) throw new Error('Invalid username or password');

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Invalid username or password');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="ltr"
      lang="en"
      className="min-h-screen flex items-center justify-center font-body px-4"
      style={{ backgroundColor: C.bg, color: C.text }}
    >
      {/* RK Logo — top left fixed */}
      <div className="fixed top-4 left-4">
        <img src={rkLogo} alt="RK Real Estate" className="h-14 object-contain" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>

        {/* COVO SVG Logo */}
        <div className="flex justify-center mb-4">
          <CovoLogo height={90} />
        </div>

        <p className="text-sm mb-6 text-center" style={{ color: C.muted }}>
          Log in to your account
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className={inputClass}
            style={inputStyle}
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputClass}
              style={{ ...inputStyle, paddingRight: '2.25rem' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: C.muted }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-xs" style={{ color: '#C9714F' }}>{error}</p>}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-2.5 rounded-lg font-bold text-sm disabled:opacity-50"
            style={{ backgroundColor: C.gold, color: '#14181F' }}
          >
            {loading ? '...' : 'Log in'}
          </button>
        </form>

        <p className="text-xs mt-4 text-center" style={{ color: C.muted }}>
          Don't have an account? Ask your admin to create one for you.
        </p>
      </div>
    </div>
  );
}
