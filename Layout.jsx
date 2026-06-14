import React from 'react';
import { supabase } from '../supabaseClient';
import { C } from '../lib/constants';
import { BarChart3, Users, Clock, Target, LogOut, Briefcase } from 'lucide-react';

export default function Layout({ profile, tab, setTab, children }) {
  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
    { id: 'clients', label: 'العملاء', icon: Users },
    { id: 'followups', label: 'المتابعات', icon: Clock },
    { id: 'targets', label: 'الأهداف الشهرية', icon: Target },
  ];
  if (profile.role === 'admin') {
    tabs.push({ id: 'reports', label: 'تقارير الفريق', icon: Briefcase });
  }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen font-body" style={{ backgroundColor: C.bg, color: C.text }}>
      <header className="sticky top-0 z-20 border-b" style={{ backgroundColor: C.bg, borderColor: C.border }}>
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight" style={{ color: C.gold }}>RK CRM</h1>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                {profile.full_name || 'مرحبًا'}{profile.role === 'admin' ? ' · أدمن' : ''}
              </p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
              <LogOut size={14} /> خروج
            </button>
          </div>

          <nav className="flex gap-1 mt-4 overflow-x-auto -mx-1 px-1 pb-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0"
                  style={{ backgroundColor: active ? C.gold : 'transparent', color: active ? '#14181F' : C.muted }}
                >
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-5 pb-24">{children}</main>
    </div>
  );
}
