# Mock service request data

All records in `src/mockApi.js` are invented for this YuvaIntern dashboard. The mock API returns source-shaped records asynchronously, like a small API call, so the interface does not depend on hand-written rows in a component.

## Fields on a source record

| Field | Meaning |
| --- | --- |
| `id` | Fictional request reference. |
| `serviceType` | Citizen service requested. |
| `department` | Department responsible for the request. |
| `officeName`, `officeCode` | Office label and the code present in the source system. Codes can change during reorganizations. |
| `district` | Fictional district grouping used by the dashboard. |
| `submittedAt` | Source submission timestamp. Formats and time zone notation intentionally vary. |
| `completedAt` | Completion timestamp, or `null`/empty when the request is not complete. |
| `slaDays` | Allowed number of calendar days from submission to completion. |
| `rawStatus` | Unedited source status, including inconsistent spelling and wording. |
| `grievance` | Whether a grievance is attached to the request. |

## Cleanup rules

`src/normalize.js` is the one place where source values are cleaned before the UI uses them:

- Date strings in ISO, slash-date, and common English month formats become JavaScript `Date` values. Explicit time-zone timestamps keep their instant; dates and local timestamps are interpreted as Chennai local time (UTC+05:30). Dates that cannot be parsed become `null` and display as an em dash.
- `officeCode` aliases map to a stable office ID and display name. The source code stays on the normalized record so it is still visible for audits. For example, `AN-01` and `ANZ-01` identify the same Anna Nagar office.
- Case and separator differences in raw status values are normalized into `Resolved`, `Needs documents`, `Under review`, `Open`, or `In progress`. The original value remains available as `rawStatus`.
- Turnaround time is elapsed calendar days between submission and completion. For open requests it is elapsed time through the dashboard snapshot (`2026-11-13 12:00 Chennai time`). SLA due date is submission plus the configured calendar days; an open request after that date is marked past SLA.
- The average turnaround KPI uses completed requests only. The grievance closure KPI uses grievance-tagged requests and counts those normalized as resolved. Filters apply to the records before KPI calculation.

## Table pagination and sorting demo

`fetchRequestPage` in `src/mockApi.js` simulates a server endpoint. It applies the dashboard's date, region, district, service, department, office, and global search first. It then applies per-column searches, sorts the matching records, and returns only the requested page plus a total count and page count.

- Select a column heading to sort ascending; select it again to reverse the direction.
- Use the small `Filter` input under a heading to search that displayed column.
- Previous/Next and Rows request another page without reloading the app.
- Changing dashboard filters or any search resets the current page to page one.
- The table shows the returned page rows; its total count reflects every record matching all active dashboard and column filters.

## Demo login and request changes

- Viewer demo password: `viewer123`. Admin demo password: `admin123`.
- Viewers can use dashboard filters and read the table. Add, edit, and delete controls are disabled for viewers.
- Admins can create and edit requests with the same form. Required fields, date validity/order, and SLA day range are checked before saving. Delete asks for confirmation.
- Changes are saved to this browser's local storage by the mock API and reload into the dashboard after refresh. Use the browser's site storage controls to clear demo changes and return to the original fictional sample data.
- **This login is only a convenience for the internship demo. It is not production-grade security.** The demo credentials and role check live in the browser, so they do not protect real data or replace server-side authentication and authorization.

## Theme, saved filters, export, and updates

- Light/dark mode and dashboard filters are stored separately under each role (`viewer` and `admin`) in browser local storage. Signing in as either demo role restores that role's last choices.
- **Export CSV** downloads all requests matching the current dashboard filters, global search, and per-column table searches (not just the current page). Every CSV field is quoted; embedded quotes are doubled, so commas and line breaks remain valid CSV data.
- The Live updates panel polls the mock API every five seconds and shows its latest successful check time. A polling failure is shown in that panel and the last loaded dashboard data remains available while the next poll retries.

## Run the dashboard

```sh
npm install
npm run dev
```

Open the local address printed by Vite. `npm run build` creates a production build in `dist/`.
