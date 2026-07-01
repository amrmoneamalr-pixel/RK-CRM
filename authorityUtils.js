// authorityUtils.js
// Central permission library. Single source of truth for all 14 permissions
// defined in the Covo Policy sheet. Every page should import from here rather
// than duplicate role-check logic.
//
// USAGE:
//   import { canDeleteUser, getClientVisibilityScope } from './authorityUtils';
//   if (!canDeleteUser(currentProfile, targetProfile)) {
//     showAuthorityToast(); return;
//   }
//
// PROFILE SHAPE EXPECTED:
//   { id, full_name, title, role, is_system, team_leader_id, ... }

// -----------------------------------------------------------------------------
// TIER HELPERS (private-ish, exported for occasional direct use)
// -----------------------------------------------------------------------------

export const isSystem = (p) => !!(p && p.is_system === true);

export const isTopMgmt = (p) => !!(p && p.title === 'top_management');

export const isAdminTitle = (p) => !!(p && p.title === 'admin');

// The three top tiers (System > Top Mgmt > Admin) share almost all "see all" perms.
export const isTopTier = (p) => isSystem(p) || isTopMgmt(p) || isAdminTitle(p);

// Back-office roles that see reports/activity but not clients
export const isBackOffice = (p) => !!(p && ['operation', 'hr'].includes(p.title));

// -----------------------------------------------------------------------------
// PERMISSION 1: Delete User
// System: no one can delete
// Top Mgmt: only Top Mgmt + System can delete Top Mgmt
// Admin:   only Top Mgmt + System can delete Admin
// Others:  Top Mgmt + System + Admin can delete
// Nobody can delete themselves (also enforced separately with dedicated toast).
// -----------------------------------------------------------------------------
export const canDeleteUser = (current, target) => {
  if (!current || !target) return false;
  if (current.id === target.id) return false;          // no self-delete
  if (isSystem(target)) return false;                  // system is undeletable
  if (isTopMgmt(target)) return isSystem(current) || isTopMgmt(current);
  if (isAdminTitle(target)) return isSystem(current) || isTopMgmt(current);
  // All other targets: system + top_mgmt + admin can delete
  return isTopTier(current);
};

// Reason string for UI toasts when delete is denied
export const deleteUserDenialReason = (current, target) => {
  if (!current || !target) return 'This is not your authority';
  if (current.id === target.id) return "You can't delete yourself";
  if (isSystem(target)) return 'System users cannot be deleted';
  return 'This is not your authority';
};

// -----------------------------------------------------------------------------
// PERMISSION 2 + 10: See Clients / See All Clients (scoping)
// Returns a scope descriptor used by ClientsBoard / Dashboard / Reports.
// -----------------------------------------------------------------------------
// Possible return values:
//   'all'              -> System, Top Mgmt, Admin
//   'sales_manager'    -> Sales Manager: himself + team leaders under him + all their sales
//   'team'             -> Sales Supervisor, Team Leader: himself + direct sales
//   'own'              -> Sales: only himself
//   'own_created'      -> Marketing: only clients HE created
//   'marketing_manager'-> Marketing Manager: created by him + his marketing team
//   'none'             -> Operation, HR, Accountant
export const getClientVisibilityScope = (p) => {
  if (!p) return 'none';
  if (isTopTier(p)) return 'all';
  const t = p.title;
  if (t === 'sales_manager')     return 'sales_manager';
  if (t === 'sales_supervisor')  return 'team';
  if (t === 'team_leader')       return 'team';
  if (t === 'sales')             return 'own';
  if (t === 'marketing')         return 'own_created';
  if (t === 'marketing_manager') return 'marketing_manager';
  // operation, hr, accountant, unknown
  return 'none';
};

export const canSeeAllClients = (p) => getClientVisibilityScope(p) === 'all';

