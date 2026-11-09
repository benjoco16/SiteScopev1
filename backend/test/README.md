# Isolated authentication tests

Run with Node.js 24:

    cd backend
    npm ci --ignore-scripts --no-audit --no-fund
    npm test

The tests execute the registration handler over loopback HTTP using real Express,
bcryptjs and jsonwebtoken. Node's experimental module mock replaces the database
before auth.js is imported. The server entry point is never imported: no monitoring
timer, external fetch, SMTP or Firebase startup runs. Only synthetic accounts and
a randomly generated in-process JWT signing key are used.

Coverage includes new and repeated registration, concurrent registration requests,
separate session identities, malformed input and database failures. The conflict
fixture verifies the SQL contract and models an atomic unique-email insert; it is
not a PostgreSQL integration test or proof of the deployed schema's constraints.

Registration keeps the existing success response and returns HTTP 409 with
`registration_unavailable` when insertion conflicts. Email matching remains the
existing database equality behavior; case normalization and schema changes are
outside this patch.

These tests do not certify the entire authentication system. Privileged login,
JWT secret configuration, recovery, revocation, tenant-owned resource access,
rate limits, database integration and production-source reconciliation still need
separate review. Do not deploy this patch as a complete security baseline.
