import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import logo from './logo.png';

const inputStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const inputClass = 'rounded-lg px-3 py-2 text-sm outline-none w-full';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setInfo('Account created successfully. You can log in now.');
        setMode('login');
      }
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
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <img src={logo} alt="RK Real Estate" className="h-16 mx-auto mb-3" />
        <h1 className="font-display text-2xl font-extrabold mb-1 text-center" style={{ color: C.gold }}>RK CRM</h1>
        <p className="text-sm mb-6 text-center" style={{ color: C.muted }}>
          {mode === 'login' ? 'Log in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
              style={inputStyle}
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
            style={inputStyle}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            className={inputClass}
            style={inputStyle}
            required
            minLength={6}
          />

          {error && <p className="text-xs" style={{ color: '#C9714F' }}>{error}</p>}
          {info && <p className="text-xs" style={{ color: '#7FA887' }}>{info}</p>}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-2.5 rounded-lg font-bold text-sm disabled:opacity-50"
            style={{ backgroundColor: C.gold, color: '#14181F' }}
          >
            {loading ? '...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setInfo('');
          }}
          className="w-full text-xs mt-4"
          style={{ color: C.muted }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
