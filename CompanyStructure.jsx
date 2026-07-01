import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { C } from './constants';
import { Crown, Sparkles, Building2, Briefcase, ShieldCheck, User } from 'lucide-react';

// A single box in the org tree
function Node({ title, subtitle, color, icon: Icon, size = 'md' }) {
  const pad = size === 'lg' ? '10px 16px' : size === 'sm' ? '6px 10px' : '8px 12px';
  const width = size === 'lg' ? 220 : size === 'sm' ? 140 : 180;
  return (
    <div
      className="rounded-lg mx-auto"
      style={{
        backgroundColor: color || C.surface,
        border: `1px solid ${color ? color : C.border}`,
        color: color ? '#fff' : C.text,
        padding: pad,
        width,
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center justify-center gap-1.5">
        {Icon && <Icon size={size === 'lg' ? 15 : 12} strokeWidth={2.2} />}
        <span className={`font-display font-bold ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>{title}</span>
      </div>
      {subtitle && (
        <div className={`opacity-85 mt-0.5 ${size === 'lg' ? 'text-[11px]' : 'text-[10px]'}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// Container node that lists members inside (for Top Management, Back Office, Marketing)
function MemberListNode({ title, members, color, icon: Icon }) {
  return (
    <div
      className="rounded-lg mx-auto"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${color}`,
        width: 220,
        textAlign: 'center',
      }}
    >
      <div
        className="rounded-t-md flex items-center justify-center gap-1.5 py-2"
        style={{ backgroundColor: color, color: '#fff' }}
      >
        {Icon && <Icon size={13} strokeWidth={2.2} />}
        <span className="font-display font-bold text-xs">{title}</span>
      </div>
      <div className="py-2 px-2 space-y-1">
        {members.length === 0 && (
          <div className="text-[10px] py-1" style={{ color: C.muted }}>No members</div>
        )}
        {members.map(m => (
          <div key={m.id} className="text-[11px]" style={{ color: C.text }}>
            <div className="font-semibold truncate">{m.full_name || m.username || '—'}</div>
            {m.title && (
              <div className="text-[9px] opacity-70">{m.title.replace(/_/g, ' ')}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

  return (
    <div className="p-4 sm:p-6 space-y-4 overflow-x-auto">
      {/* CSS tree — inject once */}
      <style>{`
        .rk-tree, .rk-tree ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .rk-tree ul {
          padding-top: 26px;
          position: relative;
          display: flex;
          justify-content: center;
          gap: 22px;
        }
        .rk-tree li {
          padding: 26px 8px 0;
          position: relative;
        }
        .rk-tree li::before,
        .rk-tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 1.5px solid ${C.border};
          width: 50%;
          height: 26px;
        }
        .rk-tree li::after {
          right: auto;
          left: 50%;
          border-left: 1.5px solid ${C.border};
        }
        .rk-tree li:only-child::after,
        .rk-tree li:only-child::before {
          display: none;
        }
        .rk-tree li:only-child { padding-top: 26px; }
        .rk-tree li:first-child::before,
        .rk-tree li:last-child::after {
          border: 0 none;
        }
        .rk-tree li:last-child::before {
          border-right: 1.5px solid ${C.border};
          border-radius: 0 6px 0 0;
        }
        .rk-tree li:first-child::after {
          border-radius: 6px 0 0 0;
        }
        .rk-tree > ul::before,
        .rk-tree ul ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 1.5px solid ${C.border};
          width: 0;
          height: 26px;
        }
        .rk-tree > ul {
          padding-top: 0;
        }
        .rk-tree > ul::before { display: none; }
      `}</style>

      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-lg">Company Structure</h2>
        <p className="text-xs" style={{ color: C.muted }}>
          {loading ? 'Loading…' : `${profiles.length} team members`}
          {isEditor ? ' · you can manage the structure' : ' · read-only view'}
        </p>
      </div>

      {/* The tree */}
      <div
        className="rounded-xl p-4 sm:p-8"
        style={{ backgroundColor: C.surface + '80', border: `1px solid ${C.border}`, minWidth: 900 }}
      >
        <div className="rk-tree">
          <ul>
            <li>
              {/* Level 1: Top Management */}
              <MemberListNode
                title="Top Management"
                members={topMgmt}
                color="#B8852A"
                icon={Crown}
              />

              <ul>
                {/* ─── Branch A: Sales ─── */}
                <li>
                  <Node
                    title="Sales"
                    subtitle={salesMgrs.length ? `Sales Managers: ${salesMgrs.map(s => (s.full_name || s.username || '?').split(' ')[0]).join(', ')}` : 'No sales managers'}
                    color="#6D4F8C"
                    icon={Sparkles}
                    size="lg"
                  />
                  {teamLeaders.length > 0 && (
                    <ul>
                      {teamLeaders.map(tl => (
                        <li key={tl.id}>
                          <Node
                            title={tl.full_name || tl.username || '—'}
                            subtitle="Team Leader"
                            color="#2E7D5C"
                            icon={User}
                          />
                          {salesUnderTL(tl.id).length > 0 && (
                            <ul>
                              {salesUnderTL(tl.id).map(s => (
                                <li key={s.id}>
                                  <Node
                                    title={s.full_name || s.username || '—'}
                                    subtitle="Sales"
                                    size="sm"
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {unassignedSales.length > 0 && (
                    <ul>
                      <li>
                        <Node
                          title="Unassigned Sales"
                          subtitle={`${unassignedSales.length} rep${unassignedSales.length > 1 ? 's' : ''}`}
                          color="#8E8E8E"
                          icon={User}
                          size="sm"
                        />
                      </li>
                    </ul>
                  )}
                </li>

                {/* ─── Branch B: Back Office ─── */}
                <li>
                  <MemberListNode
                    title="Back Office"
                    members={operationTeam}
                    color="#1E88B5"
                    icon={Building2}
                  />
                </li>

                {/* ─── Branch C: Marketing ─── */}
                <li>
                  <MemberListNode
                    title="Marketing"
                    members={marketingTeam}
                    color="#C9714F"
                    icon={Briefcase}
                  />
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* Access note */}
      <div className="rounded-lg p-3 flex items-start gap-2 text-[11px]" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
        <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: C.gold }} />
        <div>
          <p><span style={{ color: C.text, fontWeight: 600 }}>Access:</span> This page is read-only. Only <span style={{ color: C.text }}>Admins</span> and <span style={{ color: C.text }}>Top Management</span> can move people between branches (coming soon).</p>
          <p className="mt-1 opacity-80">To assign a sales rep to a team leader, edit the sales rep from the <span style={{ color: C.gold }}>Users</span> page.</p>
        </div>
      </div>
    </div>
  );
}
