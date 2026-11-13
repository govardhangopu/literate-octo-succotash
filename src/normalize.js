// Office codes can change after reorganizations. These aliases map old and new
// source codes to one stable office identity used by filters and reports.
const officeDirectory = {
  'ANZ-01': { id: 'chennai-anna-nagar', name: 'Anna Nagar Zone Office' },
  'AN-01': { id: 'chennai-anna-nagar', name: 'Anna Nagar Zone Office' },
  'TNZ-04': { id: 'chennai-t-nagar', name: 'T. Nagar Zone Office' },
  'TZN-04': { id: 'chennai-t-nagar', name: 'T. Nagar Zone Office' },
  'TGN-04': { id: 'chennai-t-nagar', name: 'T. Nagar Zone Office' },
  'ADY-03': { id: 'chennai-adyar', name: 'Adyar Zone Office' },
  'VEL-07': { id: 'chennai-velachery', name: 'Velachery Zone Office' },
  'MYL-02': { id: 'chennai-mylapore', name: 'Mylapore Zone Office' },
};

const monthNames = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function parseLocalDateTime(year, month, day, hour = 0, minute = 0, second = 0) {
  const date = new Date(Date.UTC(year, month, day, hour, minute, second));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  if (date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) return null;
  return date;
}

// Accepts ISO timestamps, YYYY-MM-DD (optionally with time), slash dates, and
// common English month strings. Date-only/local values are treated as Chennai time.
export function normalizeDate(value) {
  if (value == null || value === '') return null;
  const input = String(value).trim();
  const iso = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(input);
    const parsed = new Date(input.replace(' ', 'T'));
    if (hasZone && !Number.isNaN(parsed.getTime())) return parsed;
    return parseLocalDateTime(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), Number(iso[4] || 0), Number(iso[5] || 0), Number(iso[6] || 0));
  }

  const slash = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i);
  if (slash) {
    let hour = Number(slash[4] || 0);
    if (slash[6]) hour = (hour % 12) + (slash[6].toUpperCase() === 'PM' ? 12 : 0);
    return parseLocalDateTime(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]), hour, Number(slash[5] || 0));
  }

  const english = input.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i)
    || input.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i);
  if (english) {
    const dayFirst = /^\d/.test(input);
    const day = Number(dayFirst ? english[1] : english[2]);
    const month = monthNames[(dayFirst ? english[2] : english[1]).toLowerCase()];
    let hour = Number(english[4] || 0);
    if (english[6]) hour = (hour % 12) + (english[6].toUpperCase() === 'PM' ? 12 : 0);
    if (month !== undefined) return parseLocalDateTime(Number(english[3]), month, day, hour, Number(english[5] || 0));
  }
  return null;
}

export function normalizeStatus(rawStatus, completedAt) {
  const status = String(rawStatus || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (['closed', 'resolved', 'complete', 'completed'].includes(status)) return 'Resolved';
  if (status.includes('pending doc') || status.includes('awaiting document')) return 'Needs documents';
  if (status.includes('review') || status.includes('inspection')) return 'Under review';
  if (status === 'open' || status === 'new') return 'Open';
  if (status.includes('progress') || status === 'pending') return 'In progress';
  if (completedAt) return 'Resolved';
  return 'In progress';
}

export function normalizeRequest(raw, now = new Date('2026-11-13T12:00:00+05:30')) {
  const submittedAt = normalizeDate(raw.submittedAt);
  const completedAt = normalizeDate(raw.completedAt);
  const office = officeDirectory[raw.officeCode] || { id: `unknown-${raw.officeCode}`, name: raw.officeName.trim() };
  const turnaroundDays = submittedAt && completedAt
    ? Math.max(0, Math.round((completedAt - submittedAt) / 86400000 * 10) / 10)
    : submittedAt ? Math.max(0, Math.round((now - submittedAt) / 86400000 * 10) / 10) : null;
  const status = normalizeStatus(raw.rawStatus, completedAt);
  const slaDueAt = submittedAt ? new Date(submittedAt.getTime() + Number(raw.slaDays) * 86400000) : null;

  return {
    id: raw.id,
    serviceType: raw.serviceType.trim(),
    department: raw.department.trim(),
    officeId: office.id,
    officeName: office.name,
    sourceOfficeCode: raw.officeCode,
    district: raw.district.trim(),
    submittedAt,
    completedAt,
    turnaroundDays,
    slaDays: Number(raw.slaDays),
    slaDueAt,
    pastSla: Boolean(!completedAt && slaDueAt && now > slaDueAt),
    rawStatus: raw.rawStatus,
    status,
    grievance: Boolean(raw.grievance),
  };
}

export const formatDate = (date) => date ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date) : '—';
