import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Users, Crown, Briefcase, Sparkles, User, ShieldCheck, Building2 } from 'lucide-react';

// A person "chip" — small card with name + role
function PersonChip({ person, small }) {
  const name = person.full_name || person.username || '—';
  const initials = name.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';
  return (
    <div
      className="rounded-lg flex items-center gap-2"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        padding: small ? '4px 8px' : '6px 10px',
        fontSize: small ? 11 : 12,
        color: C.text,
      }}
      title={name}
    >
      <div
        className="rounded-full flex items-center justify-center shrink-0 font-bold"
        style={{
          width: small ? 18 : 22,
          height: small ? 18 : 22,
          backgroundColor: '#3A3F4C',
          color: C.gold,
          fontSize: small ? 9 : 10,
        }}
      >
        {initials}
      </div>
      <span className="truncate">{name}</span>
    </div>
  );
}

// A colored branch header card
function BranchHeader({ label, subtitle, color, icon: Icon }) {
  return (
    <div
      className="rounded-xl text-center"
      style={{
        backgroundColor: color,
        color: '#fff',
        padding: '10px 12px',
      }}
    >
      <div className="flex items-center justify-center gap-1.5">
        {Icon && <Icon size={14} strokeWidth={2.2} />}
        <span className="font-display font-bold text-sm">{label}</span>
      </div>
      {subtitle && <div className="text-[11px] opacity-80 mt-0.5">{subtitle}</div>}
    </div>
  );
}

// Vertical connector line
const VLine = ({ h = 18 }) => (
  <div style={{ width: 1, height: h, backgroundColor: C.border, margin: '0 auto' }} />
);

// Horizontal connector line (for branching)
const HLine = ({ width = '80%' }) => (
  <div style={{ height: 1, backgroundColor: C.border, width, margin: '0 auto' }} />
);

export default function CompanyStructure({ profile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const isEditor = profile?.role === 'admin' || profile?.title === 'top_management';

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, title, role, team_leader_id, is_pool')
        .eq('is_pool', false)
        .order('full_name');
      setProfiles(data || []);
      setLoading(false);
    })();
  }, []);

  const byTitle = (t) => profiles.filter(p => p.title === t);

  const topMgmt = byTitle('top_management');
  const salesMgrs = byTitle('sales_manager');
  const teamLeaders = byTitle('team_leader');
  const salesReps = byTitle('sales');
  const operationTeam = byTitle('operation');
  const marketingTeam = byTitle('marketing');

  const salesUnderTL = (tlId) => salesReps.filter(s => s.team_leader_id === tlId);
  const unassignedSales = salesReps.filter(s => !s.team_leader_id);

  const totalPeople = profiles.length;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-lg">Company Structure</h2>
          <p className="text-xs" style={{ color: C.muted }}>
            {loading ? 'Loading…' : `${totalPeople} team members`}
            {isEditor ? ' · you can manage the structure' : ' · read-only view'}
          </p>
        </div>
      </div>

      {/* Tree container */}
      <div
        className="rounded-xl p-4 sm:p-6 overflow-x-auto"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
      >
        {/* Level 1: Top Management (root) */}
        <div className="flex justify-center">
          <div style={{ minWidth: 260, maxWidth: 320 }}>
            <BranchHeader
              label="Top Management"
              subtitle={topMgmt.length ? `${topMgmt.length} member${topMgmt.length > 1 ? 's' : ''}` : 'sees everything'}
              color="#B8852A"
              icon={Crown}
            />
            {topMgmt.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {topMgmt.map(p => <PersonChip key={p.id} person={p} />)}
              </div>
            )}
          </div>
        </div>

        {/* Connectors */}
        <VLine h={20} />
        <HLine width="80%" />

        {/* Level 2: 3 branches (Sales / Back Office / Marketing) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* ── Branch A: Sales tree ────────────────────────────── */}
          <div>
            <VLine h={16} />
            <BranchHeader
              label="Sales"
              subtitle={`${salesMgrs.length + teamLeaders.length + salesReps.length} people`}
              color="#6D4F8C"
              icon={Sparkles}
            />

            {/* Sales Managers row */}
            {salesMgrs.length > 0 && (
              <>
                <VLine h={12} />
                <div className="text-[10px] uppercase tracking-wide text-center mb-1" style={{ color: C.muted }}>
                  Sales Managers
                </div>
                <div className="space-y-1.5">
                  {salesMgrs.map(p => <PersonChip key={p.id} person={p} />)}
                </div>
              </>
            )}

            {/* Team Leaders row */}
            {teamLeaders.length > 0 && (
              <>
                <VLine h={12} />
                <div className="text-[10px] uppercase tracking-wide text-center mb-1" style={{ color: C.muted }}>
                  Team Leaders
                </div>
                <div className="space-y-3">
                  {teamLeaders.map(tl => {
                    const under = salesUnderTL(tl.id);
                    return (
                      <div key={tl.id} className="rounded-lg p-2" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                        <PersonChip person={tl} />
                        {under.length > 0 && (
                          <div className="mt-2 pl-3 space-y-1" style={{ borderLeft: `1px dashed ${C.border}` }}>
                            {under.map(s => <PersonChip key={s.id} person={s} small />)}
                          </div>
                        )}
                        {under.length === 0 && (
                          <div className="mt-1.5 pl-3 text-[10px]" style={{ color: C.muted }}>
                            No sales reps yet
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Unassigned sales */}
            {unassignedSales.length > 0 && (
              <>
                <VLine h={12} />
                <div className="text-[10px] uppercase tracking-wide text-center mb-1" style={{ color: C.muted }}>
                  Unassigned Sales
                </div>
                <div className="space-y-1.5">
                  {unassignedSales.map(s => <PersonChip key={s.id} person={s} small />)}
                </div>
              </>
            )}
          </div>

          {/* ── Branch B: Back Office ────────────────────────────── */}
          <div>
            <VLine h={16} />
            <BranchHeader
              label="Back Office"
              subtitle={`${operationTeam.length} member${operationTeam.length === 1 ? '' : 's'}`}
              color="#1E88B5"
              icon={Building2}
            />
            {operationTeam.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {operationTeam.map(p => <PersonChip key={p.id} person={p} />)}
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-center" style={{ color: C.muted }}>
                No members yet
              </div>
            )}
          </div>

          {/* ── Branch C: Marketing ────────────────────────────── */}
          <div>
            <VLine h={16} />
            <BranchHeader
              label="Marketing"
              subtitle={`${marketingTeam.length} member${marketingTeam.length === 1 ? '' : 's'}`}
              color="#C9714F"
              icon={Briefcase}
            />
            {marketingTeam.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {marketingTeam.map(p => <PersonChip key={p.id} person={p} />)}
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-center" style={{ color: C.muted }}>
                No members yet
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer note */}
      <div className="rounded-lg p-3 flex items-start gap-2 text-[11px]" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
        <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: C.gold }} />
        <div>
          <p><span style={{ color: C.text, fontWeight: 600 }}>Access rule:</span> Each level can see the leads and activity of everyone below it. Only <span style={{ color: C.text }}>Admins</span> and <span style={{ color: C.text }}>Top Management</span> can edit the structure or move people between branches.</p>
          <p className="mt-1 opacity-80">To assign a sales rep to a team leader, edit the sales rep from the <span style={{ color: C.gold }}>Users</span> page.</p>
        </div>
      </div>
    </div>
  );
}
