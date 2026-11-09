import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { makeRegisterHandler } from '../register.js';

// Never import the real database or server (which starts monitoring/integrations).
let query;
mock.module('../db.js', { namedExports: { q: (...args) => query(...args) } });
process.env.JWT_SECRET = randomBytes(32).toString('hex');
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD;
const { createUser, verifyUser, signToken, requireAuth } = await import('../auth.js');

function fixture() {
  const users = new Map();
  query = async (sql, values) => {
    if (sql.includes('INSERT INTO users(email, password_hash)')) {
      const [email, password_hash] = values;
      if (users.has(email)) {
        if (sql.includes('DO NOTHING')) return { rows: [] };
        if (sql.includes('DO UPDATE SET email = EXCLUDED.email')) {
          const existing = users.get(email);
          return { rows: [{ id: existing.id, email: existing.email }] };
        }
        assert.fail('unexpected conflict policy');
      }
      const user = { id: users.size + 1, email, password_hash };
      users.set(email, user);
      return { rows: [{ id: user.id, email }] };
    }
    assert.match(sql, /SELECT id, email, password_hash FROM users WHERE email=\$1/);
    return { rows: users.has(values[0]) ? [users.get(values[0])] : [] };
  };
  return users;
}

async function api(t, dependencies = { createUser, signToken }) {
  const app = express();
  app.use(express.json());
  app.post('/auth/register', makeRegisterHandler(dependencies));
  app.get('/identity', requireAuth, (req, res) => res.json(req.user));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (body, token) => {
    const response = await fetch(base + (token ? '/identity' : '/auth/register'), token
      ? { headers: { authorization: `Bearer ${token}` } }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
}

test('new registration hashes the password and binds the session to the inserted user', async t => {
  const users = fixture();
  const request = await api(t);
  const response = await request({ email: 'one@example.test', password: 'test-password-one' });
  assert.equal(response.status, 200);
  const stored = users.get('one@example.test');
  assert.notEqual(stored.password_hash, 'test-password-one');
  assert.equal(await bcrypt.compare('test-password-one', stored.password_hash), true);
  assert.equal(response.body.data.user.password_hash, undefined);
  const payload = jwt.verify(response.body.data.token, process.env.JWT_SECRET);
  assert.equal(payload.id, stored.id);
  assert.equal(payload.email, stored.email);
  assert.equal(payload.exp - payload.iat, 7 * 24 * 60 * 60);
});

test('duplicate registration leaves the account unchanged and returns no session', async t => {
  const users = fixture();
  await createUser('one@example.test', 'original-password');
  const original = { ...users.get('one@example.test') };
  let signs = 0;
  const request = await api(t, { createUser, signToken: () => { signs++; return 'unexpected'; } });
  const response = await request({ email: original.email, password: 'different-password' });
  assert.equal(response.status, 409);
  assert.deepEqual(response.body, { ok: false, error: 'registration_unavailable' });
  assert.equal(signs, 0);
  assert.deepEqual(users.get(original.email), original);
  assert.equal(await verifyUser(original.email, 'different-password'), null);
  assert.equal((await verifyUser(original.email, 'original-password')).id, original.id);
});

test('concurrent registrations create one account and one session', async t => {
  const users = fixture();
  const request = await api(t);
  const results = await Promise.all(Array.from({ length: 4 }, () => request({
    email: 'race@example.test', password: 'fixture-password'
  })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409, 409, 409]);
  assert.equal(users.size, 1);
  assert.equal(results.filter(r => r.body.data?.token).length, 1);
});

test('separate accounts retain distinct authenticated identities', async t => {
  fixture();
  const request = await api(t);
  const first = await request({ email: 'one@example.test', password: 'first-password' });
  const second = await request({ email: 'two@example.test', password: 'second-password' });
  const a = await request(null, first.body.data.token);
  const b = await request(null, second.body.data.token);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.notEqual(a.body.id, b.body.id);
  assert.equal(a.body.email, 'one@example.test');
  assert.equal(b.body.email, 'two@example.test');
  assert.equal(await verifyUser('one@example.test', 'second-password'), null);
});

test('missing or non-string credentials never reach persistence or token signing', async t => {
  const never = () => assert.fail('invalid input reached an adapter');
  const request = await api(t, { createUser: never, signToken: never });
  for (const body of [{}, { email: {}, password: 'x' }, { email: 'x', password: [] },
    { email: '  ', password: 'x' }, { email: 'x', password: '' }]) {
    assert.equal((await request(body)).status, 400);
  }
});

test('database failures return a generic error and never sign a token', async t => {
  query = async () => { throw new Error('synthetic private database detail'); };
  const request = await api(t, { createUser, signToken: () => assert.fail('unexpected signing') });
  const response = await request({ email: 'one@example.test', password: 'fixture-password' });
  assert.equal(response.status, 500);
  assert.deepEqual(response.body, { ok: false, error: 'register_failed' });
});
