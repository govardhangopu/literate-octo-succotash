import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Bell, ChevronDown, ChevronRight, ClipboardList, Clock3, Download, FileCheck2, LayoutDashboard, Map as MapIcon, Menu, Moon, Pencil, Plus, Search, Settings, ShieldAlert, Sun, Trash2, Users, X } from 'lucide-react';
import { createMockRequest, deleteMockRequest, fetchMockRequests, fetchRequestPage, updateMockRequest } from './mockApi.js';
import { formatDate, normalizeRequest } from './normalize.js';
import { downloadRequestsCsv } from './csv.js';
import { calculateDashboardMetrics, canManageRequests, filterRequests, validateRequestForm } from './dashboardLogic.js';
import { readUserPreferences, writeUserPreferences } from './preferences.js';

const allOption = (label) => `All ${label}`;
const defaultFilters = () => ({ service: allOption('services'), department: allOption('departments'), office: allOption('offices'), district: allOption('districts'), region: allOption('regions'), startDate: '2026-10-22', endDate: '2026-11-13' });

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Service requests', icon: ClipboardList, count: '128' },
  { label: 'Departments', icon: Users },
  { label: 'District map', icon: MapIcon },
];

function Sidebar({ open, onClose }) {
  return <>
    {open && <button className="scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Main navigation">
      <div className="brand"><div className="brand-mark">C</div><div><strong>Chennai District</strong><span>e-Governance Society</span></div><button className="icon-button close-nav" aria-label="Close navigation" onClick={onClose}><X size={19} /></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{navItems.map(({ label, icon: Icon, count }, index) => <a key={label} href="#overview" onClick={onClose} className={`nav-link ${index === 0 ? 'active' : ''}`} aria-current={index === 0 ? 'page' : undefined}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}</a>)}</nav>
      <div className="sidebar-bottom"><a className="nav-link" href="#settings"><Settings size={18} /><span>Settings</span></a><div className="help-card"><div className="help-icon"><Activity size={17} /></div><strong>Need a hand?</strong><p>View the manager guide to learn about your dashboard.</p><a href="#guide">Open guide <ChevronRight size={14} /></a></div><div className="profile"><div className="avatar">AR</div><div className="profile-text"><strong>Admin User</strong><span>District manager</span></div><ChevronDown size={16} className="profile-chevron" /></div></div>
    </aside>
  </>;
}

