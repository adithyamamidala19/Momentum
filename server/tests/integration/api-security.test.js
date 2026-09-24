import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../app.js';

test('Security & API Authorization Test Suite', async (t) => {
  await t.test('1. GET /api/health returns 200 OK with liveness status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(typeof res.body.uptimeSeconds === 'number');
  });

  await t.test('2. Security Headers & Cache-Control: no-store on all API endpoints', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.headers['cache-control'], 'no-store, no-cache, must-revalidate, proxy-revalidate');
    assert.equal(res.headers['pragma'], 'no-cache');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-powered-by'], undefined); // Strict removal of X-Powered-By
    assert.ok(res.headers['content-security-policy']);
  });

  await t.test('3. Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/auth/me' },
      { method: 'get', path: '/api/today' },
      { method: 'get', path: '/api/rituals' },
      { method: 'post', path: '/api/rituals' },
      { method: 'get', path: '/api/todos' },
      { method: 'post', path: '/api/todos' },
      { method: 'get', path: '/api/hydration' },
      { method: 'post', path: '/api/hydration' },
      { method: 'get', path: '/api/protein' },
      { method: 'post', path: '/api/protein' },
      { method: 'get', path: '/api/focus/sessions' },
      { method: 'get', path: '/api/workouts' },
      { method: 'get', path: '/api/insights' },
      { method: 'get', path: '/api/milestones' },
      { method: 'get', path: '/api/challenge/weekly' },
      { method: 'get', path: '/api/profile/export' }
    ];

    for (const r of protectedRoutes) {
      const res = await request(app)[r.method](r.path);
      assert.equal(res.status, 401, `Expected 401 for ${r.method.toUpperCase()} ${r.path}`);
      assert.equal(res.body.code, 'AUTH_REQUIRED');
    }
  });

  await t.test('4. POST /api/auth/session rejects missing or invalid body with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/session')
      .send({}); // Missing idToken

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
  });

  await t.test('5. POST /api/auth/session rejects unknown fields (strict Zod schema)', async () => {
    const res = await request(app)
      .post('/api/auth/session')
      .send({ idToken: 'valid-format-token', maliciousUnknownField: 'injected' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(res.body.details.some((d) => d.message.includes('Unrecognized key')));
  });

  await t.test('6. NoSQL Injection attempts are sanitized and rejected', async () => {
    // Attempting query selector injection like { "$gt": "" }
    const res = await request(app)
      .post('/api/auth/session')
      .send({ idToken: { $gt: '' } });

    assert.equal(res.status, 400);
  });

  await t.test('7. Unknown API routes return 404 with sanctuary message', async () => {
    const res = await request(app).get('/api/unknown-sanctuary-path');
    assert.equal(res.status, 404);
    assert.ok(res.body.error.includes('Sanctuary path not found'));
  });
});
