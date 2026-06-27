import React from 'react';
import { C } from './constants';
import rkLogo from './rk-logo.png.png';
import { BarChart3, Users, Clock, Target, LogOut, Briefcase, Network, UserCog, Activity as ActivityIcon, Settings as SettingsIcon, Building2, Mail as MailIcon } from 'lucide-react';
import LeadPanels from './LeadPanels';
import TeamChat from './TeamChat';

// COVO CRM logo — inline SVG, matches covoprojects style (white card + colored bars + red subtitle)
function CovoLogo({ height = 56 }) {
  // viewBox: 200 x 80 → aspect ratio 2.5:1
  return (
    <svg viewBox="0 0 200 80" style={{ height, width: 'auto', display: 'block' }} xmlns="http://www.w3.org/2000/svg">
      {/* White rounded background card */}
      <rect x="0" y="0" width="200" height="80" rx="12" fill="#FFFFFF" />
      <text x="100" y="42" textAnchor="middle" fill="#14181F"
        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', fontWeight: 800, fontSize: '40px', letterSpacing: '-1px' }}>
        COVO
      </text>
      {/* Colored bars */}
      <rect x="42"  y="52" width="24" height="3.5" fill="#E63946" rx="1" />
      <rect x="73"  y="52" width="24" height="3.5" fill="#F4B860" rx="1" />
      <rect x="104" y="52" width="24" height="3.5" fill="#2EC4B6" rx="1" />
      <rect x="135" y="52" width="24" height="3.5" fill="#7FA887" rx="1" />
      {/* Subtitle */}
      <text x="100" y="71" textAnchor="middle" fill="#E63946"
        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '6px' }}>
        CRM
      </text>
    </svg>
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