function SelectFilter({ label, value, options, onChange }) {
  return <label className="filter-control"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function KpiCard({ title, value, detail, icon: Icon, tone, trend }) {
  return <article className="kpi-card"><div className="kpi-top"><span>{title}</span><span className={`kpi-icon ${tone}`}><Icon size={18} /></span></div><div className="kpi-value">{value}</div><div className="kpi-detail"><span className={`trend ${trend.kind}`}>{trend.label}</span><span>{detail}</span></div></article>;
}

function RequestChart() {
  return null;
}

function MetricChart({ title, description, points, color, unit = '', summary, format = (value) => `${value}${unit}`, empty = false }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const width = 600;
  const height = 170;
  const padding = { top: 20, right: 22, bottom: 34, left: 35 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const coords = points.map((point, index) => ({
    ...point,
    x: padding.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth),
    y: padding.top + plotHeight - (point.value / max) * plotHeight,
  }));
  const line = coords.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return <article className="panel metric-chart-panel">
    <div className="metric-chart-heading"><div><h2>{title}</h2><p>{description}</p></div><span className="metric-chart-unit">{unit || 'requests'}</span></div>
    {empty || !points.length ? <div className="chart-empty">No matching records for this measure.</div> : <>
      <div className="metric-svg-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${summary}`}>
        {[0, 0.5, 1].map((fraction) => { const y = padding.top + plotHeight * fraction; return <g key={fraction}><line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="metric-grid-line" /><text x={padding.left - 7} y={y + 3} textAnchor="end" className="metric-axis-label">{format(max * (1 - fraction))}</text></g>; })}
        {points.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {coords.map((point) => <g key={point.label} className="metric-point" tabIndex="0" aria-label={`${point.label}: ${format(point.value)}; ${point.count} requests`}><circle cx={point.x} cy={point.y} r="5" fill={color} /><circle cx={point.x} cy={point.y} r="11" fill="transparent"><title>{`${point.label}: ${format(point.value)} (${point.count} requests)`}</title></circle><text x={point.x} y={height - 11} textAnchor="middle" className="metric-axis-label">{point.label}</text><text x={point.x} y={point.y - 10} textAnchor="middle" className="metric-value-label">{format(point.value)}</text></g>)}
      </svg></div><p className="metric-summary" role="note">{summary}</p>
    </>}
  </article>;
}

function StatusBadge({ status }) {
  const className = status.toLowerCase().replaceAll(' ', '-');
  return <span className={`status-badge ${className}`}><i />{status}</span>;
}

const demoUsers = { viewer: { password: 'viewer123', role: 'viewer' }, admin: { password: 'admin123', role: 'admin' } };
const emptyForm = { serviceType: '', department: '', officeName: '', officeCode: '', district: '', submittedAt: '', completedAt: '', slaDays: '5', rawStatus: 'in progress', grievance: false };

function LoginScreen({ onLogin }) {
  const [role, setRole] = useState('viewer');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (password !== demoUsers[role].password) { setError('That demo password does not match the selected role.'); return; }
    onLogin(role);
  };
  return <main className="login-screen"><form className="login-card" onSubmit={submit}><div className="brand-mark login-mark">C</div><p className="eyebrow">YUVAINTERN PROJECT DEMO</p><h1>Citizen services</h1><p className="login-copy">Choose a demo role to view the dashboard.</p><label className="form-field"><span>Demo role</span><select value={role} onChange={(event) => { setRole(event.target.value); setPassword(''); setError(''); }}><option value="viewer">Viewer — view only</option><option value="admin">Admin — manage requests</option></select></label><label className="form-field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button login-submit" type="submit">Sign in to demo</button><div className="demo-credentials"><strong>Demo credentials</strong><span>Viewer: <code>viewer123</code></span><span>Admin: <code>admin123</code></span></div><p className="security-note">Demo login for this internship project only. It is not production-grade security; credentials are visible in the client app.</p></form></main>;
}

function RequestFormDialog({ initial, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(initial ? {
    serviceType: initial.serviceType, department: initial.department, officeName: initial.officeName,
    officeCode: initial.sourceOfficeCode, district: initial.district,
    submittedAt: initial.submittedAt ? initial.submittedAt.toISOString().slice(0, 10) : '',
    completedAt: initial.completedAt ? initial.completedAt.toISOString().slice(0, 10) : '',
    slaDays: String(initial.slaDays), rawStatus: initial.rawStatus, grievance: initial.grievance,
  } : emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    const dialog = dialogRef.current;
    const fields = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])')];
    fields()[0]?.focus();
    const handleKeys = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const focusable = fields();
        const first = focusable[0]; const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    dialog?.addEventListener('keydown', handleKeys);
    return () => dialog?.removeEventListener('keydown', handleKeys);
  }, [onClose]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRequestForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true); setSaveError('');
    try { await onSave({ ...form, slaDays: Number(form.slaDays), completedAt: form.completedAt || null }); }
    catch (error) { setSaveError(error.message || 'Could not save this request.'); setSaving(false); }
  };
  const field = (key, label, type = 'text') => <label className="form-field"><span>{label}</span><input type={type} value={form[key]} onChange={(event) => set(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} />{errors[key] && <small className="field-error" id={`${key}-error`}>{errors[key]}</small>}</label>;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="request-form-title"><div className="dialog-heading"><div><h2 id="request-form-title">{initial ? 'Edit service request' : 'Add service request'}</h2><p>Fields marked required must be completed.</p></div><button className="icon-button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div><form onSubmit={submit} noValidate>{Object.keys(errors).length > 0 && <p className="form-error" role="alert">Please correct the highlighted fields below.</p>}<div className="form-grid">{field('serviceType', 'Service category *')}{field('department', 'Department *')}{field('officeName', 'Office name *')}{field('officeCode', 'Office code *')}{field('district', 'District / region *')}{field('submittedAt', 'Submitted date *', 'date')}{field('completedAt', 'Completed date', 'date')}{field('slaDays', 'SLA days *', 'number')}<label className="form-field"><span>Status *</span><select value={form.rawStatus} onChange={(event) => set('rawStatus', event.target.value)} aria-invalid={Boolean(errors.rawStatus)} aria-describedby={errors.rawStatus ? 'rawStatus-error' : undefined}><option value="in progress">In progress</option><option value="pending docs">Pending documents</option><option value="under review">Under review</option><option value="Resolved">Resolved</option><option value="closed">Closed</option></select>{errors.rawStatus && <small className="field-error" id="rawStatus-error">{errors.rawStatus}</small>}</label><label className="check-field"><input type="checkbox" checked={form.grievance} onChange={(event) => set('grievance', event.target.checked)} /><span>Grievance attached</span></label></div>{saveError && <p className="form-error" role="alert">{saveError}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Create request'}</button></div></form></section></div>;
}

