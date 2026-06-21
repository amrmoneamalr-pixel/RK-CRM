import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import logo from './logo.png';
import covoLogo from './covo-logo.png';
import rkLogo from './rk-logo.png';
import { Eye, EyeOff } from 'lucide-react';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

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
      {/* RK Logo — top left, fixed */}
      <div className="fixed top-4 left-4">
        <img src={rkLogo} alt="RK Real Estate" className="h-14" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        {/* COVO CRM Logo in center of card */}
        <img src={covoLogo} alt="COVO CRM" className="h-20 mx-auto mb-4 object-contain" />

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
