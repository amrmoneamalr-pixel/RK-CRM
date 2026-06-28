import React, { useState, useEffect } from 'react';
import { C } from './constants';
import { supabase } from './supabaseClient';
import rkLogo from './rk-logo.png.png';
import { BarChart3, Users, Clock, Target, LogOut, Briefcase, Network, UserCog, Activity as ActivityIcon, Settings as SettingsIcon, Building2, Mail as MailIcon } from 'lucide-react';
import LeadPanels from './LeadPanels';
import PoolPanels from './PoolPanels';
import TeamChat from './TeamChat';

// COVO CRM logo — identical to COVO Projects
 function CovoLogo({ size = "md" }) {
  const sizes = {
    sm: {
      word: "text-lg",
      bar: "w-[12px] h-[2.5px]",
      sub: "text-[7px] tracking-[3px]",
    },
    md: {
      word: "text-xl",
      bar: "w-[22px] h-[3px]",
      sub: "text-[10px] tracking-[4px]",
    },
    lg: {
      word: "text-4xl",
      bar: "w-[28px] h-[4px]",
      sub: "text-xs tracking-[6px]",
    },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-start select-none">
      {/* COVO */}
      <span
        className={`${s.word} font-black italic text-white leading-none tracking-wider`}
        style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif" }}
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
  const showPoolsTab = profile.role === 'admin' || profile.title === 'top_management';
  const [sidebarTab, setSidebarTab] = useState('sales');
  const [allActive, setAllActive] = useState(false);
  const [salesTotal, setSalesTotal] = useState(null);
  const [poolsTotal, setPoolsTotal] = useState(null);

  // Wrap onSelectCategory so clicking a panel inside Sales/Pools deactivates All
  const onSelectFromPanel = (cat) => {
    setAllActive(false);
    if (onSelectCategory) onSelectCategory(cat);
  };

  useEffect(() => {
    if (!showPoolsTab) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: pools } = await supabase.from('profiles').select('id').eq('is_pool', true);
        const poolIdsArr = (pools || []).map(p => p.id);

        let poolsCnt = 0;
        if (poolIdsArr.length > 0) {
          const { count } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .in('owner_id', poolIdsArr);
          poolsCnt = count || 0;
        }

        let salesQ = supabase.from('clients').select('*', { count: 'exact', head: true });
        if (poolIdsArr.length > 0) {
          salesQ = salesQ.not('owner_id', 'in', '(' + poolIdsArr.join(',') + ')');
        }
        const { count: salesCnt } = await salesQ;

        if (!cancelled) {
          setPoolsTotal(poolsCnt);
          setSalesTotal(salesCnt || 0);
        }
      } catch (e) {
        console.warn('totals load failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [showPoolsTab, tab]);
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
            <CovoLogo size="md" />
            <span style={{ color: C.border, fontSize: '50px', fontWeight: 200, lineHeight: 1 }}>|</span>
            <img
              src={rkLogo}
              alt="RK Real Estate"
              style={{ height: '58px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
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
                <CovoLogo size="sm" />
                <span style={{ color: C.border, fontSize: '40px', fontWeight: 200, lineHeight: 1 }}>|</span>
                <img
                  src={rkLogo}
                  alt="RK Real Estate"
                  style={{ height: '48px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
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
            <div style={{ height: '50%', display: 'flex', flexDirection: 'column' }}>
              {showPoolsTab && (
                <>
                  <div className="flex justify-center p-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <button
                      onClick={() => {
                        setAllActive(true);
                        if (onSelectCategory) onSelectCategory(null);
                        window.dispatchEvent(new CustomEvent('rk-set-view-mode', { detail: { mode: 'all' } }));
                      }}
                      className="px-8 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: allActive ? C.gold : C.surface,
                        color: allActive ? '#14181F' : C.muted,
                        border: `1px solid ${allActive ? C.gold : C.border}`,
                      }}
                      title="Show all leads (sales + pools)"
                    >
                      All{(salesTotal !== null && poolsTotal !== null) && <span className="ml-1 opacity-75">({salesTotal + poolsTotal})</span>}
                    </button>
                  </div>
                  <div className="flex gap-1 p-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <button
                      onClick={() => {
                        setAllActive(false);
                        setSidebarTab('sales');
                        if (onSelectCategory) onSelectCategory(null);
                        window.dispatchEvent(new CustomEvent('rk-set-view-mode', { detail: { mode: 'sales' } }));
                      }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: (sidebarTab === 'sales' && !allActive) ? C.gold : C.surface,
                        color: (sidebarTab === 'sales' && !allActive) ? '#14181F' : C.muted,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      Sales{salesTotal !== null && <span className="ml-1 opacity-75">({salesTotal})</span>}
                    </button>
                    <button
                      onClick={() => {
                        setAllActive(false);
                        setSidebarTab('pools');
                        if (onSelectCategory) onSelectCategory(null);
                        window.dispatchEvent(new CustomEvent('rk-set-view-mode', { detail: { mode: 'pools' } }));
                      }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: (sidebarTab === 'pools' && !allActive) ? C.gold : C.surface,
                        color: (sidebarTab === 'pools' && !allActive) ? '#14181F' : C.muted,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      Pools{poolsTotal !== null && <span className="ml-1 opacity-75">({poolsTotal})</span>}
                    </button>
                  </div>
                </>
              )}
              <div className="overflow-y-auto flex-1">
                {showPoolsTab && sidebarTab === 'pools' ? (
                  <PoolPanels onSelectCategory={onSelectFromPanel} />
                ) : (
                  <LeadPanels userId={profile.id} isAdmin={profile.role === 'admin'} onSelectCategory={onSelectFromPanel} inSidebar />
                )}
              </div>
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
