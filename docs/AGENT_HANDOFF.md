# SiteScope engineering handoff

## Purpose

Continue the existing SiteScope product toward the staged security-platform roadmap. Do not create another application unnecessarily. This planning branch changes documentation only.

## Known baseline

- Repository: `benjoco16/SiteScopev1`, public.
- Audited main: `511b1daaaa491d4978443c9434084160ab649c4a`.
- Frontend: React/Create React App.
- Most complete backend: `backend/server.js`, Express/PostgreSQL.
- Other Node/Python prototypes remain; the deployed startup command is not proven.
- Main has no complete database schema/migrations or CI. Backend tests are a placeholder; frontend test is stale scaffold coverage.
- A separate private production source was indicated by prior deployment information. This audit could not access it and did not establish source equivalence.
- Do not assume any capability documented as proposed is implemented or deployed.

Read [ARCHITECTURE.md](ARCHITECTURE.md), [AUDIT.md](AUDIT.md) and [ROADMAP.md](ROADMAP.md) before editing.

## Preserve existing work and data

- Inspect current remote heads, open PRs, repository instructions and relevant skills before continuing.
- Preserve all existing branches and data. In particular, review `2025-04-cursor-update@717ea3e08315a7caa01a800a40250909004e5f9e`; do not recreate its useful UI/profile/notification features blindly.
- That branch diverges from main and is not ready to merge wholesale. It includes duplicate route contracts and destructive SQL. Never run its migration/fix scripts against production.
- Use additive migrations and isolated fixtures, with explicit rollback/restore planning.
- Avoid changing deployment or runtime behavior in a documentation PR.

## First implementation gate

Resolve canonical deployment source and the privately reported authentication identity-binding finding before enabling scanner features. Do not publish exploitation steps in public issues or PRs. Verify account isolation, duplicate-account behavior, recovery and session handling using synthetic users in isolated tests.

The first Phase 1 feature slice is an offline HTTP-header/certificate observation evaluator with deterministic fixtures and a versioned finding contract. It takes observations, not URLs, and performs no networking. No new paid infrastructure is needed for this slice.

## Safe testing

- Do not start the current backend simply to inspect it: imports initialize integrations, and startup enables scheduled external requests.
- Separate app construction from listeners, timers, DB and external integration startup first.
- Test with mocked network/notification adapters and a disposable database only.
- Document exact passed, failed and not-run checks. Syntax-only success is not application readiness.
- Network-enabled passive checks require verified ownership, precise scope, expiry/revocation, destination enforcement, redirect/DNS tests, request budgets and cancellation.
- No secrets, customer data or real access tokens in fixtures or reports. Do not request/download/store exposed secrets.
- Unknown and incomplete checks must never become a secure pass.

## Permission and release boundaries

- Draft PRs and reviewable documentation/tests are allowed within the project task.
- Do not merge, enable auto-merge, deploy production, modify production databases, buy services or change live customer websites without explicit approval.
- Do not launch active scans against third-party sites.
- Potentially destructive validation belongs only in a properly isolated lab, even with owner authorization.
- No autonomous exploitation, persistent access, credential harvesting, privilege escalation, lateral movement, exfiltration or destructive payloads.
- Stop an operation that requires credentials, spending, additional authorization or a security-sensitive decision; report the exact blocker and continue independent safe work.
- Advanced live validation, backups and Security Lab must be separate, separately tested releases.

## Completion report checklist

Report changed files, remote branch/commit/PR, verified test results, remaining blockers, production-source confidence, data effects and the smallest next action. Never imply an unavailable integration, absent CI, proposed feature or unrun test is complete.