function App() {
  const [role, setRole] = useState(() => localStorage.getItem('yuvaInternDemoRole') || '');
  const [rawRequests, setRawRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [theme, setTheme] = useState('light');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pollError, setPollError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState({});
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ key: 'submittedAt', direction: 'desc' });
  const [tableResult, setTableResult] = useState({ rows: [], total: 0, page: 1, pageCount: 1 });
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [period, setPeriod] = useState('This week');
  const [editingRequest, setEditingRequest] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [mutationMessage, setMutationMessage] = useState('');
  const [mutationError, setMutationError] = useState('');
  const loadRequests = useCallback(() => {
    let active = true;
    setLoading(true); setLoadError('');
    fetchMockRequests().then((records) => { if (active) setRawRequests(records); }).catch(() => { if (active) setLoadError('The mock request data could not be loaded. Refresh the page to try again.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => loadRequests(), [loadRequests]);
  useEffect(() => {
    if (!role) { setPreferencesReady(false); return; }
    setPreferencesReady(false);
    const preferences = readUserPreferences(localStorage, role, defaultFilters());
    setTheme(preferences.theme);
    setFilters(preferences.filters);
    setPreferencesReady(true);
  }, [role]);
  useEffect(() => {
    if (!role || !preferencesReady) return;
    try { writeUserPreferences(localStorage, role, { theme, filters }); } catch { /* The dashboard remains usable if browser storage is unavailable. */ }
  }, [role, theme, filters, preferencesReady]);
  useEffect(() => {
    if (!role) return undefined;
    let active = true;
    const poll = async () => {
      try {
        const records = await fetchMockRequests();
        if (active) { setRawRequests(records); setLastUpdated(new Date()); setPollError(''); }
      } catch {
        if (active) setPollError('Live refresh failed. Showing the last successfully loaded data; polling will retry.');
      }
    };
    poll();
    const timer = window.setInterval(poll, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [role]);
  const signIn = (nextRole) => { localStorage.setItem('yuvaInternDemoRole', nextRole); setRole(nextRole); };
  const signOut = () => { localStorage.removeItem('yuvaInternDemoRole'); setRole(''); };
  const saveRequest = async (values) => {
    if (editingRequest) await updateMockRequest(editingRequest.id, values);
    else await createMockRequest(values);
    setEditingRequest(null); setShowCreateForm(false); setMutationMessage(editingRequest ? 'Request updated; dashboard metrics refreshed.' : 'Request created; dashboard metrics refreshed.');
    setMutationError(''); setTablePage(1); loadRequests();
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteMockRequest(deleteTarget.id); setMutationMessage(`${deleteTarget.id} deleted; dashboard metrics refreshed.`); setMutationError(''); setDeleteTarget(null); setTablePage(1); loadRequests(); }
    catch (error) { setMutationError(error.message || 'Could not delete this request.'); setDeleteTarget(null); }
  };
  const requests = useMemo(() => rawRequests.map((record) => normalizeRequest(record)).sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0)), [rawRequests]);
  const options = useMemo(() => ({
    services: [allOption('services'), ...new Set(requests.map((request) => request.serviceType))],
    departments: [allOption('departments'), ...new Set(requests.map((request) => request.department))],
    offices: [allOption('offices'), ...new Map(requests.map((request) => [request.officeId, request.officeName])).values()],
    districts: [allOption('districts'), ...new Set(requests.map((request) => request.district))],
    regions: [allOption('regions'), ...new Set(requests.map((request) => request.district.startsWith('Chennai ') ? 'Chennai' : request.district))],
  }), [requests]);
  const filteredRequests = useMemo(() => filterRequests(requests, filters, search, options), [requests, filters, search, options]);
  useEffect(() => {
    setTablePage(1);
  }, [filters, search, columnSearch]);
  useEffect(() => {
    if (loading || loadError) return;
    let active = true;
    setTableLoading(true);
    setTableError('');
    fetchRequestPage({ records: filteredRequests, page: tablePage, pageSize, sortKey: sort.key, sortDirection: sort.direction, columnSearch })
      .then((result) => { if (active) setTableResult(result); })
      .catch(() => { if (active) setTableError('The request table could not be loaded. Try again.'); })
      .finally(() => { if (active) setTableLoading(false); });
    return () => { active = false; };
  }, [loading, loadError, filteredRequests, tablePage, pageSize, sort, columnSearch]);
  const visibleRequests = tableResult.rows;
  const metrics = useMemo(() => calculateDashboardMetrics(filteredRequests), [filteredRequests]);
  const { completedCount, averageTurnaround, grievanceCount, closedGrievanceCount: closedGrievances, closureRate } = metrics;
  const days = useMemo(() => {
    const grouped = new Map();
    filteredRequests.forEach((request) => {
      if (!request.submittedAt) return;
      const key = request.submittedAt.toISOString().slice(0, 10);
      const row = grouped.get(key) || { label: formatDate(request.submittedAt), requests: [], date: request.submittedAt };
      row.requests.push(request);
      grouped.set(key, row);
    });
    return [...grouped.values()].sort((a, b) => a.date - b.date);
  }, [filteredRequests]);
  const turnaroundPoints = days.map((day) => {
    const completedDay = day.requests.filter((request) => request.completedAt && request.turnaroundDays != null);
    return { label: day.label, value: completedDay.length ? completedDay.reduce((sum, request) => sum + request.turnaroundDays, 0) / completedDay.length : 0, count: completedDay.length };
  });
  const slaPoints = days.map((day) => ({ label: day.label, value: day.requests.filter((request) => request.pastSla).length, count: day.requests.length }));
  const grievancePoints = days.map((day) => {
    const dayGrievances = day.requests.filter((request) => request.grievance);
    const closedDayGrievances = dayGrievances.filter((request) => request.status === 'Resolved');
    return { label: day.label, value: dayGrievances.length ? (closedDayGrievances.length / dayGrievances.length) * 100 : 0, count: dayGrievances.length };
  });
  const resetFilters = () => { setFilters({ service: options.services[0], department: options.departments[0], office: options.offices[0], district: options.districts[0], region: options.regions[0], startDate: '2026-10-22', endDate: '2026-11-13' }); setSearch(''); setColumnSearch({}); setTablePage(1); };
  const exportFilteredCsv = async () => {
    setExporting(true);
    try {
      const result = await fetchRequestPage({ records: filteredRequests, page: 1, pageSize: Math.max(1, filteredRequests.length), sortKey: sort.key, sortDirection: sort.direction, columnSearch });
      downloadRequestsCsv(result.rows);
    } finally { setExporting(false); }
  };
  const toggleSort = (key) => setSort((current) => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  const columnFilter = (key, label) => <label className="column-search"><span className="sr-only">Search {label}</span><input value={columnSearch[key] || ''} onChange={(event) => setColumnSearch({ ...columnSearch, [key]: event.target.value })} placeholder="Filter" /></label>;
  const sortHeader = (key, label) => <button className="sort-header" onClick={() => toggleSort(key)} aria-label={`Sort by ${label}${sort.key === key ? `, currently ${sort.direction}` : ''}`}>{label}<span aria-hidden="true">{sort.key === key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span></button>;

  if (!role) return <LoginScreen onLogin={signIn} />;
  const isAdmin = canManageRequests(role);
  return <div className="app-shell" id="overview" data-theme={theme}>
    <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>Overview</strong></div></div><div className="topbar-right"><span className="role-pill">{isAdmin ? 'Admin demo' : 'Viewer demo'}</span><span className="today-label">Thursday, 13 November 2026</span><button className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button><button className="secondary-button signout-button" onClick={signOut}>Sign out</button><div className="top-avatar" aria-label={`${role} role`}>{role === 'admin' ? 'AD' : 'VW'}</div></div></header>
      <div className="page-container">
        {loadError && <div className="load-error" role="alert">{loadError}</div>}
        {mutationMessage && <div className="mutation-message" role="status">{mutationMessage}<button aria-label="Dismiss message" onClick={() => setMutationMessage('')}><X size={15} /></button></div>}
        {mutationError && <div className="load-error" role="alert">{mutationError}<button aria-label="Dismiss error" onClick={() => setMutationError('')}><X size={15} /></button></div>}
        <section className={`panel realtime-panel ${pollError ? 'realtime-error' : ''}`} aria-label="Live data updates"><span className={`realtime-indicator ${pollError ? 'offline' : ''}`} /><div><strong>{pollError ? 'Updates paused' : 'Live updates'}</strong><span role={pollError ? 'alert' : 'status'}>{pollError || (lastUpdated ? `Last checked ${lastUpdated.toLocaleTimeString()}. Refreshes every 5 seconds.` : 'Connecting to the mock API…')}</span></div><button className="secondary-button export-button" disabled={exporting || loading || filteredRequests.length === 0} onClick={exportFilteredCsv}><Download size={14} />{exporting ? 'Preparing…' : `Export CSV (${filteredRequests.length})`}</button><button className="text-button" onClick={() => loadRequests()}>Refresh now</button></section>
        <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" />DISTRICT OPERATIONS</div><h1>Service overview</h1><p>Track citizen requests and service performance across Chennai.</p></div><div className="report-date"><span>ACTIVE REPORTING PERIOD</span><strong>{filters.startDate || 'Any start'} – {filters.endDate || 'Any end'}</strong></div></section>
        <section className="filter-bar" aria-label="Dashboard filters"><div className="filter-title"><span>Filters</span><span className="filter-hint">All metrics use this selection</span></div><label className="filter-control date-filter"><span>From date</span><input aria-label="Start date" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} /></label><label className="filter-control date-filter"><span>To date</span><input aria-label="End date" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} /></label><SelectFilter label="Region" value={filters.region} options={options.regions} onChange={(region) => setFilters({ ...filters, region })} /><SelectFilter label="District" value={filters.district} options={options.districts} onChange={(district) => setFilters({ ...filters, district })} /><SelectFilter label="Service category" value={filters.service} options={options.services} onChange={(service) => setFilters({ ...filters, service })} /><SelectFilter label="Department" value={filters.department} options={options.departments} onChange={(department) => setFilters({ ...filters, department })} /><SelectFilter label="Office" value={filters.office} options={options.offices} onChange={(office) => setFilters({ ...filters, office })} /><button className="reset-button" onClick={resetFilters}>Reset</button></section>
        <section className="kpi-grid" aria-label="Key performance indicators"><KpiCard title="Requests received" value={loading ? '…' : metrics.requestCount} detail="matching requests" icon={ClipboardList} tone="blue" trend={{ label: 'Selected', kind: 'positive' }} /><KpiCard title="Avg. turnaround time" value={loading ? '…' : `${averageTurnaround}${averageTurnaround === '—' ? '' : ' days'}`} detail={`${completedCount} completed requests`} icon={Clock3} tone="violet" trend={{ label: 'Selected', kind: 'positive' }} /><KpiCard title="Past SLA" value={loading ? '…' : metrics.pastSlaCount} detail="open requests beyond SLA" icon={ShieldAlert} tone="orange" trend={{ label: 'Selected', kind: 'positive' }} /><KpiCard title="Grievance closure rate" value={loading ? '…' : closureRate} detail={`${closedGrievances} of ${grievanceCount} grievances closed`} icon={FileCheck2} tone="green" trend={{ label: 'Selected', kind: 'positive' }} /></section>
        {loading && <div className="state-message" role="status">Loading dashboard data… KPIs, charts, and table will update together.</div>}
        {loadError && <div className="state-message state-error" role="alert">{loadError}</div>}
        {!loading && !loadError && filteredRequests.length === 0 && <div className="state-message" role="status">No requests match these filters. Change the date range, region, district, or service category.</div>}
        <div className={`chart-grid-cards ${loading || loadError || filteredRequests.length === 0 ? 'muted-charts' : ''}`} aria-label="Performance charts">
          <MetricChart title="Average turnaround time" description="Completed requests, grouped by submission date" points={turnaroundPoints} color="#715bd0" unit="days" format={(value) => `${Number(value).toFixed(1)}d`} empty={!loading && !completedCount} summary={completedCount ? `Across the selected ${completedCount} completed requests, average turnaround is ${averageTurnaround} days. Points show the average for each submission date.` : ''} />
          <MetricChart title="Requests past SLA" description="Open requests beyond their service deadline" points={slaPoints} color="#df8a42" format={(value) => `${Math.round(value)}`} empty={!loading && !metrics.pastSlaCount} summary={`There are ${metrics.pastSlaCount} past-SLA requests in the current selection. Each point groups requests by submission date.`} />
          <MetricChart title="Grievance closure rate" description="Resolved grievances divided by all grievances" points={grievancePoints} color="#36a77b" unit="%" format={(value) => `${Math.round(value)}%`} empty={!loading && !grievanceCount} summary={grievanceCount ? `${closedGrievances} of ${grievanceCount} selected grievances are resolved (${closureRate}). Points show the rate by submission date.` : ''} />
        </div>
        {!loading && !loadError && <details className="data-check"><summary>Check these values against the filtered data</summary><p>All figures use the same {filteredRequests.length} requests that match the filters and search.</p><ul><li>Turnaround KPI: mean of the {completedCount} matching requests with a completion date ({averageTurnaround} days).</li><li>Past SLA KPI: {metrics.pastSlaCount} matching open requests beyond their due date.</li><li>Grievance closure KPI: {closedGrievances} resolved out of {grievanceCount} matching grievance requests ({closureRate}).</li><li>Chart points group those same matching records by submission date; hover or keyboard focus a point for its value and record count.</li></ul><p>Compare the “matching requests” KPI and table total first; then compare the completed and grievance counts above to the corresponding KPI and chart summary.</p></details>}
        <section className="panel requests-panel"><div className="table-heading"><div><div className="table-title-row"><h2>Citizen service requests</h2><span className="table-count">{loading ? '…' : tableResult.total}</span></div><p>Server-style mock results, using the dashboard filters</p></div><div className="table-tools"><label className="search-box"><Search size={16} /><span className="sr-only">Search all matching requests</span><input type="search" placeholder="Search matching requests..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="primary-button add-request-button" disabled={!isAdmin} title={!isAdmin ? 'Admin role required' : ''} onClick={() => setShowCreateForm(true)}><Plus size={15} />Add request</button></div></div><div className="table-scroll"><table><thead><tr><th scope="col">{sortHeader('id', 'Request ID')}</th><th scope="col">{sortHeader('serviceType', 'Service')}</th><th scope="col">{sortHeader('department', 'Department')}</th><th scope="col">{sortHeader('officeName', 'Office / code')}</th><th scope="col">{sortHeader('district', 'District')}</th><th scope="col">{sortHeader('submittedAt', 'Submitted')}</th><th scope="col">{sortHeader('completedAt', 'Completed')}</th><th scope="col">{sortHeader('turnaroundDays', 'Turnaround')}</th><th scope="col">{sortHeader('sla', 'SLA')}</th><th scope="col">{sortHeader('grievance', 'Grievance')}</th><th scope="col">{sortHeader('status', 'Status')}</th><th scope="col">Actions</th></tr><tr className="column-search-row"><th>{columnFilter('id', 'request ID')}</th><th>{columnFilter('serviceType', 'service')}</th><th>{columnFilter('department', 'department')}</th><th>{columnFilter('officeName', 'office')}</th><th>{columnFilter('district', 'district')}</th><th>{columnFilter('submittedAt', 'submission date')}</th><th>{columnFilter('completedAt', 'completion date')}</th><th>{columnFilter('turnaroundDays', 'turnaround')}</th><th>{columnFilter('sla', 'SLA')}</th><th>{columnFilter('grievance', 'grievance')}</th><th>{columnFilter('status', 'status')}</th><th>—</th></tr></thead><tbody>{loading || tableLoading ? <tr><td className="empty-state" colSpan="12" role="status">Loading this page of requests…</td></tr> : loadError || tableError ? <tr><td className="empty-state table-error" colSpan="12" role="alert">{tableError || loadError}</td></tr> : visibleRequests.length ? visibleRequests.map((request) => <tr key={request.id}><td className="request-id">{request.id}</td><td className="service-name">{request.serviceType}</td><td>{request.department}</td><td title={`Current office identity; source code ${request.sourceOfficeCode}`}>{request.officeName}<small className="table-subtext">{request.sourceOfficeCode}</small></td><td>{request.district}</td><td>{formatDate(request.submittedAt)}</td><td>{formatDate(request.completedAt)}</td><td>{request.turnaroundDays == null ? '—' : `${request.turnaroundDays} days`}</td><td><span className={request.pastSla ? 'sla-late' : 'sla-ok'}>{request.pastSla ? 'Past SLA' : `${request.slaDays} days`}</span></td><td>{request.grievance ? 'Yes' : 'No'}</td><td><StatusBadge status={request.status} /></td><td><div className="row-actions"><button aria-label={`Edit ${request.id}`} title={!isAdmin ? 'Admin role required' : 'Edit request'} disabled={!isAdmin} onClick={() => setEditingRequest(request)}><Pencil size={14} /></button><button aria-label={`Delete ${request.id}`} title={!isAdmin ? 'Admin role required' : 'Delete request'} disabled={!isAdmin} onClick={() => setDeleteTarget(request)}><Trash2 size={14} /></button></div></td></tr>) : <tr><td className="empty-state" colSpan="12">No requests match the dashboard filters and column searches.</td></tr>}</tbody></table></div><div className="table-footer pagination-footer"><span>Showing <strong>{tableResult.total ? `${(tableResult.page - 1) * pageSize + 1}–${Math.min(tableResult.page * pageSize, tableResult.total)}` : '0'}</strong> of <strong>{tableResult.total}</strong> requests</span><label className="page-size-control">Rows<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setTablePage(1); }}><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label><div className="page-controls"><button disabled={tableResult.page <= 1 || tableLoading} onClick={() => setTablePage((page) => Math.max(1, page - 1))}>Previous</button><span>Page {tableResult.page} of {tableResult.pageCount}</span><button disabled={tableResult.page >= tableResult.pageCount || tableLoading} onClick={() => setTablePage((page) => Math.min(tableResult.pageCount, page + 1))}>Next</button></div><button className="view-all-button" onClick={resetFilters}>Reset filters <ChevronRight size={15} /></button></div></section>
        {showCreateForm && <RequestFormDialog onClose={() => setShowCreateForm(false)} onSave={saveRequest} />}
        {editingRequest && <RequestFormDialog initial={editingRequest} onClose={() => setEditingRequest(null)} onSave={saveRequest} />}
        {deleteTarget && <div className="dialog-backdrop"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete request?</h2><p>Delete <strong>{deleteTarget.id}</strong>? This removes the fictional request from this browser’s saved demo data.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="danger-button" onClick={confirmDelete}>Delete request</button></div></section></div>}
        <footer className="page-footer"><span>Chennai District e-Governance Society</span><span>Data updated today at 9:42 AM <i className="footer-dot" /></span></footer>
      </div>
    </main>
  </div>;
}

export default App;
