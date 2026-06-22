import React from 'react';
import { C } from './constants';
import rkLogo from './rk-logo.png.png';
import covoSidebar from './covo-only.png';
import { BarChart3, Users, Clock, Target, LogOut, Briefcase, Network, UserCog, Activity as ActivityIcon, Settings as SettingsIcon, Building2, Mail } from 'lucide-react';
import LeadPanels from './LeadPanels';

export default function Layout({ profile, tab, setTab, onSelectCategory, onSignOut, children }) {
  const tabs = [
    { id: 'dashboard',  label: 'Dashboard',         icon: BarChart3 },
    { id: 'clients',    label: 'Clients',            icon: Users },
    { id: 'developers', label: 'Developers',         icon: Building2 },
    { id: 'orgchart',   label: 'Company Structure',  icon: Network },
  ];
  const isAdmin = profile.role === 'admin';
  const hasTeamAccess = isAdmin || ['sales_manager', 'team_leader', 'top_management'].includes(profile.title);
  if (hasTeamAccess) {
    tabs.push({ id: 'activity', label: 'Activity', icon: ActivityIcon });
    tabs.push({ id: 'reports', label: 'Reports', icon: Briefcase });
  }
  tabs.push({ id: 'mail', label: 'Mail', icon: Mail });
  if (isAdmin) {
    tabs.push({ id: 'team', label: 'Users', icon: UserCog });
    tabs.push({ id: 'settings', label: 'Settings', icon: SettingsIcon });
  }

  return (
    <div dir="ltr" lang="en" className="min-h-screen font-body sm:flex" style={{ backgroundColor: C.bg, color: C.text }}>
      {/* Sidebar (desktop) */}
      <aside className="hidden sm:flex flex-col w-60 shrink-0 border-r sticky top-0 h-screen p-4" style={{ borderColor: C.border }}>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img src={covoSidebar} alt="COVO CRM" style={{ height: '44px', objectFit: 'contain' }} />
            <div style={{ width: '1px', height: '36px', backgroundColor: '#ffffff30' }} />
            <img src={rkLogo} alt="RK Real Estate" style={{ height: '56px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <p className="text-xs" style={{ color: C.muted }}>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={covoSidebar} alt="COVO CRM" style={{ height: '36px', objectFit: 'contain' }} />
              <div style={{ width: '1px', height: '28px', backgroundColor: '#ffffff30' }} />
              <img src={rkLogo} alt="RK Real Estate" style={{ height: '52px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              <p className="text-xs" style={{ color: C.muted }}>
                {profile.full_name || 'Welcome'}{profile.role === 'admin' ? ' · Admin' : ''}
              </p>
            </div>
            <button onClick={onSignOut} className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
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

          {/* LeadPanels as horizontal row on mobile — only on clients/dashboard */}
          {(tab === 'clients' || tab === 'dashboard') && (
            <div className="flex gap-2 mt-2 overflow-x-auto -mx-1 px-1 pb-2">
              <LeadPanels userId={profile.id} isAdmin={profile.role === 'admin'} onSelectCategory={onSelectCategory} mobileRow />
            </div>
          )}
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

      {(tab === 'dashboard' || tab === 'clients') && (
        <LeadPanels userId={profile.id} isAdmin={profile.role === 'admin'} onSelectCategory={onSelectCategory} />
      )}
    </div>
  );
}
