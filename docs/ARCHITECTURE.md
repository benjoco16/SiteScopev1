# SiteScope architecture

Status: audited repository baseline and proposed design, not a production certification.  
Audit date: 2026-11-08.  
Repository: `benjoco16/SiteScopev1`.  
Baseline: `main` at `511b1daaaa491d4978443c9434084160ab649c4a`.

## Scope and source of truth

Extend the existing SiteScope application rather than create a replacement application. This document separates code observed in the baseline from proposed security-platform capabilities.

The repository has not been proven to be the source of the current production application. Prior deployment information points to a separate private backend repository. Access to that repository was unavailable during this audit, so source equivalence, deployed commit, deployment commands and database schema remain unverified here. Do not apply this repository's findings to production as confirmed facts. Reconcile the frontend and backend deployment source independently before implementation or release.

This review did not start the application, connect to production databases, send notifications, perform third-party scans, deploy changes or alter a production service.

## Observed application

### Runtime and entry points

- `frontend/`: React 19, React Router 7 and Create React App (`react-scripts` 5.0.1), using JavaScript/JSX.
- `backend/server.js`: the most feature-complete Node.js/Express 5 API. It imports PostgreSQL, authentication and notification modules and starts both an HTTP listener and an in-process monitoring timer.
- `backend/package.json`: ESM, but its `main` points to `app.js`; it has no start script and its test script deliberately exits unsuccessfully. The deployed command cannot be inferred from the package metadata.
- `backend/app.js`: a separate, earlier Express uptime prototype backed by an in-memory object.
- `backend/server.py` and `monitor.py`: a separate FastAPI/aiohttp in-memory prototype with no checked-in Python dependency manifest.
- No repository instructions (`AGENTS.md`), CI workflow, deployment manifest, container configuration or root workspace manifest is present in the audited main tree.

Choose and document the canonical entry point after deployment-source reconciliation. Do not delete alternate implementations or merge branches until their use is established.

### Current request and data flow

1. React pages submit signup, login and password-reset requests to the API.
2. Authentication returns a JWT. The frontend stores session information in local storage and supplies a Bearer token on authenticated API calls.
3. Authenticated site operations query PostgreSQL with a user identifier. Site logs are checked against site ownership before reading.
4. Creating a site through the current frontend persists it; monitoring updates happen on the background timer or an explicit check.
5. The API process periodically fetches every stored site's URL, stores the latest UP/DOWN result and appends a log row.
6. Status changes can send email through Nodemailer. Firebase browser setup and push-token storage exist; end-to-end scheduled push delivery is not wired into the main monitoring path.

The current monitoring result is availability, not a security assessment. An UP result must never be presented as proof that a site is secure.

### Frontend

Relevant modules:

- `src/App.js`: router, dashboard and push initialization.
- `src/context/AuthContext.jsx` and `ProtectedRoute.jsx`: local session state and client route guard.
- `src/pages/`: login, registration, forgotten-password and reset-password screens.
- `src/components/MonitorForm.jsx` and `MonitorList.jsx`: create, list, check, delete and view logs.
- `src/services/api.js`: HTTP wrapper and API functions.
- `src/firebase.js` and `public/firebase-messaging-sw.js`: Firebase Cloud Messaging setup.

The API base is built from `REACT_APP_API_BASE`, with a localhost development fallback. The log UI has HTTP-code and latency columns, but the main log API returns only status and checked time. This is a contract gap, not evidence of populated performance metrics.

The frontend's only checked-in test is the default Create React App “learn react” test. It does not describe the current SiteScope screen and is not useful feature coverage. Utility-style classes are present on main without a Tailwind build configuration; the separate cursor-update branch has Tailwind configuration.

### Backend and persistence

`db.js` uses `pg.Pool`, maximum 10 connections, and individual DB environment fields. It does not contain a migration runner or schema definition.

The schema below is inferred from SQL use, not verified against a running database:

| Relation | Fields referenced by main code | Notes |
| --- | --- | --- |
| users | id, email, password_hash | Email uniqueness is assumed by conflict clauses. |
| sites | id, user_id, url, status, last_checked | Uniqueness of (user_id, url) is assumed. |
| site_logs | site_id, status, checked_at | Retention, indexes and foreign-key behavior are not established. |
| password_resets | user_id, token, expires_at | Reset lifecycle needs a security review and transactional tests. |
| user_tokens | user_id, token | Uniqueness is assumed by conflict handling. |

There is no complete schema or migration history on main. Backfill, rollback, constraints, backups and restore behavior must be established with an isolated database and approved schema metadata. Do not reconstruct production by blindly executing SQL from a feature branch.

### Authentication and tenancy

The code implements password hashing, JWT issuance/verification, login, registration and password reset. Multiple authentication helper implementations exist. Client-side routing is a convenience; authorization must remain enforced on every server operation and worker job.

Registration identity binding is a release-blocking security-review item. Further owner-only details were communicated separately and are intentionally omitted from this public document. Session lifecycle, secret configuration, recovery, abuse controls, cross-user authorization and privileged-account behavior also require a reviewed baseline before any scanner is exposed.

No organization/workspace model, granular roles, verified target ownership or scan-specific authorization model is implemented on main.

### Monitoring and jobs

- The feature-complete server uses a 60-second in-process sweep.
- It checks sites sequentially and uses a 10-second request abort timeout.
- It classifies HTTP success responses as UP and other outcomes as DOWN.
- It updates the site row and inserts a log separately.
- There is no durable job queue, per-job lease, cancellation, retry policy, per-target request budget or multi-instance coordination.
- Slow sweeps can overlap the next interval. Restarts discard in-memory notification cooldown state.
- URL ownership and a comprehensive outbound destination policy have not been established.

