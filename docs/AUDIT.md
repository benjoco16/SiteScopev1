# SiteScope repository audit

Audit date: 2026-11-08.  
Baseline: [main at 511b1da](https://github.com/benjoco16/SiteScopev1/tree/511b1daaaa491d4978443c9434084160ab649c4a).  
Method: read-only GitHub source/branch/PR/CI inspection plus local syntax and manifest checks. This is not a penetration test, full dependency audit or production assessment.

## Executive result

SiteScopev1 contains an existing uptime-monitoring application worth extending. It is not yet a verified, reproducible foundation for a public security scanner. Resolve source-of-production uncertainty and the authentication security gate first, then establish isolated tests and guarded target access.

The production backend's source could not be compared with this repository because access to the separate private source was unavailable. No claim is made that the audited public code is deployed. No production service, website or database was modified or tested.

## Evidence collected

- Repository visibility: public; default branch: main; not archived.
- Main head: `511b1daaaa491d4978443c9434084160ab649c4a`, last commit dated 2025-10-31.
- Recursive main tree: 58 entries, complete response, no truncation.
- Nine existing branches enumerated; all eight non-main heads compared against main.
- Two historical PRs found, both closed and merged. No open PR existed before this planning work.
- Main branch listing reports `protected: false`. Full administrative ruleset/protection settings were not audited.
- Repository Actions run listing returned zero runs.
- Main commit status listing returned no statuses; PR-triggered workflow lookup returned no runs. These are absence of evidence, not a passing CI result.
- No `.github/workflows` files are in the audited main tree.
- Main application source, README files, manifests, authentication, database access, monitoring, notification and frontend modules inspected.
- The substantial `2025-04-cursor-update` branch was additionally reviewed for source organization, route contracts and migrations. This is not a line-by-line audit of every historical branch.

## Findings and priorities

### Release blockers

1. **Source and deployment provenance:** identify the actual deployed frontend/backend sources, commits, runtime commands and configuration names before implementing changes intended for production.
2. **Authentication baseline:** resolve the registration identity-binding finding privately and prove the corrected behavior with isolated regression and cross-user tests. Review secret configuration, privileged access and recovery/session behavior as part of this gate.
3. **Verified targets and network policy:** do not expose security checks before ownership, exact scope and robust outbound destination restrictions are enforced.
4. **Database reproducibility and preservation:** main lacks complete migrations/schema. Feature-branch SQL contains destructive changes and sample mutations; do not run it on production.
5. **Test and CI baseline:** the backend test command intentionally fails and the frontend has a stale scaffold test. No automated CI evidence exists for the audited commit.

Security-sensitive mechanics are intentionally omitted from this public report. They were reported separately to the owner; no proof-of-exploit request or payload was sent to a live service.

### Important engineering gaps

- Multiple backend prototypes and conflicting package entry metadata leave startup ambiguous.
- API imports have notification and credential-file initialization effects, making isolated tests unsafe without refactoring/mocking.
- The in-process sequential sweep has no durable jobs or overlap guard, and notification state is lost on restart.
- Main notifications use a shared recipient and URL-level state; tenant-specific delivery needs design and tests.
- Push-token collection exists, but the main sweep does not provide end-to-end push delivery.
- The password-reset URL uses a development origin; production recovery behavior is unverified.
- Status/log responses do not supply all metrics displayed by the UI.
- The frontend session/logout implementations overlap and need a single tested contract.
- Diverged branches contain reusable UI/profile/notification work, but duplicate routes and differing response contracts prevent a blind merge.
- Error handling, operational logging, data retention, rate budgets and concurrency behavior need explicit tests and documentation.
- Current uptime results do not imply vulnerability scanning, WordPress inventory, backup, Security Lab, AI security analysis or commercial SaaS readiness.

## Dependency review

Declared main dependencies include:
- Backend: Express 5.1, PostgreSQL client 8.16, JSON Web Token 9.0, bcrypt 6.0 and bcryptjs 3.0, node-fetch 3.3, Nodemailer 7.0, Firebase Admin 13.5, cors and dotenv.
- Frontend: React/React DOM 19.1, React Router 7.9, react-scripts 5.0.1, Firebase 12.3 and testing-library packages.

These are manifest ranges, not an assertion of installed or deployed versions. Both lockfiles are tracked, although the root ignore file also ignores package-lock.json, which is confusing for future dependency updates. No package install, lifecycle script, dependency advisory request, license scan or production build was run during this documentation audit. Resolve a supported runtime, exact locked versions, package advisories and commercial licensing before shipping. No CVE-free or license-compliant claim is made.

## Credential exposure review

- No tracked `.env` or Firebase service-account JSON file appears in the audited main tree. An email-oriented `.env.example` exists.
- Pattern review of 38 selected main text files found a Firebase client API-key pattern in the service worker. Public Firebase client configuration is distinct from server-side credentials and is not, by itself, proof of a secret leak.
- No private-key marker or recognized high-risk token pattern was identified in that bounded text review.
- Secret values were not copied into this report, logs or findings.
- This was a limited heuristic review. It did not examine the complete Git history, all branch file contents, binary ZIP archives, hosted runtime configuration or provider-side credential restrictions.
- Tracked source ZIP archives warrant a separate controlled review with output redaction. Never assume the absence of a filename on main means it never appeared in history.
- If a real credential is found, stop disclosure, notify the owner privately, plan rotation/revocation and history remediation with approval. Removing a file alone does not revoke a credential.

## Checks actually run

| Check | Result | Limits |
| --- | --- | --- |
| GitHub main recursive tree and branch comparisons | Completed | Repository state only, not deployment state. |
| Repository Actions runs and main commit statuses | No runs/statuses returned | Not a green CI result; admin settings not audited. |
| `node --check` on nine main backend JavaScript files | Passed | Syntax only under Node 24.22.1; no imports, dependencies or application behavior executed. |
| JSON parse of backend/frontend package manifests | Passed | Does not validate lockfile resolution, build or runtime compatibility. |
| Backend test suite | Not run | Existing script explicitly reports no tests and exits 1. |
| Frontend test/build | Not run | Dependencies not installed; checked-in test is stale scaffold coverage. |
| Database/integration/notification/scan tests | Not run | No isolated integration setup supplied; production and third-party activity excluded. |
| Full history/archive secret scan and dependency security review | Not run | Requires a separate controlled workflow. |

Do not interpret a syntax check as functional or security validation. No service was started. No SMTP message, Firebase notification, uptime fetch or scan was triggered.

## Next decisions

1. Confirm the intended canonical frontend/backend repositories and provide authorized read access to their exact deployed source.
2. Privately review the authentication finding and any necessary live exposure mitigation. A live change requires explicit approval.
3. Review this planning PR and select a minimal foundation-fix PR.
4. Then implement the offline Phase 1 evaluator described in [ROADMAP.md](ROADMAP.md), without enabling network requests.
5. Reconcile the project board/issue dependencies with evidence after each implementation PR, not with optimistic completion claims.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the observed components and proposed extension, and [AGENT_HANDOFF.md](AGENT_HANDOFF.md) for continuation boundaries.

