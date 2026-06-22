import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import ClientsBoard from './ClientsBoard';
import Reports from './Reports';
import OrgChart from './OrgChart';
import DevelopersBoard from './DevelopersBoard';
import TeamPage from './TeamPage';
import Activity from './Activity';
import Settings from './Settings';
import { C } from './constants';

const VALID_TABS = ['dashboard', 'clients', 'developers', 'orgchart', 'reports', 'activity', 'team', 'settings'];

const parseHash = () => {
  const raw = window.location.hash.replace('#', '');
  const [tabPart, queryPart] = raw.split('?');
  const tab = VALID_TABS.includes(tabPart) ? tabPart : 'dashboard';
  const params = new URLSearchParams(queryPart || '');
  const page = parseInt(params.get('page')) || 1;
  const clientId = params.get('client') || null;
  return { tab, page, clientId };
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTabState] = useState(() => parseHash().tab);
  const [leadFilter, setLeadFilter] = useState(null);
  const [clientsPage, setClientsPage] = useState(() => parseHash().page);
  const [openClientId, setOpenClientId] = useState(() => parseHash().clientId);

  const buildClientsHash = (page, clientId) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page);
    if (clientId) params.set('client', clientId);
    const qs = params.toString();
    return qs ? `clients?${qs}` : 'clients';
  };

  const setTab = (t) => {
    setTabState(t);
    const hash = t === 'clients' ? buildClientsHash(clientsPage, openClientId) : t;
    if (window.location.hash !== `#${hash}`) window.location.hash = hash;
  };

  const setClientsPageAndHash = (p) => {
    setClientsPage(p);
    window.location.hash = buildClientsHash(p, openClientId);
  };

  const setOpenClientAndHash = (clientId) => {
    setOpenClientId(clientId);
    window.location.hash = buildClientsHash(clientsPage, clientId);
  };

  useEffect(() => {
    const onHashChange = () => {
      const { tab: newTab, page: newPage, clientId: newClientId } = parseHash();
      setTabState(newTab);
      if (newTab === 'clients') {
        setClientsPage(newPage);
        setOpenClientId(newClientId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSetTab = (t) => {
    setLeadFilter(null);
    setTab(t);
  };

  const selectLeadCategory = (category) => {
    setLeadFilter(category === 'all' ? null : category);
    setClientsPage(1);
    setOpenClientId(null);
    setTabState('clients');
    window.location.hash = 'clients';
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      let { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!data) {
        await new Promise((r) => setTimeout(r, 1200));
        ({ data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single());
      }
      setProfile(data);
      setLoading(false);
    })();
  }, [session]);

  const sessionIdRef = useRef(null);

  useEffect(() => {
    if (!profile) return;
    let interval = null;
    (async () => {
      try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', profile.id)
          .is('ended_at', null)
          .gte('last_seen_at', fiveMinAgo)
          .order('last_seen_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          sessionIdRef.current = existing.id;
          await supabase.from('user_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', existing.id);
        } else {
          const { data } = await supabase.from('user_sessions').insert({ user_id: profile.id }).select().single();
          if (data) sessionIdRef.current = data.id;
        }

        interval = setInterval(() => {
          if (sessionIdRef.current) {
            supabase.from('user_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', sessionIdRef.current);
          }
        }, 2 * 60 * 1000);
      } catch (e) {
        console.warn('user_sessions not available:', e);
      }
    })();
    return () => { if (interval) clearInterval(interval); };
  }, [profile?.id]);

  const handleSignOut = async () => {
    if (sessionIdRef.current) {
      const now = new Date().toISOString();
      await supabase.from('user_sessions').update({ ended_at: now, last_seen_at: now }).eq('id', sessionIdRef.current);
    }
    await supabase.auth.signOut();
  };

  if (!session) return <Login />;

  if (loading || !profile) {
    return (
      <div dir="ltr" className="min-h-screen flex items-center justify-center font-body" style={{ backgroundColor: C.bg, color: C.muted }}>
        Loading...
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const hasTeamAccess = isAdmin || ['sales_manager', 'team_leader', 'top_management'].includes(profile.title);

  return (
    <Layout profile={profile} tab={tab} setTab={handleSetTab} onSelectCategory={selectLeadCategory} onSignOut={handleSignOut}>
      {tab === 'dashboard' && <Dashboard userId={session.user.id} />}
      {tab === 'clients' && (
        <ClientsBoard
          userId={session.user.id}
          isAdmin={isAdmin}
          hasTeamAccess={hasTeamAccess}
          leadFilter={leadFilter}
          onClearLeadFilter={() => setLeadFilter(null)}
          initialPage={clientsPage}
          onPageChange={setClientsPageAndHash}
          initialClientId={openClientId}
          onClientOpen={setOpenClientAndHash}
          onClientClose={() => setOpenClientAndHash(null)}
        />
      )}
      {tab === 'developers' && <DevelopersBoard isAdmin={isAdmin} />}
      {tab === 'orgchart' && <OrgChart isAdmin={isAdmin} />}
      {tab === 'reports' && hasTeamAccess && <Reports />}
      {tab === 'team' && isAdmin && <TeamPage currentUserId={session.user.id} currentUserTitle={profile.title} />}
      {tab === 'activity' && hasTeamAccess && <Activity isAdmin={isAdmin} currentUserTitle={profile.title} />}
      {tab === 'settings' && isAdmin && <Settings />}
    </Layout>
  );
}
