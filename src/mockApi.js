// Fictional records shaped like responses from several district service systems.
// The inconsistent dates, office codes, and status strings are intentional.
const rawRequests = [
  { id: 'CSR-2481', serviceType: 'Birth Certificate', department: 'Revenue', officeName: 'Anna Nagar Zone Office', officeCode: 'ANZ-01', district: 'Chennai North', submittedAt: '2026-11-12T09:18:00+05:30', completedAt: null, slaDays: 5, rawStatus: 'in progress', grievance: false },
  { id: 'CSR-2479', serviceType: 'Property Tax', department: 'Revenue', officeName: 'T. Nagar Zone Office', officeCode: 'TNZ-04', district: 'Chennai Central', submittedAt: '12/11/2026 10:40 AM', completedAt: '', slaDays: 3, rawStatus: 'pending docs', grievance: false },
  { id: 'CSR-2476', serviceType: 'Water Connection', department: 'Water Supply', officeName: 'Adyar Zone Office', officeCode: 'ADY-03', district: 'Chennai South', submittedAt: '2026-11-11 08:05', completedAt: null, slaDays: 2, rawStatus: 'open', grievance: true },
  { id: 'CSR-2472', serviceType: 'Streetlight Repair', department: 'Public Works', officeName: 'Velachery Zone Office', officeCode: 'VEL-07', district: 'Chennai South', submittedAt: '11 Nov 2026, 6:22 PM', completedAt: null, slaDays: 2, rawStatus: 'In Progress', grievance: false },
  { id: 'CSR-2468', serviceType: 'Community Certificate', department: 'Revenue', officeName: 'Mylapore Zone Office', officeCode: 'MYL-02', district: 'Chennai Central', submittedAt: '2026-11-10T11:12:00+05:30', completedAt: '2026-11-12T15:40:00+05:30', slaDays: 4, rawStatus: 'Resolved', grievance: true },
  { id: 'CSR-2465', serviceType: 'Birth Certificate', department: 'Revenue', officeName: 'Anna Nagar Zone Office', officeCode: 'AN-01', district: 'Chennai North', submittedAt: '09/11/2026', completedAt: '11/11/2026', slaDays: 5, rawStatus: 'closed', grievance: false },
  { id: 'CSR-2461', serviceType: 'Property Tax', department: 'Revenue', officeName: 'T Nagar Zonal Office', officeCode: 'TZN-04', district: 'Chennai Central', submittedAt: '2026-11-08T14:05:00Z', completedAt: null, slaDays: 3, rawStatus: 'awaiting review', grievance: false },
  { id: 'CSR-2458', serviceType: 'Water Connection', department: 'Water Supply', officeName: 'Adyar Zone Office', officeCode: 'ADY-03', district: 'Chennai South', submittedAt: '08 Nov 2026 09:30', completedAt: '10 Nov 2026 12:15', slaDays: 4, rawStatus: 'Closed', grievance: true },
  { id: 'CSR-2454', serviceType: 'Streetlight Repair', department: 'Public Works', officeName: 'Velachery Zone Office', officeCode: 'VEL-07', district: 'Chennai South', submittedAt: '2026-11-07 17:45:00', completedAt: null, slaDays: 2, rawStatus: 'pending', grievance: false },
  { id: 'CSR-2450', serviceType: 'Community Certificate', department: 'Revenue', officeName: 'Mylapore Zone Office', officeCode: 'MYL-02', district: 'Chennai Central', submittedAt: '06/11/2026 11:20', completedAt: '09/11/2026', slaDays: 4, rawStatus: 'resolved', grievance: false },
  { id: 'CSR-2447', serviceType: 'Birth Certificate', department: 'Revenue', officeName: 'Anna Nagar Zonal Office', officeCode: 'ANZ-01', district: 'Chennai North', submittedAt: '2026-11-05T07:55:00+05:30', completedAt: null, slaDays: 5, rawStatus: 'PENDING DOCS', grievance: true },
  { id: 'CSR-2442', serviceType: 'Water Connection', department: 'Water Supply', officeName: 'Adyar Zone Office', officeCode: 'ADY-03', district: 'Chennai South', submittedAt: '04 Nov 2026, 03:10 PM', completedAt: '2026-11-09T10:30:00+05:30', slaDays: 4, rawStatus: 'Resolved', grievance: false },
  { id: 'CSR-2438', serviceType: 'Property Tax', department: 'Revenue', officeName: 'T. Nagar Zone Office', officeCode: 'TNZ-04', district: 'Chennai Central', submittedAt: '2026-11-03T13:00:00+05:30', completedAt: null, slaDays: 3, rawStatus: 'in progress', grievance: false },
  { id: 'CSR-2433', serviceType: 'Streetlight Repair', department: 'Public Works', officeName: 'Velachery Zone Office', officeCode: 'VEL-07', district: 'Chennai South', submittedAt: '02/11/2026 07:48 AM', completedAt: '03/11/2026 06:30 PM', slaDays: 2, rawStatus: 'closed', grievance: true },
  { id: 'CSR-2429', serviceType: 'Community Certificate', department: 'Revenue', officeName: 'Mylapore Zone Office', officeCode: 'MYL-02', district: 'Chennai Central', submittedAt: '2026-11-01T10:05:00+05:30', completedAt: null, slaDays: 4, rawStatus: 'under review', grievance: false },
  { id: 'CSR-2424', serviceType: 'Birth Certificate', department: 'Revenue', officeName: 'Anna Nagar Zone Office', officeCode: 'ANZ-01', district: 'Chennai North', submittedAt: '31 Oct 2026 16:40', completedAt: '02 Nov 2026 11:15', slaDays: 5, rawStatus: 'RESOLVED', grievance: true },
  { id: 'CSR-2419', serviceType: 'Water Connection', department: 'Water Supply', officeName: 'Adyar Zonal Office', officeCode: 'ADY-03', district: 'Chennai South', submittedAt: '2026-10-30 08:20', completedAt: null, slaDays: 3, rawStatus: 'pending docs', grievance: false },
  { id: 'CSR-2413', serviceType: 'Property Tax', department: 'Revenue', officeName: 'T Nagar Zonal Office', officeCode: 'TGN-04', district: 'Chennai Central', submittedAt: '29/10/2026', completedAt: '01/11/2026', slaDays: 4, rawStatus: 'closed', grievance: false },
  { id: 'CSR-2408', serviceType: 'Streetlight Repair', department: 'Public Works', officeName: 'Velachery Zone Office', officeCode: 'VEL-07', district: 'Chennai South', submittedAt: '2026-10-28T18:10:00+05:30', completedAt: null, slaDays: 2, rawStatus: 'Open', grievance: true },
  { id: 'CSR-2402', serviceType: 'Community Certificate', department: 'Revenue', officeName: 'Mylapore Zone Office', officeCode: 'MYL-02', district: 'Chennai Central', submittedAt: '27 Oct 2026, 09:10 AM', completedAt: '30 Oct 2026', slaDays: 4, rawStatus: 'Resolved', grievance: false },
  { id: 'CSR-2397', serviceType: 'Water Connection', department: 'Water Supply', officeName: 'Adyar Zone Office', officeCode: 'ADY-03', district: 'Chennai South', submittedAt: '2026-10-26T12:25:00+05:30', completedAt: null, slaDays: 3, rawStatus: 'awaiting inspection', grievance: false },
  { id: 'CSR-2391', serviceType: 'Birth Certificate', department: 'Revenue', officeName: 'Anna Nagar Zone Office', officeCode: 'ANZ-01', district: 'Chennai North', submittedAt: '25/10/2026 14:35', completedAt: '28/10/2026 10:05', slaDays: 5, rawStatus: 'closed', grievance: false },
  { id: 'CSR-2386', serviceType: 'Property Tax', department: 'Revenue', officeName: 'T. Nagar Zone Office', officeCode: 'TNZ-04', district: 'Chennai Central', submittedAt: '2026-10-24 08:00:00', completedAt: null, slaDays: 3, rawStatus: 'pending docs', grievance: true },
  { id: 'CSR-2380', serviceType: 'Streetlight Repair', department: 'Public Works', officeName: 'Velachery Zone Office', officeCode: 'VEL-07', district: 'Chennai South', submittedAt: '23 Oct 2026 06:15 PM', completedAt: '2026-10-24T13:45:00+05:30', slaDays: 2, rawStatus: 'Resolved', grievance: false },
  { id: 'CSR-2375', serviceType: 'Community Certificate', department: 'Revenue', officeName: 'Mylapore Zone Office', officeCode: 'MYL-02', district: 'Chennai Central', submittedAt: '2026-10-22T10:30:00+05:30', completedAt: null, slaDays: 4, rawStatus: 'in progress', grievance: false },
];

