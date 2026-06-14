import React, { useEffect, useState } from 'react';
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
import { C } from './constants';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');

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

  if (!session) return <Login />;

  if (loading || !profile) {
    return (
      <div dir="ltr" className="min-h-screen flex items-center justify-center font-body" style={{ backgroundColor: C.bg, color: C.muted }}>
        Loading...
      </div>
    );
  }

  return (
    <Layout profile={profile} tab={tab} setTab={setTab}>
      {tab === 'dashboard' && <Dashboard userId={session.user.id} />}
      {tab === 'clients' && <ClientsBoard userId={session.user.id} isAdmin={profile.role === 'admin'} />}
      {tab === 'orgchart' && <OrgChart isAdmin={profile.role === 'admin'} />}
      {tab === 'followups' && <FollowUps userId={session.user.id} />}
      {tab === 'targets' && <Targets userId={session.user.id} />}
      {tab === 'reports' && profile.role === 'admin' && <Reports />}
      {tab === 'team' && profile.role === 'admin' && <TeamPage currentUserId={session.user.id} />}
    </Layout>
  );
}
