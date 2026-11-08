# SiteScope security-platform roadmap

Planning baseline: 2026-11-08, `main@511b1daaaa491d4978443c9434084160ab649c4a`.  
This roadmap describes future work, not shipped capabilities. Extend the existing SiteScope product; do not start another application unnecessarily.

## Non-negotiable release rules

- No production deployment, merge or paid service purchase without explicit approval.
- No production database modifications during testing.
- No active scans against third-party sites as part of this audit or planning task.
- Verified ownership and explicit scope are required before network-enabled checks.
- Do not deliberately crash, erase, corrupt or compromise production websites.
- Potentially destructive testing belongs only in an appropriately isolated environment, even when the owner authorizes testing.
- No unrestricted autonomous exploitation, persistent access, credential harvesting, privilege escalation, lateral movement, data exfiltration or destructive payload execution.
- Never download or store exposed secrets.
- Advanced live validation, backups and Security Lab are separate releases after additional testing.
- Unknown, failed, skipped and incomplete checks must never be labeled secure.

## Phase 0: Audit and Foundation

**Goal:** establish a known, testable and safe baseline before scanner development.

Work:
1. Reconcile the actual frontend/backend deployment repository, branch and commit with this repository. Record runtime commands, runtime versions and non-secret configuration names.
2. Review diverged branches and preserve useful work without blind merges.
3. Resolve the registration identity-binding security gate, then cover authentication, password recovery, session lifecycle and tenant isolation with isolated regression tests.
4. Choose one canonical backend entry point. Separate app construction, scheduler startup, DB access and external integrations so importing a module causes no external effects.
5. Establish complete versioned DB migrations, development/test fixtures and a verified backup/restore plan. Replace destructive historical migration patterns.
6. Create a deterministic dependency install/build/test baseline, dependency/advisory review, license inventory, CI and a credential-safe history/archive review.
7. Establish ownership-verification, target-policy and outbound network enforcement designs before enabling scan requests.
8. Define data retention, audit records, operational alerts, rollback and a staged release checklist.

Exit evidence:
- Canonical source and deployment mapping recorded; unknowns explicit.
- Security regression and cross-tenant tests pass in an isolated environment.
- Reproducible frontend build and backend tests; required CI checked for exact PR commits.
- Schema creation and migration/rollback tests work on fixtures without touching production.
- No unresolved release-blocking security findings.
- Ownership and egress policy acceptance tests agreed.
- Owner reviews the foundation PRs; no implicit deploy approval.

This documentation package completes documentation and static audit work only. It does not complete all Phase 0 tasks.

## Phase 1: Passive Security Scanner

**Goal:** safe, non-destructive security observations for verified websites.

Planned scope:
- Certificate validity/expiry and relevant SSL/TLS configuration observations.
- Relevant HTTP security headers, interpreting context rather than treating every missing header as a vulnerability.
- Narrowly scoped website configuration observations that do not request sensitive files or collect secret material.
- WordPress core, plugin and theme advisory intelligence from sources whose commercial-use and redistribution rights are verified before integration.
- Evidence-based results categorized as confirmed, potential, recommendation, informational or incomplete.
- Clear uncertainty and remediation, with observation time, check version and advisory provenance.

Release gates:
- Phase 0 security baseline passed.
- Target ownership, exact scope, expiry and revocation enforced.
- SSRF/DNS/redirect/egress defenses tested with controlled fixtures.
- Request/byte/time/concurrency budgets, cancellation and idempotency tested.
- Tenant isolation and safe evidence retention verified.
- Tests use controlled local fixtures or explicitly authorized staging targets, never arbitrary third-party sites.
- Failures stay incomplete; an absent fingerprint is not proof of no vulnerable software.
- Manual review and explicit approval before any production deployment.

### Smallest implementation slice

**First security correction:** after source reconciliation, make a narrowly scoped authentication identity-binding fix with a duplicate-registration regression test and cross-user negative tests. Keep sensitive exploit details out of public discussions. No scanner should be exposed before this passes review.

**First Phase 1 feature slice:** implement a pure, fixture-driven HTTP-header/certificate observation evaluator in the existing backend codebase. Its input is a typed observation object, not a URL; its output is the versioned finding/check-result contract. Provide representative safe fixtures and tests for missing data, contradictory evidence, malformed input and incomplete observations. This slice must make **zero network requests**, use no production DB and require no new paid service.

