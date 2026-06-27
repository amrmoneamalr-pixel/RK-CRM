import React from 'react';
import { C } from './constants';
import rkLogo from './rk-logo.png.png';
import { BarChart3, Users, Clock, Target, LogOut, Briefcase, Network, UserCog, Activity as ActivityIcon, Settings as SettingsIcon, Building2, Mail as MailIcon } from 'lucide-react';
import LeadPanels from './LeadPanels';
import TeamChat from './TeamChat';

// COVO CRM logo — identical to COVO Projects
 function CovoLogo({ size = "md" }) {
  const sizes = {
    sm: {
      word: "text-lg",
      bar: "w-[18px] h-[2.5px]",
      sub: "text-[7px] tracking-[3px]",
    },
    md: {
      word: "text-2xl",
      bar: "w-[28px] h-[3px]",
      sub: "text-[9px] tracking-[4px]",
    },
    lg: {
      word: "text-4xl",
      bar: "w-[10px] h-[4px]",
      sub: "text-xs tracking-[6px]",
    },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-start select-none">
      {/* COVO */}
      <span
        className={`${s.word} font-black italic text-white leading-none tracking-wider`}
      >
        COVO
      </span>

      {/* Brand Bars */}
      <div className="flex gap-[2px] my-[4px]">
        <span
          className={`${s.bar} rounded-full`}
          style={{ background: "#5BE0EF" }}
        />
        <span
          className={`${s.bar} rounded-full`}
          style={{ background: "#E8196A" }}
        />
        <span
          className={`${s.bar} rounded-full`}
          style={{ background: "#F0A500" }}
        />
        <span
          className={`${s.bar} rounded-full`}
          style={{ background: "#00C9A7" }}
        />
      </div>

      {/* CRM */}
      <span
        className={`${s.sub} uppercase font-medium text-white`}
        style={{
          letterSpacing: "0.4em",
        }}
      >
        CRM
      </span>
    </div>
  );
}
export default function Layout({ profile, tab, setTab, onSelectCategory, onSignOut, children }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'developers', label: 'Developers', icon: Building2 },
    { id: 'orgchart', label: 'Company Structure', icon: Network },
  ];

  const isAdmin = profile.role === 'admin';
  const hasTeamAccess = isAdmin || ['sales_manager', 'team_leader', 'top_management'].includes(profile.title);

  if (hasTeamAccess) {
    tabs.push({ id: 'reports', label: 'Reports', icon: Briefcase });
    tabs.push({ id: 'activity', label: 'Activity', icon: ActivityIcon });
  }

  tabs.push({ id: 'mail', label: 'Mail', icon: MailIcon });

  if (isAdmin) {
    tabs.push({ id: 'team', label: 'Users', icon: UserCog });
    tabs.push({ id: 'settings', label: 'Settings', icon: SettingsIcon });
  }

  return (
    <div dir="ltr" lang="en" className="min-h-screen font-body sm:flex" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* Sidebar (desktop) */}
      <aside className="hidden sm:flex flex-col w-60 shrink-0 border-r sticky top-0 h-screen p-4" style={{ borderColor: C.border }}>
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CovoLogo height={50} />
            <span style={{ color: C.border, fontSize: '40px', fontWeight: 200, lineHeight: 1 }}>|</span>
            <img
              src={rkLogo}
              alt="RK Real Estate"
              style={{ height: '46px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <p className="text-xs mt-1 text-center" style={{ color: C.muted }}>
            {profile.full_name || 'Welcome'}{profile.role === 'admin' ? ' · Admin' : ''}
          </p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => { e.preventDefault(); setTab(t.id); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors no-underline"
                style={{ backgroundColor: active ? C.gold : 'transparent', color: active ? '#14181F' : C.muted }}
              >
                <Icon size={16} /> {t.label}
              </a>
            );
          })}
        </nav>
        <button onClick={onSignOut} className="flex items-center gap-2 text-sm mt-4 px-3 py-2" style={{ color: C.muted }}>
          <LogOut size={15} /> Sign out
        </button>
      </aside>

      {/* Header + nav (mobile) */}
      <header className="sm:hidden sticky top-0 z-20 border-b" style={{ backgroundColor: C.bg, borderColor: C.border }}>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CovoLogo height={42} />
                <span style={{ color: C.border, fontSize: '34px', fontWeight: 200, lineHeight: 1 }}>|</span>
                <img
                  src={rkLogo}
                  alt="RK Real Estate"
                  style={{ height: '38px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: C.muted }}>
                {profile.full_name || 'Welcome'}{profile.role === 'admin' ? ' · Admin' : ''}
              </p>
            </div>
            <button onClick={onSignOut} className="flex items-center gap-1 text-xs shrink-0" style={{ color: C.muted }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
          <nav className="flex gap-1 mt-4 overflow-x-auto -mx-1 px-1 pb-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  onClick={(e) => { e.preventDefault(); setTab(t.id); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 no-underline"
                  style={{ backgroundColor: active ? C.gold : 'transparent', color: active ? '#14181F' : C.muted }}
                >
                  <Icon size={15} /> {t.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <main className="px-4 py-5 pb-24 overflow-x-auto">
          {tab && {
            clients: 'Clients',
            developers: 'Developers',
            orgchart: 'Company Structure',
            team: 'Users',
            reports: 'Reports',
            activity: 'Activity',
            settings: 'Settings',
            mail: 'Mail',
          }[tab] && (
            <h1 className="font-display font-bold text-2xl mb-5" style={{ color: C.text }}>
              {{
                clients: 'Clients',
                developers: 'Developers',
                orgchart: 'Company Structure',
                team: 'Users',
                reports: 'Reports',
                activity: 'Activity',
                settings: 'Settings',
                mail: 'Mail',
              }[tab]}
            </h1>
          )}
          {children}
        </main>
      </div>

      {/* Right sidebar: tabs panels (top) + chat (bottom) */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l sticky top-0 h-screen" style={{ borderColor: C.border }}>
        {(tab === 'dashboard' || tab === 'clients') ? (
          <>
            <div className="overflow-y-auto" style={{ height: '50%' }}>
              <LeadPanels userId={profile.id} isAdmin={profile.role === 'admin'} onSelectCategory={onSelectCategory} inSidebar />
            </div>
            <div style={{ height: '50%' }}>
              <TeamChat profile={profile} />
            </div>
          </>
        ) : (
          <div style={{ height: '100%' }}>
            <TeamChat profile={profile} />
          </div>
        )}
      </aside>
    </div>
  );
}
