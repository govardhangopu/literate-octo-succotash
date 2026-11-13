import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDate, normalizeRequest, normalizeStatus } from '../src/normalize.js';
import { calculateDashboardMetrics, canManageRequests, filterRequests, validateRequestForm } from '../src/dashboardLogic.js';
import { fetchMockRequests, fetchRequestPage, createMockRequest, updateMockRequest, deleteMockRequest } from '../src/mockApi.js';
import { requestsToCsv } from '../src/csv.js';
import { readUserPreferences, writeUserPreferences } from '../src/preferences.js';

const all = (name) => `All ${name}`;
const filterOptions = { services: [all('services')], departments: [all('departments')], offices: [all('offices')], districts: [all('districts')], regions: [all('regions')] };
const request = (overrides = {}) => normalizeRequest({
  id: 'T-1', serviceType: 'Birth Certificate', department: 'Revenue', officeName: 'Anna Nagar Zone Office', officeCode: 'AN-01', district: 'Chennai North',
  submittedAt: '2026-11-01T09:00:00+05:30', completedAt: '2026-11-03T09:00:00+05:30', slaDays: 5, rawStatus: 'Resolved', grievance: true, ...overrides,
}, new Date('2026-11-13T12:00:00+05:30'));

test('normalizes mixed dates, office aliases, and source status variants', () => {
  assert.equal(normalizeDate('12/11/2026 10:40 AM').toISOString(), '2026-11-12T10:40:00.000Z');
  assert.equal(normalizeDate('11 Nov 2026, 6:22 PM').toISOString(), '2026-11-11T18:22:00.000Z');
  assert.equal(normalizeDate('not a date'), null);
  assert.equal(normalizeDate('2026-02-31'), null);
  assert.equal(request({ officeCode: 'AN-01' }).officeId, request({ officeCode: 'ANZ-01' }).officeId);
  assert.equal(normalizeStatus(' closed ', null), 'Resolved');
  assert.equal(normalizeStatus('pending docs', null), 'Needs documents');
});

test('calculates KPI values from the provided filtered records', () => {
  const records = [request(), request({ id: 'T-2', completedAt: null, rawStatus: 'open', grievance: true, slaDays: 1 })];
  const result = calculateDashboardMetrics(records);
  assert.equal(result.requestCount, 2);
  assert.equal(result.completedCount, 1);
  assert.equal(result.averageTurnaround, '2.0');
  assert.equal(result.pastSlaCount, 1);
  assert.equal(result.grievanceCount, 2);
  assert.equal(result.closedGrievanceCount, 1);
  assert.equal(result.closureRate, '50%');
});

test('applies date, district, region, service, and text filters together', () => {
  const rows = [request(), request({ id: 'T-2', district: 'Chennai South', serviceType: 'Water Connection', submittedAt: '2026-10-01' })];
  const filtered = filterRequests(rows, { service: 'Birth Certificate', department: all('departments'), office: all('offices'), district: 'Chennai North', region: 'Chennai', startDate: '2026-11-01', endDate: '2026-11-05' }, 't-1', filterOptions);
  assert.deepEqual(filtered.map((row) => row.id), ['T-1']);
  assert.deepEqual(filterRequests(rows, { ...filterOptions, startDate: '2026-12-01', endDate: '' }, '', filterOptions), []);
});

test('admin permission allows mutations and viewer permission does not', () => {
  assert.equal(canManageRequests('admin'), true);
  assert.equal(canManageRequests('viewer'), false);
  assert.equal(canManageRequests('unknown'), false);
});

test('saves theme and dashboard filters independently for each demo role', () => {
  const store = new Map();
  const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const fallback = { service: 'All services', startDate: '2026-10-22' };
  writeUserPreferences(storage, 'viewer', { theme: 'dark', filters: { ...fallback, service: 'Property Tax' } });
  writeUserPreferences(storage, 'admin', { theme: 'light', filters: { ...fallback, service: 'Water Connection' } });
  assert.equal(readUserPreferences(storage, 'viewer', fallback).theme, 'dark');
  assert.equal(readUserPreferences(storage, 'viewer', fallback).filters.service, 'Property Tax');
  assert.equal(readUserPreferences(storage, 'admin', fallback).filters.service, 'Water Connection');
  assert.equal(readUserPreferences(storage, 'new-role', fallback).filters.startDate, '2026-10-22');
});

test('validates required values and rejects impossible or reversed dates', () => {
  assert.deepEqual(validateRequestForm({ serviceType: 'Tax', department: 'Revenue', officeName: 'Office', officeCode: 'X', district: 'North', submittedAt: '2026-02-31', completedAt: '', slaDays: '4', rawStatus: 'open' }).submittedAt, 'Enter a valid submission date.');
  const errors = validateRequestForm({ serviceType: '', department: '', officeName: '', officeCode: '', district: '', submittedAt: '2026-11-10', completedAt: '2026-11-09', slaDays: '0', rawStatus: '' });
  assert.equal(errors.serviceType, 'This field is required.');
  assert.equal(errors.completedAt, 'Completion date must be on or after submission date.');
  assert.match(errors.slaDays, /1 to 365/);
  const valid = validateRequestForm({ serviceType: 'Tax', department: 'Revenue', officeName: 'Office', officeCode: 'X', district: 'North', submittedAt: '2026-11-10', completedAt: '2026-11-10', slaDays: '4', rawStatus: 'open' });
  assert.deepEqual(valid, {});
});

test('table endpoint filters columns, sorts, and paginates with matching totals', async () => {
  const rows = [request({ id: 'T-3', serviceType: 'Water Connection' }), request({ id: 'T-1' }), request({ id: 'T-2' })];
  const first = await fetchRequestPage({ records: rows, page: 1, pageSize: 2, sortKey: 'id', sortDirection: 'asc' });
  assert.deepEqual(first.rows.map((row) => row.id), ['T-1', 'T-2']);
  assert.equal(first.total, 3);
  assert.equal(first.pageCount, 2);
  const second = await fetchRequestPage({ records: rows, page: 2, pageSize: 2, sortKey: 'id', sortDirection: 'asc' });
  assert.deepEqual(second.rows.map((row) => row.id), ['T-3']);
  const columnSearch = await fetchRequestPage({ records: rows, page: 1, pageSize: 10, columnSearch: { serviceType: 'water' } });
  assert.deepEqual(columnSearch.rows.map((row) => row.id), ['T-3']);
});

test('CSV quotes commas and quotes while preserving embedded line breaks', () => {
  const csv = requestsToCsv([request({ id: 'A,"B"', serviceType: `line one\nline two`, rawStatus: 'pending, "docs"' })]);
  assert.match(csv, /"A,""B"""/);
  assert.ok(csv.includes('line one\nline two'));
  assert.match(csv, /"pending, ""docs"""/);
});

test('mock API create, update, delete, and storage reload persist changes', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const seed = await fetchMockRequests();
  const created = await createMockRequest({ id: 'ignored', serviceType: 'Fictional Test', department: 'Revenue', officeName: 'Test Office', officeCode: 'TEST-1', district: 'Chennai North', submittedAt: '2026-11-13', completedAt: null, slaDays: 3, rawStatus: 'open', grievance: false });
  assert.equal((await fetchMockRequests()).length, seed.length + 1);
  const updated = await updateMockRequest(created.id, { rawStatus: 'closed' });
  assert.equal(updated.rawStatus, 'closed');
  await deleteMockRequest(created.id);
  assert.equal((await fetchMockRequests()).length, seed.length);
  delete globalThis.localStorage;
});
