export function canManageRequests(role) {
  return role === 'admin';
}

export function filterRequests(requests, filters, search, options) {
  const query = search.trim().toLowerCase();
  return requests.filter((request) => {
    const region = request.district.startsWith('Chennai ') ? 'Chennai' : request.district;
    const day = request.submittedAt?.toISOString().slice(0, 10) || '';
    return (filters.service === options.services[0] || request.serviceType === filters.service)
      && (filters.department === options.departments[0] || request.department === filters.department)
      && (filters.office === options.offices[0] || request.officeName === filters.office)
      && (filters.district === options.districts[0] || request.district === filters.district)
      && (filters.region === options.regions[0] || region === filters.region)
      && (!filters.startDate || day >= filters.startDate)
      && (!filters.endDate || day <= filters.endDate)
      && (!query || `${request.id} ${request.serviceType} ${request.department} ${request.officeName} ${request.sourceOfficeCode} ${request.district} ${request.status}`.toLowerCase().includes(query));
  });
}

export function calculateDashboardMetrics(requests) {
  const completed = requests.filter((request) => request.completedAt);
  const grievances = requests.filter((request) => request.grievance);
  const closedGrievances = grievances.filter((request) => request.status === 'Resolved').length;
  return {
    requestCount: requests.length,
    completedCount: completed.length,
    averageTurnaround: completed.length ? (completed.reduce((sum, request) => sum + request.turnaroundDays, 0) / completed.length).toFixed(1) : '—',
    pastSlaCount: requests.filter((request) => request.pastSla).length,
    grievanceCount: grievances.length,
    closedGrievanceCount: closedGrievances,
    closureRate: grievances.length ? `${Math.round((closedGrievances / grievances.length) * 100)}%` : '—',
  };
}

export function validateRequestForm(form) {
  const errors = {};
  ['serviceType', 'department', 'officeName', 'officeCode', 'district', 'submittedAt', 'rawStatus'].forEach((key) => {
    if (!String(form[key] ?? '').trim()) errors[key] = 'This field is required.';
  });
  const isRealDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!isRealDate(form.submittedAt)) errors.submittedAt = 'Enter a valid submission date.';
  if (form.completedAt && !isRealDate(form.completedAt)) errors.completedAt = 'Enter a valid completion date.';
  if (form.completedAt && form.submittedAt && form.completedAt < form.submittedAt) errors.completedAt = 'Completion date must be on or after submission date.';
  if (!Number.isInteger(Number(form.slaDays)) || Number(form.slaDays) < 1 || Number(form.slaDays) > 365) errors.slaDays = 'Enter a whole number from 1 to 365.';
  return errors;
}