// -----------------------------------------------------------------------------
// PERMISSION 3: See / Export Reports
// System / Top Mgmt / Admin / Operation / HR: yes (all data)
// Sales Manager: yes (his scope)
// Sales Supervisor / Team Leader: yes (team only)
// Sales: yes (self only)
// Marketing / Accountant: no
// -----------------------------------------------------------------------------
export const canSeeReports = (p) => {
  if (!p) return false;
  if (isTopTier(p)) return true;
  if (isBackOffice(p)) return true;
  const t = p.title;
  return ['sales_manager', 'sales_supervisor', 'team_leader', 'sales'].includes(t);
};

// -----------------------------------------------------------------------------
// PERMISSION 4: Import / Export Data
// Only System, Top Mgmt, Admin.
// -----------------------------------------------------------------------------
export const canImportExport = (p) => isTopTier(p);

// -----------------------------------------------------------------------------
// PERMISSION 5: Resign Clients (rotate/reassign)
// Returns:
//   'any'                        -> System, Top Mgmt, Admin
//   'team'                       -> Sales Manager, Sales Supervisor, Team Leader
//   'marketing_new_fresh_once'   -> Marketing (new-fresh pool, once per client only)
//   'none'                       -> everyone else
// -----------------------------------------------------------------------------
export const getResignScope = (p) => {
  if (!p) return 'none';
  if (isTopTier(p)) return 'any';
  const t = p.title;
  if (['sales_manager', 'sales_supervisor', 'team_leader'].includes(t)) return 'team';
  if (t === 'marketing') return 'marketing_new_fresh_once';
  return 'none';
};

export const canResignAny = (p) => getResignScope(p) === 'any';

// -----------------------------------------------------------------------------
// PERMISSION 6: See Activity
// System / Top Mgmt / Admin / Operation / HR: all
// Sales Manager / Sales Supervisor / Team Leader: team only
// Marketing / Sales / Accountant: no
// -----------------------------------------------------------------------------
export const getActivityScope = (p) => {
  if (!p) return 'none';
  if (isTopTier(p)) return 'all';
  if (isBackOffice(p)) return 'all';
  const t = p.title;
  if (['sales_manager', 'sales_supervisor', 'team_leader'].includes(t)) return 'team';
  return 'none';
};

export const canSeeActivity = (p) => getActivityScope(p) !== 'none';

// -----------------------------------------------------------------------------
// PERMISSION 7: See Users
// System / Top Mgmt: all
// Admin: all EXCEPT System + Top Mgmt
// Others: none
// -----------------------------------------------------------------------------
export const canSeeUsers = (p) => isTopTier(p);

// Filter a user list based on the current user's permissions.
// The 'admin' title cannot see System and Top Mgmt users; the current user
// always sees themselves regardless.
export const filterVisibleUsers = (current, allProfiles) => {
  if (!current || !Array.isArray(allProfiles)) return [];
  if (isSystem(current) || isTopMgmt(current)) return allProfiles;
  if (isAdminTitle(current)) {
    return allProfiles.filter(
      (u) => u.id === current.id || (!isSystem(u) && !isTopMgmt(u))
    );
  }
  // Non-authorized users only see themselves
  return allProfiles.filter((u) => u.id === current.id);
};

// -----------------------------------------------------------------------------
// PERMISSION 8: See Credentials (passwords)
// Same rules as See Users.
// -----------------------------------------------------------------------------
export const canSeeCredentials = (p) => canSeeUsers(p);

// Whether the current user can see the credentials of a specific target user.
export const canSeeCredentialsOf = (current, target) => {
  if (!current || !target) return false;
  if (current.id === target.id) return true; // self always
  if (isSystem(current) || isTopMgmt(current)) return true;
  if (isAdminTitle(current)) return !isSystem(target) && !isTopMgmt(target);
  return false;
};

// -----------------------------------------------------------------------------
// PERMISSION 9: See Pools
// Only System, Top Mgmt, Admin.
// -----------------------------------------------------------------------------
export const canSeePools = (p) => isTopTier(p);

