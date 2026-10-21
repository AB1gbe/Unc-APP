// Test helpers: a fresh in-memory app per test file, plus shortcuts to
// create users in any verification state through the real API.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Must be set BEFORE the app modules load, which is why they are imported
// dynamically below (cross-platform: no NODE_ENV=test in package.json).
process.env.NODE_ENV = 'test';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'unc-test-'));
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'AdminPass123';

const { default: request } = await import('supertest');
const { openDb } = await import('../src/db.js');
const { createApp } = await import('../src/app.js');
const { ensureAdmin } = await import('../src/seed.js');

// Smallest valid PNG header - enough to pass the file-type check.
export const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

export async function setup() {
  const db = openDb(':memory:');
  await ensureAdmin(db);
  const app = createApp(db);
  const admin = request.agent(app);
  await admin.post('/api/auth/login').send({ email: 'admin@test.local', password: 'AdminPass123' }).expect(200);

  let n = 0;
  // stage: 'registered' | 'email' | 'pending' | 'approved'
  async function user(stage = 'approved', accountType = 'individual') {
    n += 1;
    const agent = request.agent(app);
    const reg = await agent.post('/api/auth/register').send({
      email: `user${n}@test.local`, password: 'Password123', displayName: `User ${n}`, accountType, city: 'Austin',
    }).expect(201);
    agent.id = reg.body.user.id;
    if (stage === 'registered') return agent;
    await agent.post('/api/auth/verify-email').send({ code: reg.body.devCode }).expect(200);
    if (stage === 'email') return agent;
    // Business accounts also need a business name, number and document.
    const business = accountType === 'business' ? { businessName: `Test Shop ${n}`, businessRegNumber: `CR-${n}-1234` } : {};
    const sub = await kyc(agent, { idNumber: `ID-${n}-0000${n}`, ...business }, { businessDoc: accountType === 'business' }).expect(201);
    if (stage === 'pending') return agent;
    await admin.post(`/api/admin/kyc/${sub.body.submission.id}/decision`).send({ decision: 'approved' }).expect(200);
    return agent;
  }

  // businessDoc: also attach the business registration document.
  function kyc(agent, overrides = {}, { businessDoc = false } = {}) {
    const f = { legalName: 'Test Person', dateOfBirth: '1990-05-01', country: 'US', idType: 'national_id', idNumber: 'X1234567', ...overrides };
    let req = agent.post('/api/kyc');
    for (const [k, v] of Object.entries(f)) req = req.field(k, v);
    req = req.attach('docFront', PNG, 'f.png').attach('docBack', PNG, 'b.png').attach('selfie', PNG, 's.png');
    return businessDoc ? req.attach('businessDoc', PNG, 'cr.png') : req;
  }

  async function listing(agent, overrides = {}) {
    const res = await agent.post('/api/listings').send({
      title: 'Looking for a bike', description: 'Any road bike in good condition', category: 'Sports & Outdoors',
      budgetMin: 100, budgetMax: 300, city: 'Austin', ...overrides,
    }).expect(201);
    return res.body.listing;
  }

  return { db, app, admin, user, kyc, listing, request };
}
