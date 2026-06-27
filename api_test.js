/**
 * DisPharma API Test Script
 * Tests all API endpoints: Auth, Stock, Search, Bill
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testUserId = '';
let testStockId = '';
let testBillId = '';
let secondUserId = '';

const results = [];

// ─── Helper Functions ────────────────────────────────────────────────────────

function request(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: { error: err.message } }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function log(testName, status, expected, actual, detail = '') {
  const pass = status === expected;
  const icon = pass ? '✅' : '❌';
  const msg = `${icon} [${testName}] Status: ${actual} (expected ${expected}) ${detail}`;
  console.log(msg);
  results.push({ testName, pass, actual, expected, detail });
}

// ─── Test Functions ───────────────────────────────────────────────────────────

async function testHealthCheck() {
  console.log('\n── Health Check ──────────────────────────────');
  const res = await request('GET', '/api/health');
  log('GET /api/health', res.status, 200, res.status, JSON.stringify(res.body));
}

async function testRegister() {
  console.log('\n── Auth: Register ────────────────────────────');

  // Test 1: Missing fields
  const r1 = await request('POST', '/api/auth/register', { medicalName: 'Test' });
  log('Register - Missing fields', r1.status, 400, r1.status, r1.body.message);

  // Test 2: Invalid phone
  const r2 = await request('POST', '/api/auth/register', {
    medicalName: 'Test Medical', ownerName: 'Owner', email: 'test@mail.com',
    phone: '123', licenseNo: 'LIC123', address: '123 Street', pincode: '600001', password: 'pass123'
  });
  log('Register - Invalid phone', r2.status, 400, r2.status, r2.body.message);

  // Test 3: Short password
  const r3 = await request('POST', '/api/auth/register', {
    medicalName: 'Test Medical', ownerName: 'Owner', email: 'test@mail.com',
    phone: '9876543210', licenseNo: 'LIC123', address: '123 Street', pincode: '600001', password: '123'
  });
  log('Register - Short password', r3.status, 400, r3.status, r3.body.message);

  // Test 4: Successful registration
  const uniquePhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
  const uniqueEmail = `test_${Date.now()}@dispharma.com`;
  const r4 = await request('POST', '/api/auth/register', {
    medicalName: 'Test Medical Store',
    ownerName: 'Jana Test',
    email: uniqueEmail,
    phone: uniquePhone,
    licenseNo: 'LIC-TEST-001',
    address: '123, Anna Nagar, Chennai',
    pincode: '600040',
    location: { type: 'Point', coordinates: [80.2357, 13.0827] },
    password: 'test@123',
  });
  log('Register - Request Success', r4.status, 201, r4.status, r4.body.message);

  // Test 4b: Verify OTP
  const r4b = await request('POST', '/api/auth/verify-registration-otp', {
    email: uniqueEmail,
    otp: '999999'
  });
  log('Register - Verify OTP Success', r4b.status, 200, r4b.status, r4b.body.medicalName || r4b.body.message);
  if (r4b.status === 200) {
    authToken = r4b.body.token;
    testUserId = r4b.body._id;
    console.log(`   ✦ Token received. UserId: ${testUserId}`);
  }

  // Test 5: Duplicate phone
  const r5 = await request('POST', '/api/auth/register', {
    medicalName: 'Duplicate Medical', ownerName: 'Owner2', email: `dup_${Date.now()}@test.com`,
    phone: uniquePhone, licenseNo: 'LIC999', address: 'Address', pincode: '600001', password: 'pass123'
  });
  log('Register - Duplicate phone', r5.status, 400, r5.status, r5.body.message);
}

async function testLogin() {
  console.log('\n── Auth: Login ───────────────────────────────');

  // Test 1: Missing creds
  const r1 = await request('POST', '/api/auth/login', { identifier: '' });
  log('Login - Missing fields', r1.status, 400, r1.status, r1.body.message);

  // Test 2: Wrong credentials
  const r2 = await request('POST', '/api/auth/login', { identifier: 'wrong@email.com', password: 'wrongpass' });
  log('Login - Wrong credentials', r2.status, 401, r2.status, r2.body.message);

  // Test 3: Valid login - re-register to get fresh account with known creds
  const phoneLogin = '97' + Math.floor(10000000 + Math.random() * 90000000);
  const emailLogin = `login_${Date.now()}@dispharma.com`;
  await request('POST', '/api/auth/register', {
    medicalName: 'Login Medical', ownerName: 'Login Owner', email: emailLogin,
    phone: phoneLogin, licenseNo: 'LIC-LOGIN', address: 'Login Address', pincode: '600041',
    location: { type: 'Point', coordinates: [80.24, 13.09] }, password: 'loginpass'
  });
  // Verify user before login
  await request('POST', '/api/auth/verify-registration-otp', {
    email: emailLogin,
    otp: '999999'
  });
  const r3 = await request('POST', '/api/auth/login', { identifier: emailLogin, password: 'loginpass' });
  log('Login - Success (by email)', r3.status, 200, r3.status, r3.body.medicalName || r3.body.message);
  if (r3.status === 200) secondUserId = r3.body._id;

  // Login by phone
  const r4 = await request('POST', '/api/auth/login', { identifier: phoneLogin, password: 'loginpass' });
  log('Login - Success (by phone)', r4.status, 200, r4.status, r4.body.medicalName || r4.body.message);
}

async function testGetMe() {
  console.log('\n── Auth: Get Me ──────────────────────────────');

  // No token
  const r1 = await request('GET', '/api/auth/me');
  log('GET /me - No token', r1.status, 401, r1.status, r1.body.message);

  // With valid token
  const r2 = await request('GET', '/api/auth/me', null, authToken);
  log('GET /me - Valid token', r2.status, 200, r2.status, r2.body.medicalName || r2.body.message);
}

async function testForgotPassword() {
  console.log('\n── Auth: Forgot Password ─────────────────────');

  // No email
  const r1 = await request('POST', '/api/auth/forgot-password', {});
  log('Forgot Password - No email', r1.status, 400, r1.status, r1.body.message);

  // Non-existent email (should return 200 for security)
  const r2 = await request('POST', '/api/auth/forgot-password', { email: 'doesnotexist@xyz.com' });
  log('Forgot Password - Unknown email (security)', r2.status, 200, r2.status, r2.body.message);
}

async function testStockRoutes() {
  console.log('\n── Stock: All Routes ─────────────────────────');

  if (!authToken) { console.log('   ⚠️  No auth token, skipping stock tests'); return; }

  // GET /api/stock/my
  const r1 = await request('GET', '/api/stock/my', null, authToken);
  log('GET /stock/my - Auth user stock', r1.status, 200, r1.status, `Count: ${Array.isArray(r1.body) ? r1.body.length : r1.body.message}`);

  // GET /api/stock/low
  const r2 = await request('GET', '/api/stock/low', null, authToken);
  log('GET /stock/low - Low stock items', r2.status, 200, r2.status, `Count: ${Array.isArray(r2.body) ? r2.body.length : r2.body.message}`);

  // POST /api/stock/add - Missing fields
  const r3 = await request('POST', '/api/stock/add', { medicineName: 'Paracetamol' }, authToken);
  log('POST /stock/add - Missing fields', r3.status, 400, r3.status, r3.body.message);

  // POST /api/stock/add - Negative values
  const r4 = await request('POST', '/api/stock/add', {
    medicineId: '000000000000000000000001', medicineName: 'Paracetamol',
    quantity: -5, buyPrice: 10, sellPrice: 12
  }, authToken);
  log('POST /stock/add - Negative qty', r4.status, 400, r4.status, r4.body.message);

  // POST /api/stock/add - Success
  const r5 = await request('POST', '/api/stock/add', {
    medicineId: '000000000000000000000001',
    medicineName: 'Paracetamol 500mg',
    quantity: 100,
    buyPrice: 8.5,
    sellPrice: 12.0,
  }, authToken);
  log('POST /stock/add - Success', r5.status, 201, r5.status, r5.body.medicineName || r5.body.message);
  if (r5.status === 201) testStockId = r5.body._id;

  // POST /api/stock/add - Duplicate medicine
  const r6 = await request('POST', '/api/stock/add', {
    medicineId: '000000000000000000000001', medicineName: 'Paracetamol 500mg',
    quantity: 50, buyPrice: 8.5, sellPrice: 12.0,
  }, authToken);
  log('POST /stock/add - Duplicate', r6.status, 400, r6.status, r6.body.message);

  // PUT /api/stock/:id - Update
  if (testStockId) {
    const r7 = await request('PUT', `/api/stock/${testStockId}`, { quantity: 50, sellPrice: 15 }, authToken);
    log('PUT /stock/:id - Update qty & price', r7.status, 200, r7.status, `Qty: ${r7.body.quantity}, Price: ${r7.body.sellPrice}`);

    // PUT - negative value
    const r8 = await request('PUT', `/api/stock/${testStockId}`, { quantity: -1 }, authToken);
    log('PUT /stock/:id - Negative qty', r8.status, 400, r8.status, r8.body.message);
  }

  // DELETE /api/stock/:id (after all tests on it)
  if (testStockId) {
    const r9 = await request('DELETE', `/api/stock/${testStockId}`, null, authToken);
    log('DELETE /stock/:id - Delete stock', r9.status, 200, r9.status, r9.body.message);
  }

  // Without token
  const r10 = await request('GET', '/api/stock/my');
  log('GET /stock/my - No token', r10.status, 401, r10.status, r10.body.message);
}

async function testSearch() {
  console.log('\n── Search: Routes ────────────────────────────');

  if (!authToken) { console.log('   ⚠️  No auth token, skipping search tests'); return; }

  // Search without query param
  const r1 = await request('GET', '/api/search?name=', null, authToken);
  log('GET /search - Empty name', r1.status, 400, r1.status, r1.body.message);

  // Valid search
  const r2 = await request('GET', '/api/search?name=Para', null, authToken);
  log('GET /search - Search "Para"', r2.status, 200, r2.status, `Own: ${r2.body.own?.length}, Nearby: ${r2.body.nearby?.length}`);

  // Explore nearby
  const r3 = await request('GET', '/api/search/explore', null, authToken);
  log('GET /search/explore - Explore nearby', r3.status, 200, r3.status, `Results: ${Array.isArray(r3.body) ? r3.body.length : r3.body.message}`);

  // Without token
  const r4 = await request('GET', '/api/search?name=Para');
  log('GET /search - No token', r4.status, 401, r4.status, r4.body.message);
}

async function testBill() {
  console.log('\n── Bill: Routes ──────────────────────────────');

  if (!authToken) { console.log('   ⚠️  No auth token, skipping bill tests'); return; }

  // GET /api/bill/history - Empty initially
  const r1 = await request('GET', '/api/bill/history', null, authToken);
  log('GET /bill/history - History list', r1.status, 200, r1.status, `Count: ${Array.isArray(r1.body) ? r1.body.length : r1.body.message}`);

  // GET /api/bill/stats
  const r2 = await request('GET', '/api/bill/stats', null, authToken);
  log('GET /bill/stats - Dashboard stats', r2.status, 200, r2.status, JSON.stringify(r2.body));

  // POST /api/bill/generate - Missing fields
  const r3 = await request('POST', '/api/bill/generate', {}, authToken);
  log('POST /bill/generate - Missing fields', r3.status, 400, r3.status, r3.body.message);

  // POST /api/bill/generate - Invalid toMedicalId
  const r4 = await request('POST', '/api/bill/generate', {
    toMedicalId: '000000000000000000000099',
    items: [{ medicineId: 'med1', medicineName: 'Paracetamol', quantity: 10, buyPrice: 10 }]
  }, authToken);
  log('POST /bill/generate - Invalid medical ID', r4.status, 404, r4.status, r4.body.message);

  // POST /api/bill/generate - Success (to another user)
  if (secondUserId) {
    const r5 = await request('POST', '/api/bill/generate', {
      toMedicalId: secondUserId,
      items: [
        { medicineId: '000000000000000000000001', medicineName: 'Paracetamol 500mg', quantity: 10, buyPrice: 8.5 },
        { medicineId: '000000000000000000000002', medicineName: 'Ibuprofen 400mg', quantity: 5, buyPrice: 15 }
      ]
    }, authToken);
    log('POST /bill/generate - Success', r5.status, 201, r5.status, `Margin: ₹${r5.body?.transaction?.totalMargin || r5.body.message}`);
    if (r5.status === 201) testBillId = r5.body.transaction._id;
  }

  // GET /api/bill/pdf/:id - Valid bill
  if (testBillId) {
    const r6 = await new Promise((resolve) => {
      const options = {
        hostname: 'localhost', port: 5000,
        path: `/api/bill/pdf/${testBillId}`, method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` }
      };
      const req = http.request(options, (res) => {
        let data = Buffer.alloc(0);
        res.on('data', (chunk) => { data = Buffer.concat([data, chunk]); });
        res.on('end', () => resolve({ status: res.statusCode, contentType: res.headers['content-type'], size: data.length }));
      });
      req.on('error', (err) => resolve({ status: 0, error: err.message }));
      req.end();
    });
    log('GET /bill/pdf/:id - PDF download', r6.status, 200, r6.status, `Content-Type: ${r6.contentType}, Size: ${r6.size} bytes`);
  }

  // Invalid PDF ID
  const r7 = await request('GET', '/api/bill/pdf/000000000000000000000099', null, authToken);
  log('GET /bill/pdf/:id - Invalid ID', r7.status, 404, r7.status, r7.body.message);
}

async function test404() {
  console.log('\n── 404 Handler ───────────────────────────────');
  const r1 = await request('GET', '/api/nonexistent-route');
  log('GET /api/nonexistent-route - 404', r1.status, 404, r1.status, r1.body.message);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║      DisPharma API Full Test Suite           ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`Testing: ${BASE_URL}\n`);

  await testHealthCheck();
  await testRegister();
  await testLogin();
  await testGetMe();
  await testForgotPassword();
  await testStockRoutes();
  await testSearch();
  await testBill();
  await test404();

  // Summary
  console.log('\n══════════════════════════════════════════════');
  console.log('                   SUMMARY');
  console.log('══════════════════════════════════════════════');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${results.length}`);
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`   - [${r.testName}] Expected ${r.expected}, Got ${r.actual} | ${r.detail}`);
    });
  }
  console.log('══════════════════════════════════════════════');
}

runAllTests().catch(console.error);