const STORAGE_KEY = 'yuvaInternCitizenRequestsV1';
function readStoredRequests() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(rawRequests);
  } catch {
    return structuredClone(rawRequests);
  }
}
function saveStoredRequests(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// Simulates a small API call. This keeps data access separate from UI components.
export async function fetchMockRequests() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  return readStoredRequests();
}

export async function createMockRequest(record) {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const records = readStoredRequests();
  const created = { ...record, id: `CSR-${String(Date.now()).slice(-6)}` };
  records.unshift(created);
  saveStoredRequests(records);
  return created;
}

export async function updateMockRequest(id, changes) {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const records = readStoredRequests();
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) throw new Error('This request could not be found. Refresh the dashboard and try again.');
  records[index] = { ...records[index], ...changes, id };
  saveStoredRequests(records);
  return records[index];
}

export async function deleteMockRequest(id) {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const records = readStoredRequests();
  const updated = records.filter((record) => record.id !== id);
  if (updated.length === records.length) throw new Error('This request could not be found. Refresh the dashboard and try again.');
  saveStoredRequests(updated);
}

// A server-style endpoint: filter and search first, sort second, then return
// only the requested page together with the total number of matching records.
export async function fetchRequestPage({ records, page = 1, pageSize = 10, sortKey = 'submittedAt', sortDirection = 'desc', columnSearch = {} }) {
  await new Promise((resolve) => setTimeout(resolve, 260));
  const fields = {
    id: (row) => row.id,
    serviceType: (row) => row.serviceType,
    department: (row) => row.department,
    officeName: (row) => row.officeName,
    district: (row) => row.district,
    submittedAt: (row) => row.submittedAt ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(row.submittedAt) : '—',
    completedAt: (row) => row.completedAt ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(row.completedAt) : '—',
    turnaroundDays: (row) => row.turnaroundDays == null ? '—' : `${row.turnaroundDays} days`,
    sla: (row) => row.pastSla ? 'past sla' : `${row.slaDays} days`,
    grievance: (row) => row.grievance ? 'yes' : 'no',
    status: (row) => row.status,
  };
  let matching = records.filter((record) => Object.entries(columnSearch).every(([key, query]) => {
    if (!query?.trim()) return true;
    return String(fields[key]?.(record) ?? '').toLowerCase().includes(query.trim().toLowerCase());
  }));
  const getValue = fields[sortKey] || fields.submittedAt;
  matching = [...matching].sort((a, b) => {
    const left = getValue(a);
    const right = getValue(b);
    const result = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? result : -result;
  });
  const total = matching.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return { rows: matching.slice((safePage - 1) * pageSize, safePage * pageSize), total, page: safePage, pageCount };
}