Acceptance criteria:
1. Existing uptime routes and data are unchanged.
2. The evaluator is importable without starting the API, timer, DB, SMTP or Firebase.
3. Checks produce category, severity, confidence, evidence summary, remediation and completeness separately.
4. Missing/failed observations generate incomplete results, not a pass.
5. Sensitive headers, query values and bodies are not copied into findings.
6. Deterministic unit tests run in CI with all networking disabled.
7. Documentation explicitly says it is an offline evaluation module, not a functioning live scanner.

Follow-on slice: verified target registration and a guarded transport worker behind a disabled-by-default feature flag, with mocked DNS/redirect/egress and tenant-isolation tests. No live scanning is authorized by merging a pure evaluator.

## Phase 2: Attack Surface Discovery

**Goal:** explain assets related to a verified scope without treating discovery as permission to test.

Plan:
- Maintain an asset inventory with source, timestamp, confidence and relationship evidence.
- Start with permitted passive sources; licensing, privacy and rate limits are reviewed per source.
- Separate discovered candidates from verified, authorized targets.
- Detect scope drift and require verification/approval before adding active checks.

Gate: documented scope controls, deduplication and provenance, with no automatic expansion of authorization.

## Phase 3: Authorization and Controlled Testing

**Goal:** introduce separately approved, bounded validation beyond the passive scanner.

Plan:
- Versioned authorization records identifying the owner, assets, allowed tests, time window and stop conditions.
- Human-approved test plans, cancellation/kill switch, rate budgets, audit records and monitoring.
- Allowlisted non-destructive methods only on live targets.
- Redirect potentially destructive validation to an isolated environment.

Gate: independent security review and controlled staging evidence. No general-purpose autonomous exploitation or lateral movement.

## Phase 4: Backup and Security Lab

**Goal:** provide recoverable, isolated environments before stronger validation.

Plan:
- Explicit permission and privacy review for each backup source.
- Encryption, tenant isolation, retention/deletion policy and restore verification.
- Sanitized lab copies with no production credentials, no production write access and tightly restricted outbound connections.
- Resource limits, teardown and authorization-bound test scenarios.

Gate: restore drills, isolation/egress tests and verified absence of production access. Backups and Security Lab ship separately from the passive scanner and from advanced live validation.

## Phase 5: AI Security Assistant

**Goal:** explain evidence and help prioritize remediation, with tools constrained by policy.

Plan:
- Ground explanations in recorded findings and source provenance.
- Treat website content, advisory text and logs as untrusted input.
- Resist prompt injection and do not grant the model arbitrary network, shell or exploit privileges.
- Require human approval for consequential actions and never invent completed checks.
- Evaluate unsupported claims, false confidence, sensitive-data leakage and cross-tenant retrieval.

Gate: adversarial evaluations, evidence traceability and strict action boundaries. The assistant may explain uncertainty; it must not hide it.

## Phase 6: Commercial SaaS Features

**Goal:** package a safe, supportable multi-tenant service.

Plan:
- Organizations, roles, plans, quotas, billing, onboarding, reports and support workflows.
- Verified ownership and permissions integrated with every plan and workspace.
- Audit logs, operational monitoring, incident response, privacy notices, retention and export/deletion controls.
- Commercial license review for advisory sources and third-party dependencies.
- Capacity/cost forecasts and explicit approval before paid infrastructure or subscriptions.

Gate: security and tenant-isolation review, billing tests, operational readiness, approved terms and privacy handling, and explicit launch approval.

## Delivery method

- One small reviewable PR per coherent slice, draft by default.
- Link issues and the project board; record dependencies and objective acceptance criteria.
- Separate documentation, safety corrections, fixtures, transport and UI work where possible.
- Report tests as passed, failed or not run, with precise limits.
- Verify remote commit and checks before declaring a PR ready.
- Preserve existing data and user changes; never assume a green local check authorizes merge or deployment.

See [ARCHITECTURE.md](ARCHITECTURE.md), [AUDIT.md](AUDIT.md) and [AGENT_HANDOFF.md](AGENT_HANDOFF.md).
