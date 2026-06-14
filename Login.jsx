import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';

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
        setInfo('تم إنشاء الحساب بنجاح، تقدر تسجل دخول دلوقتي.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen flex items-center justify-center font-body px-4"
      style={{ backgroundColor: C.bg, color: C.text }}
    >
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <h1 className="font-display text-2xl font-extrabold mb-1" style={{ color: C.gold }}>RK CRM</h1>
        <p className="text-sm mb-6" style={{ color: C.muted }}>
          {mode === 'login' ? 'تسجيل الدخول لحسابك' : 'إنشاء حساب جديد'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="الاسم بالكامل"
              className={inputClass}
              style={inputStyle}
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className={inputClass}
            style={inputStyle}
            dir="ltr"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور (٦ أحرف على الأقل)"
            className={inputClass}
            style={inputStyle}
            dir="ltr"
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
            {loading ? '...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
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
          {mode === 'login' ? 'معندك حساب؟ اعمل حساب جديد' : 'عندك حساب؟ سجل دخول'}
        </button>
      </div>
    </div>
  );
}