// -----------------------------------------------------------------------------
// PERMISSION 11: See Dashboard (scoping)
// Mirrors client visibility scope.
//   'all'              -> full aggregate dashboard
//   'sales_manager'    -> Sales Manager: himself + team scope
//   'team'             -> Sales Supervisor, Team Leader: himself + team
//   'own'              -> Sales: only his own dashboard
//   'none'             -> Operation, HR, Marketing, Marketing Manager, Accountant
// -----------------------------------------------------------------------------
export const getDashboardScope = (p) => {
  if (!p) return 'none';
  const clientScope = getClientVisibilityScope(p);
  // Marketing / Marketing Manager see clients they created but do NOT see dashboard
  if (['own_created', 'marketing_manager'].includes(clientScope)) return 'none';
  return clientScope;
};

export const canSeeDashboard = (p) => getDashboardScope(p) !== 'none';

// -----------------------------------------------------------------------------
// PERMISSION 12: Delete messages in mail/chat
// Only System, Top Mgmt, Admin.
// -----------------------------------------------------------------------------
export const canDeleteAnyMessage = (p) => isTopTier(p);

// -----------------------------------------------------------------------------
// PERMISSION 13: Control Settings
// Only System, Top Mgmt, Admin.
// -----------------------------------------------------------------------------
export const canControlSettings = (p) => isTopTier(p);

// -----------------------------------------------------------------------------
// PERMISSION 14: See Done Deals + Value
// Everyone can see deals except Marketing (only for leads he created).
// Marketing Manager sees deals for leads his team created.
// -----------------------------------------------------------------------------
export const canSeeAllDeals = (p) => {
  if (!p) return false;
  if (isTopTier(p)) return true;
  if (isBackOffice(p)) return true;
  if (p.title === 'accountant') return true;
  if (['sales_manager', 'sales_supervisor', 'team_leader', 'sales'].includes(p.title)) return true;
  return false; // marketing, marketing_manager -> scoped
};

// -----------------------------------------------------------------------------
// TEAM SCOPING (used by Client + Dashboard + Reports queries)
// Returns array of user IDs whose data the current user is allowed to see.
// NOTE: Sales Manager, Sales Supervisor, and Marketing Manager scoping depends
//       on org-chart / team relationships. The current DB only has team_leader_id
//       on profiles. Sales Supervisor + Marketing Manager scoping will be
//       expanded in Phase 3 when we add supervisor_id / marketing_manager_id
//       columns (or derive from org_chart_nodes). For now, if a relationship
//       is unavailable, we conservatively include only the current user.
// -----------------------------------------------------------------------------
export const getScopedUserIds = (current, allProfiles) => {
  if (!current) return [];
  const scope = getClientVisibilityScope(current);
  if (scope === 'all') return (allProfiles || []).map((u) => u.id);
  if (scope === 'none') return [];
  if (scope === 'own' || scope === 'own_created') return [current.id];

  const list = Array.isArray(allProfiles) ? allProfiles : [];

  // Team Leader: himself + direct sales (team_leader_id === current.id)
  if (current.title === 'team_leader') {
    const teamIds = list.filter((u) => u.team_leader_id === current.id).map((u) => u.id);
    return [current.id, ...teamIds];
  }

  // Sales Supervisor: himself + his sales
  // TEMPORARY: no supervisor_id column yet — returns just self. Phase 3 will fix.
  if (current.title === 'sales_supervisor') {
    return [current.id];
  }

  // Sales Manager: himself + all team_leaders + all their sales
  if (current.title === 'sales_manager') {
    const teamLeaderIds = list
      .filter((u) => u.title === 'team_leader')
      .map((u) => u.id);
    const salesIds = list
      .filter((u) => u.title === 'sales' && teamLeaderIds.includes(u.team_leader_id))
      .map((u) => u.id);
    return [current.id, ...teamLeaderIds, ...salesIds];
  }

  // Marketing Manager: himself + all marketing users
  // TEMPORARY: no marketing_manager_id column yet — includes ALL marketing.
  // Phase 3 will refine to only his direct reports.
  if (current.title === 'marketing_manager') {
    const marketingIds = list
      .filter((u) => u.title === 'marketing')
      .map((u) => u.id);
    return [current.id, ...marketingIds];
  }

  return [current.id];
};
