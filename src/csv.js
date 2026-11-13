import { formatDate } from './normalize.js';

function quoteCsv(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function requestsToCsv(requests) {
  const columns = [
    ['Request ID', (row) => row.id],
    ['Service', (row) => row.serviceType],
    ['Department', (row) => row.department],
    ['Office', (row) => row.officeName],
    ['Office code', (row) => row.sourceOfficeCode],
    ['District', (row) => row.district],
    ['Submitted', (row) => formatDate(row.submittedAt)],
    ['Completed', (row) => formatDate(row.completedAt)],
    ['Turnaround days', (row) => row.turnaroundDays],
    ['SLA days', (row) => row.slaDays],
    ['Past SLA', (row) => row.pastSla ? 'Yes' : 'No'],
    ['Status', (row) => row.status],
    ['Raw status', (row) => row.rawStatus],
    ['Grievance', (row) => row.grievance ? 'Yes' : 'No'],
  ];
  return [columns.map(([label]) => quoteCsv(label)).join(','), ...requests.map((request) => columns.map(([, get]) => quoteCsv(get(request))).join(','))].join('\r\n');
}

export function downloadRequestsCsv(requests) {
  const blob = new Blob([`\uFEFF${requestsToCsv(requests)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'citizen-service-requests.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
