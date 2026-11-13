# YuvaIntern Citizen Service Admin Dashboard

A fictional Chennai District e-Governance Society dashboard for monitoring citizen service requests. It is built as a client-side React app using Vite. The app uses a mock API and browser storage; it does not connect to a real government service or backend.

## Requirements

- Node.js (use a current LTS release) and npm
- A modern browser

## Install and run locally

From this project folder:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Useful project commands:

```sh
npm test          # run the Node test suite
npm run build     # create the production files in dist/
npm run preview   # serve the built files locally for a final check
```

## What is included

- KPI cards for request count, completed-request average turnaround, requests past SLA, and grievance closure rate.
- Interactive metric charts, date range, region, district, service, department, and office filters. KPIs, charts, and the request table use the same dashboard-filtered records.
- A request table with global and per-column search, sortable columns, and page controls.
- Admin-only create, edit, and confirmed-delete actions. Form validation reports required fields, invalid dates/date order, and invalid SLA-day values.
- Viewer and admin demo roles, light/dark mode, role-specific saved filters/theme, CSV download, and a five-second mock-data polling panel.
- Loading, error, and empty messages for data and table activity.

## Demo accounts and role behavior

Choose a role on the sign-in screen:

| Role | Password | Access |
| --- | --- | --- |
| Viewer | `viewer123` | Dashboard viewing and filtering; request changes are disabled. |
| Admin | `admin123` | Dashboard plus add, edit, and delete. |

These credentials and checks are in browser code. **This is an internship demo convenience, not production-grade security.** Do not use it to protect real data. A real deployment with real records needs server-side authentication, authorization, and a secure data service.

## Use the dashboard

1. Sign in as viewer or admin.
2. Set the date range, region/district, service category, department, or office. The KPI cards and charts recalculate from the matching requests.
3. In the table, enter a global search or use the small filter beneath a column heading. Select a heading to sort; select it again to reverse the direction. Use Rows and Previous/Next to move between result pages.
4. As admin, select **Add request**, or use a row’s edit/delete buttons. The form validates before saving, and deletion asks for confirmation.
5. Select **Export CSV** to download all requests matching dashboard filters, global search, and column searches—not just the current page.
6. Use the theme button to switch appearance. Your theme and dashboard filters are saved separately for viewer and admin in this browser.
7. The Live updates panel checks the mock API every five seconds and shows the latest successful check. Polling errors appear in that panel; the last loaded data stays visible while it retries.

## Mock data and normalization

`src/mockApi.js` provides fictional records, a server-style table query, local-storage CRUD, and the simulated polling endpoint. Data is normalized in `src/normalize.js` before use:

- Mixed ISO, slash-date, and English month timestamps are parsed. Invalid dates become empty values.
- Historical office codes map to a stable office identity; the source code is retained for display.
- Inconsistent free-text statuses map into common categories such as Resolved, Needs documents, Under review, Open, and In progress. The raw status is retained.
- Turnaround time uses completed requests for the average KPI. Past SLA counts open requests beyond their configured deadline. Grievance closure is resolved grievances divided by all matching grievance records.

The table’s “server-style” paging is a simulation: the browser loads the mock records, then `fetchRequestPage` filters/sorts/slices them in memory and returns one page plus totals. This is useful for demonstrating table behavior, but it is not true server-side pagination or a large-data backend. There is no row virtualization. The current sample has 25 fictional requests; performance with very large datasets has not been measured.

CRUD records and preferences use the current browser’s local storage. They are not shared between devices or users. The polling demo reads that same mock storage; it does not receive live updates from an external server.

For field definitions, exact cleanup rules, and mock API behavior, see [DATA.md](./DATA.md).

## Deployment recommendation: Vercel static hosting

Vercel is a suitable simple option for this Vite frontend: connect a Git repository and let Vercel build and serve the static `dist/` output. Vercel documents Git-based deployments and build/output configuration in its [Git deployment guide](https://vercel.com/docs/git) and [build configuration guide](https://vercel.com/docs/builds/configure-a-build).

Deployment steps (not performed):

1. Run `npm test` and `npm run build` locally. Optionally use `npm run preview` to inspect the production build.
2. Push the project to a GitHub, GitLab, or Bitbucket repository you control. Do not commit `node_modules/`, `.vite-cache/`, or private data.
3. Sign in to Vercel, choose **New Project**, and import that repository.
4. Set the project root to the repository folder containing `package.json` (if prompted). Use the Vite preset, install command `npm ci`, build command `npm run build`, and output directory `dist`.
5. No environment variables are required for this mock-only version.
6. Review the project settings and only select **Deploy** when you are ready to publish. Afterward, test the deployed URL, role demos, filter changes, CSV download, and browser-local persistence.