Do not extend this timer directly into a security scanner. Existing uptime monitoring and future security scans need separate job types and independently enforced permissions.

### Notifications and configuration

Main uses Nodemailer for email, with a shared environment-selected recipient and URL-keyed in-memory notification state. SMTP transport security and tenant-specific delivery require review. Importing the alert module invokes an SMTP verification call, and Firebase initialization expects a local service-account file. The application should become safe to import for tests without these effects.

Known configuration variable names, without values:

- API/database: `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.
- Auth: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- Email: `EMAIL_USER`, `EMAIL_PASS`, `ALERT_TO`, `NOTIFY_COOLDOWN_MS`.
- Frontend API: `REACT_APP_API_BASE`.
- Firebase client: `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_STORAGE_BUCKET`, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`, `REACT_APP_FIREBASE_APP_ID`, `REACT_APP_FIREBASE_VAPID_KEY`.

The example backend environment file covers email only. Do not put credentials in documents, test fixtures, client bundles, logs or pull requests. Firebase client configuration is public client metadata, not a server private key; backend Firebase service-account material is secret.

### Existing branch work to preserve

Nine branches were present before this planning branch. Four are strictly behind main and four have diverged:

| Branch | Ahead / behind main | Observed value or caution |
| --- | --- | --- |
| 09-2025-Email-notification | 0 / 6 | Earlier notification work. |
| 09-2025-feature/auto-monitoring | 0 / 8 | Earlier monitoring work. |
| 10-2025-database-integration | 0 / 5 | Earlier DB work. |
| 99 | 0 / 9 | Earlier prototype. |
| 10-2025-login-and-signup-work | 1 / 5 | Authentication/reset changes and archived source. |
| 2025-01-Notifications-and-logs | 2 / 5 | Notifications/logs changes; current head differs despite historical merged PR. |
| 2025-03-Updated-profile-and-dashboard | 3 / 5 | Profile routes and screens. |
| 2025-04-cursor-update | 5 / 5 | Dashboard components, Tailwind, notification settings, middleware and SQL. |

The cursor-update branch at `717ea3e08315a7caa01a800a40250909004e5f9e` has valuable work but is not a safe drop-in production baseline. It contains duplicate route registrations and inconsistent authentication response contracts. Its SQL includes destructive column recreation and a sample update to an existing user. Do not execute those scripts against production. Review and selectively reuse tested changes only after identifying the canonical source.

## Proposed extension architecture

This section is a design proposal, not implemented functionality. Preserve the existing React frontend, Node API and PostgreSQL where technically appropriate. A separate worker process is an execution boundary in the same product, not a replacement application.

### Components

1. **Existing web frontend:** target inventory, ownership verification, scan request/status, findings and remediation guidance.
2. **Existing API, modularized:** authentication/tenancy, verified target registry, policy validation, scan records and results access.
3. **Policy service:** canonical target scope, ownership evidence, verification expiry, permitted check types, request limits and revocation. Validate both when creating a job and when executing it.
4. **Isolated passive worker:** bounded DNS/TLS/HTTP observations, no credentials from the core application, no arbitrary user-defined scripts, constrained egress and cancellation.
5. **Durable jobs:** start with the simplest suitable PostgreSQL-backed queue/lease design if requirements permit; introduce another queue service only with measured need and spending approval.
6. **Findings pipeline:** deterministic check evaluation, minimal redacted evidence, check/version metadata and reliable completion state.
7. **Notification outbox:** tenant-specific recipient consent, durable retry/idempotency, separate from scan execution.
8. **Advisory adapter:** commercially licensed vulnerability intelligence, source/version provenance, cache rights and freshness recorded.

### Required boundaries

- Website verification is not authorization to scan every host related to it. Bind the exact normalized origin, allowed subdomains/ports and check types.
- Restrict schemes and destinations. Reject private, loopback, link-local, reserved and metadata destinations; handle IPv4/IPv6, DNS changes and every redirect. Connection-time enforcement must match the validated destination.
- Revalidate ownership and policy before each job and when scope changes. Revocation cancels queued and running work.
- Bound time, redirects, concurrency, request count and bytes. Exclude authentication, form submission, crawling beyond the approved scope and intrusive payloads from passive work.
- Do not probe for, download or store exposed secrets. Stop collection and redact unexpected sensitive material.
- Retain only the evidence needed to explain a finding, with explicit retention and access controls.
- Preserve existing customer data. Use additive, versioned migrations tested with isolated fixtures, backup/restore rehearsal and reviewed rollback.
- Enforce tenant isolation for targets, jobs, findings, evidence, notifications and cancellation.
- Failure, timeout, unavailable data and skipped checks are incomplete, never a secure pass.

### Proposed data additions

Add versioned migrations for verified target ownership, verification events, scope/policy versions, scan jobs and check runs, findings, evidence summaries, advisory provenance, notification outbox records and audit events. Use immutable job snapshots for policy and engine versions. Exact tables and indexes require a schema design review; they are not present in the current application.

Each result should carry check identity/version, target scope, observation time, result category, severity, confidence, evidence summary, explanation, remediation and completeness/failure reason. Categories are **confirmed**, **potential**, **recommendation**, **informational** and **incomplete**. Category and severity are separate dimensions.

See [ROADMAP.md](ROADMAP.md) for implementation and release gates and [AUDIT.md](AUDIT.md) for verification limits.

