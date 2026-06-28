import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import { C, STAGES, SOURCES, ACTIONS, LOCATIONS, LEAD_ORIGINS, COLD_RESULTS, fmtMoney, fmtDate, todayStr, stageOf, stageIdFromInput, LEAD_CATEGORY_LABELS, leadCategory, clientStatus } from './constants';
import { Plus, Search, Users, Download, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Pencil, MessageSquarePlus, Loader2, Mail } from 'lucide-react';
import ClientModal from './ClientModal';
import ImportModal from './ImportModal';
import Notifications from './Notifications';
import { SourceTag } from './BrandIcons';
import PhoneFlag, { detectCountry } from './PhoneFlag';
import DateRangePicker from './DateRangePicker';

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value||''} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded px-2 py-1 text-xs outline-none"
      style={{ backgroundColor: C.surface, border: `1px solid ${value ? C.gold : C.border}`, color: value ? C.gold : C.muted }}>
      <option value="">{placeholder || 'All'}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function CountryFilter({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef(null);
  const ALL_COUNTRIES = ['Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahrain','Bangladesh','Belgium','Bolivia','Bosnia','Botswana','Brazil','Bulgaria','Burkina Faso','Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Congo','Costa Rica','Croatia','Cuba','Czech Republic','Denmark','Dominican Republic','DR Congo','Ecuador','Egypt','Eritrea','Estonia','Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Honduras','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Latvia','Lebanon','Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Niger','Nigeria','North Macedonia','Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tunisia','Turkey','Turkmenistan','UAE','Uganda','UK','Ukraine','Uruguay','USA','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = value || [];
  const filtered = search ? ALL_COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase())) : ALL_COUNTRIES;
  const toggle = (country) => {
    if (country === 'Overseas') { onChange(selected.includes('Overseas') ? [] : ['Overseas']); return; }
    const without = selected.filter(c => c !== 'Overseas');
    if (without.includes(country)) onChange(without.filter(c => c !== country));
    else onChange([...without, country]);
  };
  const label = selected.length === 0 ? 'All Countries' : selected.includes('Overseas') ? '🌍 Overseas' : selected.length === 1 ? selected[0] : `${selected.length} countries`;
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className="w-full rounded px-2 py-1 text-xs text-left outline-none flex items-center justify-between"
        style={{ backgroundColor: C.surface, border: `1px solid ${selected.length ? C.gold : C.border}`, color: selected.length ? C.gold : C.muted }}>
        <span>{label}</span><span style={{ fontSize: 9 }}>▼</span>
      </button>
      {open && (
        <div className="absolute z-50 top-7 left-0 rounded-xl shadow-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, width: 220, maxHeight: 280, display: 'flex', flexDirection: 'column' }}>
          <div className="p-2 shrink-0">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search countries..."
              className="w-full rounded px-2 py-1 text-xs outline-none"
              style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <div className="overflow-y-auto flex-1">
            {!search && (
              <div onClick={() => toggle('Overseas')} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs hover:opacity-80"
                style={{ backgroundColor: selected.includes('Overseas') ? `${C.gold}22` : 'transparent', color: selected.includes('Overseas') ? C.gold : C.text, borderBottom: `1px solid ${C.border}` }}>
                <span>{selected.includes('Overseas') ? '☑' : '☐'}</span>
                <span>🌍 Overseas (non-Egypt)</span>
              </div>
            )}
            {filtered.map(c => (
              <div key={c} onClick={() => toggle(c)} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs hover:opacity-80"
                style={{ backgroundColor: selected.includes(c) ? `${C.gold}22` : 'transparent', color: selected.includes(c) ? C.gold : C.text }}>
                <span>{selected.includes(c) ? '☑' : '☐'}</span><span>{c}</span>
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="p-2 shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => { onChange([]); setOpen(false); }} className="w-full text-xs py-1 rounded"
                style={{ backgroundColor: C.bg, color: C.muted }}>Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AutocompleteInput({ value, onChange, options, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const filtered = value ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase())) : options;
  return (
    <div className="relative">
      <input value={value || ''} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder} className="w-full rounded px-2 py-1 text-xs outline-none"
        style={{ backgroundColor: C.surface, border: `1px solid ${value ? C.gold : C.border}`, color: value ? C.gold : C.text }} />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-7 left-0 rounded shadow-lg max-h-40 overflow-y-auto overflow-x-hidden"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, minWidth: '100%', width: 'max-content', maxWidth: '260px' }}>
          {filtered.map((o) => (
            <div key={o} onMouseDown={() => { onChange(o); setOpen(false); }}
              className="px-2 py-1.5 text-xs cursor-pointer hover:opacity-80 whitespace-nowrap" style={{ color: C.text }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ color, children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ backgroundColor: `${color}22`, color }}>{children}</span>
  );
}

const selectStyle = { backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text };
const selectClass = 'rounded-lg px-2.5 py-2 text-xs outline-none';

const PAGE_SIZE = 30;
const EXPORT_BATCH = 1000;
const TITLE_ORDER = ['top_management','sales_manager','team_leader','sales','marketing','operation'];
const sortByTitleThenName = (a, b) =>
  (TITLE_ORDER.indexOf(a.title) - TITLE_ORDER.indexOf(b.title)) ||
  (a.full_name || '').localeCompare(b.full_name || '');

export default function ClientsBoard({ userId, isAdmin, hasTeamAccess, userTitle, leadFilter, onClearLeadFilter, initialPage = 1, onPageChange, onOpenMail, onSelectCategory }) {
  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activities, setActivities] = useState([]);
  const [owners, setOwners] = useState({});
  const [profilesList, setProfilesList] = useState([]);
  const [developerList, setDeveloperList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [colFilters, setColFilters] = useState({});
  const [pendingCols, setPendingCols] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkSource, setBulkSource] = useState('sales'); // 'sales' | 'pools'
  const [bulkSalesIds, setBulkSalesIds] = useState(new Set()); // multi-select sales uuids
  const [bulkPoolId, setBulkPoolId] = useState(''); // single pool uuid
  const [bulkSalesOpen, setBulkSalesOpen] = useState(false);
  const [bulkReassignStatus, setBulkReassignStatus] = useState('reRotation');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [unreadMail, setUnreadMail] = useState(0);
  const [poolMap, setPoolMap] = useState({}); // pool_key -> id
  const [poolIds, setPoolIds] = useState([]); // all pool user ids (to exclude from non-pool views)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles')
        .select('id, pool_key').eq('is_pool', true);
      const map = {};
      const ids = [];
      (data || []).forEach(p => {
        if (p.pool_key) map[p.pool_key] = p.id;
        ids.push(p.id);
      });
      setPoolMap(map);
      setPoolIds(ids);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { count } = await supabase
          .from('message_recipients')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_read', false);
        setUnreadMail(count || 0);
      } catch (e) {}
    })();
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // View mode set by Sales/Pools/All tabs in Layout sidebar
  const [showAllIncludingPools, setShowAllIncludingPools] = useState(false);
  const [showOnlyPools, setShowOnlyPools] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      const mode = e?.detail?.mode || 'sales';
      // any tab switch clears search & col filters
      setColFilters({});
      setPendingCols({});
      setSearch('');
      setSearchInput('');
      if (mode === 'all') {
        setShowAllIncludingPools(true);
        setShowOnlyPools(false);
      } else if (mode === 'pools') {
        setShowAllIncludingPools(false);
        setShowOnlyPools(true);
      } else {
        // 'sales' or anything else = default sales view
        setShowAllIncludingPools(false);
        setShowOnlyPools(false);
      }
    };
    window.addEventListener('rk-set-view-mode', handler);
    return () => window.removeEventListener('rk-set-view-mode', handler);
  }, []);

  useEffect(() => {
    const top = document.getElementById('top-scroll-mirror');
    const main = document.getElementById('main-table-scroll');
    const inner = document.getElementById('top-scroll-inner');
    if (!top || !main || !inner) return;
    inner.style.width = main.scrollWidth + 'px';
    const syncFromTop = () => { main.scrollLeft = top.scrollLeft; };
    const syncFromMain = () => { top.scrollLeft = main.scrollLeft; inner.style.width = main.scrollWidth + 'px'; };
    top.addEventListener('scroll', syncFromTop);
    main.addEventListener('scroll', syncFromMain);
    return () => { top.removeEventListener('scroll', syncFromTop); main.removeEventListener('scroll', syncFromMain); };
  });

  useEffect(() => { setPage(1); }, [search, stageFilter, leadFilter]);

  useEffect(() => {
    if (!hasTeamAccess) return;
    (async () => {
      const { data: p } = await supabase.from('profiles').select('id, full_name, username, is_pool, title').order('full_name');
      const map = {};
      (p || []).forEach((row) => { map[row.id] = row.full_name || row.username || (row.is_pool ? 'Pool' : '—'); });
      setOwners(map);
      // Sort: pools at the end, non-pools by title order then name
      const sortedProfiles = [...(p || [])].sort((a, b) => {
        if (a.is_pool && !b.is_pool) return 1;
        if (!a.is_pool && b.is_pool) return -1;
        if (a.is_pool && b.is_pool) return (a.full_name || '').localeCompare(b.full_name || '');
        return sortByTitleThenName(a, b);
      });
      setProfilesList(sortedProfiles);
      const { data: devs } = await supabase.from('developers').select('id, name').order('name');
      setDeveloperList(devs || []);
      const { data: projs } = await supabase.from('developer_projects').select('id, name, location, developer_id').order('name');
      setProjectList(projs || []);
    })();
  }, [hasTeamAccess, userId]);

  const buildQuery = () => {
    let q = supabase.from('clients').select('*', { count: 'exact' });
    if (!hasTeamAccess) q = q.eq('owner_id', userId);
    else if (poolIds.length > 0 && (!leadFilter || !leadFilter.startsWith('pool_'))) {
      if (showOnlyPools) {
        // Pools tab → only show leads owned by a pool
        q = q.in('owner_id', poolIds);
      } else if (!showAllIncludingPools) {
        // Default (Sales tab) → exclude pool-owned leads
        q = q.not('owner_id', 'in', '(' + poolIds.join(',') + ')');
      }
      // showAllIncludingPools=true → no pool filter, show everything
    }
    if (search) {
      const esc = search.replace(/[%,]/g, '');
      q = q.or(`name.ilike.%${esc}%,phone.ilike.%${esc}%,project.ilike.%${esc}%,developer.ilike.%${esc}%,location.ilike.%${esc}%`);
    }
    if (colFilters.name) q = q.ilike('name', `%${colFilters.name}%`);
    if (colFilters.phone) q = q.ilike('phone', `%${colFilters.phone}%`);
    if (colFilters.stage_category) q = q.eq('stage_category', colFilters.stage_category);
    if (colFilters.source) q = q.eq('source', colFilters.source);
    if (colFilters.assigned_to) {
      const matchedId = Object.entries(owners).find(([, name]) => name === colFilters.assigned_to)?.[0];
      if (matchedId) q = q.eq('owner_id', matchedId);
    }
    if (colFilters.lead_origin) q = q.eq('lead_origin', colFilters.lead_origin);
    if (colFilters.developer) q = q.ilike('developer', `%${colFilters.developer}%`);
    if (colFilters.project) q = q.ilike('project', `%${colFilters.project}%`);
    if (colFilters.location) q = q.eq('location', colFilters.location);
    if (colFilters.call_result) q = q.eq('call_result', colFilters.call_result);
    if (colFilters.status) {
      switch (colFilters.status) {
        case 'Interested': q = q.in('call_result', ['Contacted', 'Send WhatsApp', 'Call Again']); break;
        case 'Not Reachable': q = q.in('call_result', ['No Answer', 'Switched Off', 'No Answer - Multiple Times']); break;
        case 'Warm Lead': q = q.in('call_result', ['Interest in Resale', 'Interest in Separate']); break;
        case 'Re-rotation': q = q.not('previous_owners', 'is', null).neq('previous_owners', '[]'); break;
        case 'Not Interested': q = q.eq('call_result', 'Not Interested'); break;
        case 'Not Qualified': q = q.eq('call_result', 'Not Qualified'); break;
        case 'Deal': q = q.eq('stage', 'won'); break;
        default: break;
      }
    }
    if (colFilters.contactStatus) {
      switch (colFilters.contactStatus) {
        case 'New': q = q.eq('ever_contacted', false).neq('stage', 'won'); break;
        case 'Contacted': q = q.eq('ever_contacted', true).neq('stage', 'won'); break;
        default: break;
      }
    }
    if (colFilters.created_from) q = q.gte('created_at', colFilters.created_from);
    if (colFilters.created_to) q = q.lte('created_at', colFilters.created_to + 'T23:59:59');
    if (colFilters.followup_from) q = q.gte('next_follow_up', colFilters.followup_from);
    if (colFilters.followup_to) q = q.lte('next_follow_up', colFilters.followup_to);
    if (colFilters.countries && colFilters.countries.length > 0) {
      const PREFIXES = {
        'Egypt':['201'],'Saudi Arabia':['966'],'UAE':['971'],'Kuwait':['965'],
        'Qatar':['974'],'Bahrain':['973'],'Oman':['968'],'Jordan':['962'],
        'Lebanon':['961'],'Iraq':['964'],'Syria':['963'],'Yemen':['967'],
        'Palestine':['970'],'Libya':['218'],'Tunisia':['216'],'Algeria':['213'],
        'Morocco':['212'],'Sudan':['249'],'Turkey':['90'],'UK':['44'],
        'Germany':['49'],'France':['33'],'Italy':['39'],'Spain':['34'],
        'Netherlands':['31'],'Belgium':['32'],'Switzerland':['41'],'Sweden':['46'],
        'Norway':['47'],'Denmark':['45'],'Finland':['358'],'Poland':['48'],
        'Portugal':['351'],'Greece':['30'],'Austria':['43'],'Ireland':['353'],
        'Czech Republic':['420'],'Romania':['40'],'Hungary':['36'],'Ukraine':['380'],
        'Russia':['7'],'USA':['1'],'Canada':['1'],'Mexico':['52'],'Brazil':['55'],
        'Argentina':['54'],'Colombia':['57'],'Chile':['56'],'Peru':['51'],
        'India':['91'],'Pakistan':['92'],'Bangladesh':['880'],'China':['86'],
        'Japan':['81'],'South Korea':['82'],'Indonesia':['62'],'Malaysia':['60'],
        'Singapore':['65'],'Thailand':['66'],'Philippines':['63'],'Vietnam':['84'],
        'Nigeria':['234'],'South Africa':['27'],'Kenya':['254'],'Ethiopia':['251'],
        'Ghana':['233'],'Australia':['61'],'New Zealand':['64'],
      };
      if (colFilters.countries.includes('Overseas')) {
        q = q.not('phone','ilike','201%');
      } else {
        const allPfx = colFilters.countries.flatMap(c => PREFIXES[c] || []);
        if (allPfx.length > 0) q = q.or(allPfx.map(p => `phone.ilike.${p}%`).join(','));
      }
    }
    if (leadFilter) {
      const today = todayStr();
      // Pool filter: leadFilter='pool_<key>' → filter by that pool owner
      if (leadFilter.startsWith('pool_')) {
        const key = leadFilter.slice(5);
        const pid = poolMap[key];
        if (pid) q = q.eq('owner_id', pid);
        return q;
      }
      switch (leadFilter) {
        case 'newFresh':
          q = q.eq('stage_category', 'New Fresh Lead').eq('ever_contacted', false); break;
        case 'contactedFresh':
          q = q.eq('stage_category', 'New Fresh Lead').eq('ever_contacted', true); break;
        case 'callbackToday':
          q = q.eq('next_follow_up', today); break;
        case 'late':
          q = q.not('next_follow_up', 'is', null).lt('next_follow_up', today); break;
        case 'reRotation':
          q = q.filter('previous_owners', 'neq', 'null').filter('previous_owners', 'neq', '[]'); break;
        case 'oldFresh':
          q = q.in('stage_category', ['Old Fresh Lead', 'Old Campaign']).eq('ever_contacted', false); break;
        case 'contactedOldFresh':
          q = q.in('stage_category', ['Old Fresh Lead', 'Old Campaign']).eq('ever_contacted', true); break;
        case 'cold':
          q = q.eq('stage_category', 'Cold Calls').eq('ever_contacted', false); break;
        case 'contactedCold':
          q = q.eq('stage_category', 'Cold Calls').eq('ever_contacted', true); break;
        case 'warmLeads':
          q = q.in('call_result', ['Interest in Resale', 'Interest in Separate']); break;
        case 'potential':
          q = q.eq('potential', true); break;
        default: break;
      }
    }
    return q;
  };

  const load = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    if (leadFilter === 'reRotation') {
      const { data: allData } = await supabase.rpc('get_rerotation_clients', {
        p_user_id: userId,
        p_is_admin: isAdmin || hasTeamAccess,
      });
      const all = (allData || []).filter(c => !c.ever_contacted);
      setTotalCount(all.length);
      const paged = all.slice(from, to + 1);
      setClients(paged);
      if (paged.length > 0) {
        const { data: a } = await supabase.from('activities').select('*').in('client_id', paged.map((x) => x.id)).order('date', { ascending: false });
        setActivities(a || []);
      } else { setActivities([]); }
      setLoading(false);
      return;
    }
    if (leadFilter === 'contactedReRotation') {
      const { data: allData } = await supabase.rpc('get_rerotation_clients', {
        p_user_id: userId,
        p_is_admin: isAdmin || hasTeamAccess,
      });
      const all = (allData || []).filter(c => c.ever_contacted);
      setTotalCount(all.length);
      const paged = all.slice(from, to + 1);
      setClients(paged);
      if (paged.length > 0) {
        const { data: a } = await supabase.from('activities').select('*').in('client_id', paged.map((x) => x.id)).order('date', { ascending: false });
        setActivities(a || []);
      } else { setActivities([]); }
      setLoading(false);
      return;
    }
    const { data: c, count } = await buildQuery().order('last_contacted_at', { ascending: true, nullsFirst: true }).range(from, to);
    setClients(c || []);
    setTotalCount(count || 0);
    if (c && c.length > 0) {
      const { data: a } = await supabase.from('activities').select('*').in('client_id', c.map((x) => x.id)).order('date', { ascending: false });
      setActivities(a || []);
    } else { setActivities([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId, page, search, stageFilter, leadFilter, colFilters, poolMap, poolIds, showAllIncludingPools, showOnlyPools]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [totalCount]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelectAllOnPage = (ids, allSelected) => {
    setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => { if (allSelected) next.delete(id); else next.add(id); }); return next; });
  };

  // Round-robin distribution: split clientIds across ownerIds (shuffles for fairness)
  const distribute = (clientIds, ownerIds) => {
    if (!ownerIds.length) return [];
    const shuffled = [...clientIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const buckets = ownerIds.map(() => []);
    shuffled.forEach((cid, i) => { buckets[i % ownerIds.length].push(cid); });
    return ownerIds
      .map((oid, i) => ({ owner_id: oid, client_ids: buckets[i] }))
      .filter(a => a.client_ids.length > 0);
  };

  const bulkReassign = async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    let targets = [];
    if (bulkSource === 'sales') {
      targets = Array.from(bulkSalesIds);
      if (targets.length === 0) return;
    } else {
      if (!bulkPoolId) return;
      targets = [bulkPoolId];
    }
    setBulkBusy(true);
    try {
      const assignments = distribute(Array.from(selectedIds), targets);
      const { error } = await supabase.rpc('bulk_reassign_clients_split', {
        p_assignments: assignments,
        p_status: bulkReassignStatus,
      });
      if (error) {
        console.warn('Bulk reassign failed:', error);
        alert('Bulk reassign failed: ' + error.message);
      }
    } catch (e) {
      console.warn('Bulk reassign exception:', e);
    }
    setBulkBusy(false);
    setSelectedIds(new Set());
    setBulkSalesIds(new Set());
    setBulkPoolId('');
    setBulkReassignStatus('reRotation');
    load();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    await supabase.from('clients').delete().in('id', Array.from(selectedIds));
    setBulkBusy(false); setSelectedIds(new Set()); load();
  };

  const exportCsv = async () => {
    setExporting(true);
    let allRows = []; let from = 0;
    while (true) {
      const { data, error } = await buildQuery().order('last_contacted_at', { ascending: true, nullsFirst: true }).range(from, from + EXPORT_BATCH - 1);
      if (error || !data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < EXPORT_BATCH) break;
      from += EXPORT_BATCH;
    }
    const rows = allRows.map((c) => ({ Name: c.name, Phone: c.phone || '', 'Secondary Phone': c.secondary_phone || '', Stage: stageOf(c.stage).label, Project: c.project || '', Developer: c.developer || '', Location: c.location || '', Source: c.source || '', Potential: c.potential ? 'Yes' : 'No', 'Action': c.call_result || '', 'Next Follow-up': c.next_follow_up || '', Comment: c.notes || '', Created: c.created_at ? c.created_at.slice(0, 10) : '' }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rk-crm-clients-${todayStr()}.csv`; a.click();
    URL.revokeObjectURL(url); setExporting(false);
  };

  const reloadActivities = async () => {
    if (clients.length === 0) return;
    const { data: a } = await supabase.from('activities').select('*').in('client_id', clients.map((x) => x.id)).order('date', { ascending: false });
    setActivities(a || []);
  };

  const setCol = (key) => (e) => setPendingCols((p) => ({ ...p, [key]: e.target.value }));
  const applyColFilters = () => { setColFilters({ ...pendingCols }); setPage(1); };
  const clearColFilters = () => { setColFilters({}); setPendingCols({ countries: [] }); setPage(1); };
  const hasColFilters = Object.entries(colFilters).some(([k, v]) => k === 'countries' ? v?.length > 0 : Boolean(v));
  const hasPendingFilters = Object.entries(pendingCols).some(([k, v]) => k === 'countries' ? v?.length > 0 : Boolean(v));

  const noFiltersActive = !search && !leadFilter && stageFilter === 'all' && !hasColFilters && !hasPendingFilters;
  if (totalCount === 0 && !loading && noFiltersActive && !showAdd) {
    return (
      <div className="text-center py-16">
        <Users size={32} className="mx-auto mb-3" style={{ color: C.muted }} />
        <p className="font-display font-bold mb-1">No clients yet</p>
        <p className="text-sm mb-4" style={{ color: C.muted }}>Tap "New Client" to start tracking your first one, or import a CSV file</p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: C.gold, color: '#14181F' }}>+ New Client</button>
          {isAdmin && (
            <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
              <Upload size={14} /> Import CSV
            </button>
          )}
        </div>
        {showAdd && <ClientModal mode="add" userId={userId} isAdmin={hasTeamAccess} userTitle={userTitle} profilesList={profilesList} onClose={() => setShowAdd(false)} onSaved={load} />}
        {showImport && <ImportModal userId={userId} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); }} />}
      </div>
    );
  }

  const lastActivity = {};
  activities.forEach((a) => { const cur = lastActivity[a.client_id]; if (!cur || a.created_at > cur.created_at) lastActivity[a.client_id] = a; });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-4">
      {(() => {
        const chips = [];

        // 1) Sidebar lead filter
        if (leadFilter) {
          let label = LEAD_CATEGORY_LABELS[leadFilter];
          if (!label && leadFilter.startsWith('pool_')) {
            const pid = poolMap[leadFilter.slice(5)];
            label = pid ? owners[pid] : 'Pool';
          }
          chips.push({
            label: 'View: ' + (label || leadFilter),
            onRemove: onClearLeadFilter,
          });
        }

        // 2) Search
        if (search) {
          chips.push({
            label: `Search: "${search}"`,
            onRemove: () => { setSearch(''); setSearchInput(''); },
          });
        }

        // 3) Column filters — pending overlaps applied
        const removeCol = (...keys) => () => {
          setColFilters((p) => { const n = { ...p }; keys.forEach(k => { delete n[k]; }); return n; });
          setPendingCols((p) => { const n = { ...p }; keys.forEach(k => { delete n[k]; }); return n; });
        };

        const SIMPLE_DEFS = [
          { key: 'name',           prefix: 'Name' },
          { key: 'phone',          prefix: 'Phone' },
          { key: 'stage_category', prefix: 'Category' },
          { key: 'status',         prefix: 'Stage' },
          { key: 'contactStatus',  prefix: 'Status' },
          { key: 'assigned_to',    prefix: 'Assigned' },
          { key: 'lead_origin',    prefix: 'Origin' },
          { key: 'source',         prefix: 'Source' },
          { key: 'developer',      prefix: 'Developer' },
          { key: 'project',        prefix: 'Project' },
          { key: 'location',       prefix: 'Location' },
          { key: 'call_result',    prefix: 'Action' },
        ];

        SIMPLE_DEFS.forEach(def => {
          const pv = pendingCols[def.key];
          const av = colFilters[def.key];
          const val = (pv !== undefined && pv !== '') ? pv : av;
          if (!val) return;
          const pending = (pv || '') !== (av || '');
          chips.push({
            label: `${def.prefix}: ${val}`,
            pending,
            onRemove: removeCol(def.key),
          });
        });

        // Date ranges
        const cfFrom = colFilters.created_from || '';
        const cfTo   = colFilters.created_to   || '';
        const pcFrom = pendingCols.created_from || '';
        const pcTo   = pendingCols.created_to   || '';
        const cFrom = pcFrom || cfFrom;
        const cTo   = pcTo   || cfTo;
        if (cFrom || cTo) {
          const pending = pcFrom !== cfFrom || pcTo !== cfTo;
          chips.push({
            label: `Created: ${cFrom || '...'} → ${cTo || '...'}`,
            pending,
            onRemove: removeCol('created_from', 'created_to'),
          });
        }

        const fuCfFrom = colFilters.followup_from || '';
        const fuCfTo   = colFilters.followup_to   || '';
        const fuPcFrom = pendingCols.followup_from || '';
        const fuPcTo   = pendingCols.followup_to   || '';
        const fuFrom = fuPcFrom || fuCfFrom;
        const fuTo   = fuPcTo   || fuCfTo;
        if (fuFrom || fuTo) {
          const pending = fuPcFrom !== fuCfFrom || fuPcTo !== fuCfTo;
          chips.push({
            label: `Follow-up: ${fuFrom || '...'} → ${fuTo || '...'}`,
            pending,
            onRemove: removeCol('followup_from', 'followup_to'),
          });
        }

        // Countries
        const cfCountries = colFilters.countries || [];
        const pcCountries = pendingCols.countries || [];
        const useCountries = pcCountries.length > 0 ? pcCountries : cfCountries;
        if (useCountries.length > 0) {
          const pending = JSON.stringify(pcCountries) !== JSON.stringify(cfCountries);
          chips.push({
            label: `Country: ${useCountries.join(', ')}`,
            pending,
            onRemove: () => {
              setColFilters((p) => { const n = { ...p }; delete n.countries; return n; });
              setPendingCols((p) => ({ ...p, countries: [] }));
            },
          });
        }

        if (chips.length === 0) return null;

        const anyPending = chips.some(c => c.pending);

        return (
          <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <span className="text-xs font-bold" style={{ color: C.muted }}>Active filters:</span>
            {chips.map((chip, i) => (
              <span key={i}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: `${C.gold}22`,
                  color: C.gold,
                  fontWeight: 600,
                  opacity: chip.pending ? 0.6 : 1,
                  border: chip.pending ? `1px dashed ${C.gold}` : '1px solid transparent',
                }}
                title={chip.pending ? 'Pending — press Search to apply' : ''}
              >
                {chip.label}
                <button onClick={chip.onRemove} className="flex items-center hover:opacity-70" style={{ marginLeft: 2 }}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {anyPending && (
              <span className="text-[10px] italic" style={{ color: C.muted }}>
                (dashed = press Search to apply)
              </span>
            )}
            {chips.length > 1 && (
              <button
                onClick={() => {
                  clearColFilters();
                  if (leadFilter) onClearLeadFilter && onClearLeadFilter();
                  setSearch(''); setSearchInput('');
                }}
                className="ml-1 text-xs font-bold underline"
                style={{ color: C.muted }}
              >
                Clear all
              </button>
            )}
          </div>
        );
      })()}

      <div className="space-y-2">
        {/* Row 1 (top): Export, Import, Notification, Mail */}
        <div className="flex items-center justify-end gap-2">
          {isAdmin && (
            <>
              <button onClick={exportCsv} disabled={exporting} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 disabled:opacity-50" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {exporting ? 'Exporting...' : 'Export'}
              </button>
              <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                <Upload size={14} /> Import
              </button>
            </>
          )}
          {/* Notifications */}
          <Notifications userId={userId} onSelectCategory={onSelectCategory} />
          {/* Mail icon */}
          <button onClick={onOpenMail} className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 relative" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}
            title="Mail">
            <Mail size={15} />
            {unreadMail > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ backgroundColor: '#D6453E', color: '#fff' }}>{unreadMail}</span>
            )}
          </button>
        </div>

        {/* Row 2 (below): Search box + Search + Clear + New Client */}
        <div className="flex items-center justify-end gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search..."
              className="rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none"
              style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text, width: '200px' }} />
          </div>
          <button onClick={applyColFilters} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            <Search size={13} /> Search
          </button>
          {(hasColFilters || hasPendingFilters) && (
            <button onClick={clearColFilters} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
              <X size={13} /> Clear
            </button>
          )}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: C.gold, color: '#14181F' }}>
            <Plus size={13} /> New Client
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.gold}` }}>
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <span className="flex-1" />
          {hasTeamAccess && profilesList.length > 0 && (
            <>
              {/* Source toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <button
                  onClick={() => { setBulkSource('sales'); setBulkPoolId(''); }}
                  className="px-3 py-2 text-xs font-bold"
                  style={{ backgroundColor: bulkSource === 'sales' ? C.gold : C.bg, color: bulkSource === 'sales' ? '#14181F' : C.muted }}
                >Sales</button>
                <button
                  onClick={() => { setBulkSource('pools'); setBulkSalesIds(new Set()); }}
                  className="px-3 py-2 text-xs font-bold"
                  style={{ backgroundColor: bulkSource === 'pools' ? C.gold : C.bg, color: bulkSource === 'pools' ? '#14181F' : C.muted }}
                >Pools</button>
              </div>

              {/* Target picker */}
              {bulkSource === 'sales' ? (
                <div className="relative">
                  <button
                    onClick={() => setBulkSalesOpen(v => !v)}
                    className={selectClass}
                    style={{ ...selectStyle, minWidth: 160, textAlign: 'left' }}
                  >
                    {bulkSalesIds.size === 0
                      ? 'Select sales...'
                      : `${bulkSalesIds.size} sales selected`}
                    <span style={{ float: 'right', fontSize: 9, marginTop: 4 }}>▼</span>
                  </button>
                  {bulkSalesOpen && (
                    <div className="absolute z-50 top-10 right-0 rounded-xl shadow-xl"
                      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, width: 220, maxHeight: 280, display: 'flex', flexDirection: 'column' }}>
                      <div className="p-2 shrink-0 flex gap-1" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <button
                          onClick={() => {
                            const all = new Set(profilesList.filter(p => !p.is_pool).map(p => p.id));
                            setBulkSalesIds(all);
                          }}
                          className="flex-1 text-xs py-1 rounded"
                          style={{ backgroundColor: C.bg, color: C.gold }}
                        >All</button>
                        <button
                          onClick={() => setBulkSalesIds(new Set())}
                          className="flex-1 text-xs py-1 rounded"
                          style={{ backgroundColor: C.bg, color: C.muted }}
                        >Clear</button>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {profilesList.filter(p => !p.is_pool).map(p => {
                          const sel = bulkSalesIds.has(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                const next = new Set(bulkSalesIds);
                                if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                                setBulkSalesIds(next);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs hover:opacity-80"
                              style={{ backgroundColor: sel ? `${C.gold}22` : 'transparent', color: sel ? C.gold : C.text }}
                            >
                              <span>{sel ? '☑' : '☐'}</span>
                              <span>{p.full_name || p.username || p.id}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="p-2 shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
                        <button onClick={() => setBulkSalesOpen(false)} className="w-full text-xs py-1 rounded" style={{ backgroundColor: C.gold, color: '#14181F', fontWeight: 'bold' }}>Done</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <select value={bulkPoolId} onChange={(e) => setBulkPoolId(e.target.value)} className={selectClass} style={selectStyle}>
                  <option value="">Select pool...</option>
                  {profilesList.filter(p => p.is_pool).map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              )}

              {/* Status */}
              <select value={bulkReassignStatus} onChange={(e) => setBulkReassignStatus(e.target.value)} className={selectClass} style={selectStyle}>
                <option value="reRotation">Re-rotation</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="notInterested">Not Interested</option>
                <option value="notQualified">Not Qualified</option>
              </select>

              <button
                onClick={bulkReassign}
                disabled={bulkBusy || (bulkSource === 'sales' ? bulkSalesIds.size === 0 : !bulkPoolId)}
                className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
                style={{ backgroundColor: C.gold, color: '#14181F' }}
              >Reassign</button>
            </>
          )}
          {isAdmin && (<button onClick={bulkDelete} disabled={bulkBusy} className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40" style={{ backgroundColor: '#C9714F22', color: '#C9714F' }}>Delete</button>)}
          <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1 text-xs" style={{ color: C.muted }}><X size={14} /> Clear</button>
        </div>
      )}

      {totalCount === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm mb-3" style={{ color: C.muted }}>No clients match these filters.</p>
          <button onClick={() => { clearColFilters(); setSearch(''); setSearchInput(''); setStageFilter('all'); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>Clear all filters</button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: C.muted }}>{loading ? 'Loading...' : `${rangeStart}–${rangeEnd} of ${totalCount}`}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={currentPage <= 1} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }} title="First"><ChevronsLeft size={15} /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}><ChevronLeft size={16} /></button>
              <span className="text-xs font-medium px-2" style={{ color: C.muted }}>Page {currentPage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}><ChevronRight size={16} /></button>
              <button onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }} title="Last"><ChevronsRight size={15} /></button>
            </div>
          </div>

          <div className="overflow-x-auto" id="top-scroll-mirror" style={{ height: '8px', borderRadius: '4px' }}>
            <div id="top-scroll-inner" style={{ height: '1px' }} />
          </div>

          <div className="rounded-xl overflow-x-auto" id="main-table-scroll" style={{ border: `1px solid ${C.border}` }}>
            <table className="text-sm" style={{ minWidth: hasTeamAccess ? "1950px" : "1650px", width: "100%" }}>
              <thead>
                <tr style={{ backgroundColor: C.surface, color: C.muted }} className="text-left text-xs">
                  <th className="py-2.5 px-3 font-medium w-8"><input type="checkbox" checked={clients.length > 0 && clients.every((c) => selectedIds.has(c.id))} onChange={() => toggleSelectAllOnPage(clients.map((c) => c.id), clients.length > 0 && clients.every((c) => selectedIds.has(c.id)))} /></th>
                  <th className="py-2.5 px-3 font-medium w-8"></th>
                  <th className="py-2.5 px-3 font-medium">Full Name</th>
                  <th className="py-2.5 px-3 font-medium">Country</th>
                  <th className="py-2.5 px-3 font-medium">Mobile Phone</th>
                  <th className="py-2.5 px-3 font-medium">Category</th>
                  <th className="py-2.5 px-3 font-medium">Stage</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  {hasTeamAccess && <th className="py-2.5 px-3 font-medium">Assigned To</th>}
                  {hasTeamAccess && <th className="py-2.5 px-3 font-medium">Lead Origin</th>}
                  <th className="py-2.5 px-3 font-medium">Lead Source</th>
                  <th className="py-2.5 px-3 font-medium">Created Time</th>
                  <th className="py-2.5 px-3 font-medium">Developer</th>
                  <th className="py-2.5 px-3 font-medium">Project</th>
                  <th className="py-2.5 px-3 font-medium">Location</th>
                  <th className="py-2.5 px-3 font-medium">Action</th>
                  <th className="py-2.5 px-3 font-medium">Last Comment</th>
                  <th className="py-2.5 px-3 font-medium">Last Comment Date</th>
                  <th className="py-2.5 px-3 font-medium">Next Follow-up Date</th>
                  <th className="py-2.5 px-3 font-medium">Potential</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: C.bg }}>
                  <td className="py-1.5 px-2 w-8"></td>
                  <td className="py-1.5 px-2 w-8"></td>
                  <td className="py-1.5 px-2"><input value={pendingCols.name||''} onChange={setCol('name')} placeholder="Name..." className="w-full rounded px-2 py-1 text-xs outline-none" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }} /></td>
                  <td className="py-1.5 px-2"><CountryFilter value={pendingCols.countries} onChange={(v) => setPendingCols((p) => ({ ...p, countries: v }))} /></td>
                  <td className="py-1.5 px-2"><input value={pendingCols.phone||''} onChange={setCol('phone')} placeholder="Phone..." className="w-full rounded px-2 py-1 text-xs outline-none" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }} /></td>
                  <td className="py-1.5 px-2"><FilterSelect value={pendingCols.stage_category} onChange={(v) => setPendingCols((p) => ({ ...p, stage_category: v }))} options={['New Fresh Lead','Old Fresh Lead','Cold Calls','Old Campaign']} placeholder="All Categories" /></td>
                  <td className="py-1.5 px-2"><FilterSelect value={pendingCols.status} onChange={(v) => setPendingCols((p) => ({ ...p, status: v }))} options={['Interested','Not Reachable','Warm Lead','Re-rotation','Not Interested','Not Qualified','Deal']} placeholder="All Stages" /></td>
                  <td className="py-1.5 px-2"><FilterSelect value={pendingCols.contactStatus} onChange={(v) => setPendingCols((p) => ({ ...p, contactStatus: v }))} options={['New','Contacted']} placeholder="All Statuses" /></td>
                  {hasTeamAccess && <td className="py-1.5 px-2"><FilterSelect value={pendingCols.assigned_to} onChange={(v) => setPendingCols((p) => ({ ...p, assigned_to: v }))} options={profilesList.filter((p) => !p.is_pool).map((p) => p.full_name || p.username)} placeholder="All Users" /></td>}
                  {hasTeamAccess && <td className="py-1.5 px-2"><FilterSelect value={pendingCols.lead_origin} onChange={(v) => setPendingCols((p) => ({ ...p, lead_origin: v }))} options={LEAD_ORIGINS} placeholder="All Origins" /></td>}
                  <td className="py-1.5 px-2"><FilterSelect value={pendingCols.source} onChange={(v) => setPendingCols((p) => ({ ...p, source: v }))} options={SOURCES} placeholder="All Sources" /></td>
                  <td className="py-1.5 px-2"><DateRangePicker from={pendingCols.created_from || null} to={pendingCols.created_to || null} onChange={(f, t) => setPendingCols((p) => ({ ...p, created_from: f || '', created_to: t || '' }))} placeholder="Created range..." /></td>
                  <td className="py-1.5 px-2"><AutocompleteInput value={pendingCols.developer} onChange={(v) => setPendingCols((p) => ({ ...p, developer: v, project: '' }))} options={developerList.map((d) => d.name)} placeholder="Developer..." /></td>
                  <td className="py-1.5 px-2"><AutocompleteInput value={pendingCols.project} onChange={(v) => setPendingCols((p) => ({ ...p, project: v }))} options={(() => { const selDev = developerList.find((d) => d.name === pendingCols.developer); return projectList.filter((p) => !pendingCols.location || p.location === pendingCols.location).filter((p) => !selDev || p.developer_id === selDev.id).map((p) => p.name); })()} placeholder="Project..." /></td>
                  <td className="py-1.5 px-2"><FilterSelect value={pendingCols.location} onChange={(v) => setPendingCols((p) => ({ ...p, location: v, project: '' }))} options={LOCATIONS} placeholder="All Locations" /></td>
                  <td className="py-1.5 px-2"><FilterSelect value={pendingCols.call_result} onChange={(v) => setPendingCols((p) => ({ ...p, call_result: v }))} options={ACTIONS} placeholder="All Actions" /></td>
                  <td className="py-1.5 px-2"></td>
                  <td className="py-1.5 px-2"></td>
                  <td className="py-1.5 px-2"><DateRangePicker from={pendingCols.followup_from || null} to={pendingCols.followup_to || null} onChange={(f, t) => setPendingCols((p) => ({ ...p, followup_from: f || '', followup_to: t || '' }))} placeholder="Follow-up range..." /></td>
                  <td className="py-1.5 px-2"></td>
                </tr>
                {clients.map((c) => {
                  const cat = leadCategory(c);
                  const stat = clientStatus(c);
                  let rawCat = c.stage_category || cat.label;
                  if (rawCat === 'New Fresh Lead') {
                    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
                    if (c.created_at < ninetyDaysAgo) rawCat = 'Old Fresh Lead';
                  }
                  const stageCatColors = { 'New Fresh Lead': '#D6453E', 'Old Fresh Lead': '#C9714F', 'Cold Calls': '#6E8CAE', 'Old Campaign': '#9B7EBD' };
                  const stageColor = stageCatColors[rawCat] || cat.color;
                  const last = lastActivity[c.id];
                  return (
                    <tr key={c.id} onClick={() => { if (isAdmin || hasTeamAccess || c.owner_id === userId) setSelected(c); }}
                      className="cursor-pointer transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                      <td className="py-2.5 px-3" onClick={(e) => { e.stopPropagation(); if (isAdmin) setEditTarget(c); else if (c.owner_id === userId) setActionTarget(c); }}>
                        {isAdmin ? <Pencil size={14} style={{ color: C.muted }} /> : c.owner_id === userId ? <MessageSquarePlus size={14} style={{ color: C.gold }} /> : null}
                      </td>
                      <td className="py-2.5 px-3 font-medium whitespace-nowrap">{c.name}</td>
                      <td className="py-2.5 px-3">{c.phone ? <PhoneFlag phone={c.phone} size={18} /> : <span style={{ color: C.muted }}>—</span>}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.phone || '—'}</td>
                      <td className="py-2.5 px-3"><Pill color={stageColor}>{rawCat}</Pill></td>
                      <td className="py-2.5 px-3"><Pill color={stat.color === '#FFFFFF' ? C.text : stat.color}>{stat.label}</Pill></td>
                      <td className="py-2.5 px-3"><Pill color={c.ever_contacted ? '#7FA887' : '#D6453E'}>{c.ever_contacted ? 'Contacted' : 'New'}</Pill></td>
                      {hasTeamAccess && (() => {
                        const isPool = poolIds.includes(c.owner_id);
                        return (
                          <td className="py-2.5 px-3 whitespace-nowrap"
                            style={{
                              color: isPool ? '#5BE0EF' : C.muted,
                              fontWeight: isPool ? 700 : 400,
                            }}>
                            {owners[c.owner_id] || '—'}
                          </td>
                        );
                      })()}
                      {hasTeamAccess && <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{[c.lead_origin, c.origin_name].filter(Boolean).join(" · ") || "—"}</td>}
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}><SourceTag source={c.source} size={15} /></td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.created_at ? new Date(c.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.developer || '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{c.project || '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.location || '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{c.call_result || '—'}</td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate" style={{ color: C.muted }}>{last?.notes ? last.notes.split('\n').find(l => !l.startsWith('Action: ') && !l.startsWith('📅') && !l.startsWith('✅') && l.trim()) || '—' : '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: C.muted }}>{last ? fmtDate(last.date) : '—'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: c.next_follow_up && c.next_follow_up < todayStr() ? '#C9714F' : C.muted }}>{c.next_follow_up ? fmtDate(c.next_follow_up) : '—'}</td>
                      <td className="py-2.5 px-3">{c.potential ? <Pill color={C.gold}>Potential</Pill> : <span style={{ color: C.muted }}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: C.muted }}>{loading ? 'Loading...' : `${rangeStart}–${rangeEnd} of ${totalCount}`}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={currentPage <= 1} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }} title="First"><ChevronsLeft size={15} /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}><ChevronLeft size={16} /></button>
              <span className="text-xs font-medium px-2" style={{ color: C.muted }}>Page {currentPage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}><ChevronRight size={16} /></button>
              <button onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }} title="Last"><ChevronsRight size={15} /></button>
            </div>
          </div>
        </>
      )}

      {showAdd && <ClientModal mode="add" userId={userId} isAdmin={hasTeamAccess} userTitle={userTitle} profilesList={profilesList} onClose={() => setShowAdd(false)} onSaved={load} />}
      {selected && <ClientModal mode="detail" userId={userId} client={selected} isAdmin={hasTeamAccess} profilesList={profilesList} onClose={() => setSelected(null)} onSaved={load} />}
      {editTarget && <ClientModal mode="edit" userId={userId} client={editTarget} isAdmin={hasTeamAccess} profilesList={profilesList} onClose={() => setEditTarget(null)} onSaved={load} />}
      {showImport && <ImportModal userId={userId} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); }} />}
      {actionTarget && (() => {
        const idx = clients.findIndex((c) => c.id === actionTarget.id);
        const nextClient = idx >= 0 && idx < clients.length - 1 ? clients[idx + 1] : null;
        return (<ClientModal mode="detail" userId={userId} client={actionTarget} isAdmin={hasTeamAccess} profilesList={profilesList} autoFocusActivity={!isAdmin} onClose={() => setActionTarget(null)} onSaved={load} onNext={nextClient ? () => { load(); setActionTarget(nextClient); } : null} />);
      })()}
    </div>
  );
}
