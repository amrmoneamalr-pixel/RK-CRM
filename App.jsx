import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import ClientsBoard from './ClientsBoard';
import FollowUps from './FollowUps';
import Targets from './Targets';
import Reports from './Reports';
import OrgChart from './OrgChart';
import TeamPage from './TeamPage';
import Activity from './Activity';
import Settings from './Settings';
import { C } from './constants';

const VALID_TABS = ['dashboard', 'clients', 'orgchart', 'followups', 'targets', 'reports', 'activity', 'team', 'settings'];

const tabFromHash = () => {
  const h = window.location.hash.replace('#', '');
  return VALID_TABS.includes(h) ? h : 'dashboard';
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTabState] = useState(tabFromHash);
  const [leadFilter, setLeadFilter] = useState(null);

  const setTab = (t) => {
    setTabState(t);
    if (window.location.hash !== `#${t}`) window.location.hash = t;
  };

  useEffect(() => {
    const onHashChange = () => setTabState(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSetTab = (t) => {
    setLeadFilter(null);
    setTab(t);
  };

  const selectLeadCategory = (category) => {
    setLeadFilter(category);
    setTab('clients');
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
      // profile row is created by a DB trigger right after signup; retry once if it's not ready yet
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
    })();

    return () => {
      if (interval) clearInterval(interval);
    };
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
  const hasTeamAccess = isAdmin || ['sales_manager', 'team_leader'].includes(profile.title);

  return (
    <Layout profile={profile} tab={tab} setTab={handleSetTab} onSelectCategory={selectLeadCategory} onSignOut={handleSignOut}>
      {tab === 'dashboard' && <Dashboard userId={session.user.id} />}
      {tab === 'clients' && <ClientsBoard userId={session.user.id} isAdmin={isAdmin} hasTeamAccess={hasTeamAccess} leadFilter={leadFilter} onClearLeadFilter={() => setLeadFilter(null)} />}
      {tab === 'orgchart' && <OrgChart isAdmin={isAdmin} />}
      {tab === 'followups' && <FollowUps userId={session.user.id} />}
      {tab === 'targets' && <Targets userId={session.user.id} />}
      {tab === 'reports' && hasTeamAccess && <Reports />}
      {tab === 'team' && isAdmin && <TeamPage currentUserId={session.user.id} currentUserTitle={profile.title} />}
      {tab === 'activity' && hasTeamAccess && <Activity isAdmin={isAdmin} currentUserTitle={profile.title} />}
      {tab === 'settings' && isAdmin && <Settings />}
    </Layout>
  );
}
