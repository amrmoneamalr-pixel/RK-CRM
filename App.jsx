import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientsBoard from './components/ClientsBoard';
import FollowUps from './components/FollowUps';
import Targets from './components/Targets';
import Reports from './components/Reports';
import { C } from './lib/constants';

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
      <div dir="rtl" className="min-h-screen flex items-center justify-center font-body" style={{ backgroundColor: C.bg, color: C.muted }}>
        جاري التحميل...
      </div>
    );
  }

  return (
    <Layout profile={profile} tab={tab} setTab={setTab}>
      {tab === 'dashboard' && <Dashboard userId={session.user.id} />}
      {tab === 'clients' && <ClientsBoard userId={session.user.id} />}
      {tab === 'followups' && <FollowUps userId={session.user.id} />}
      {tab === 'targets' && <Targets userId={session.user.id} />}
      {tab === 'reports' && profile.role === 'admin' && <Reports />}
    </Layout>
  );
}
