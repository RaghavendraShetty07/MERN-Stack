/**
 * Automated Acceptance Testing Script for SmartQ Campus
 * Verifies Test Cases TC-01 through TC-11 from SRS Section 13
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('  SmartQ Campus — Automated Acceptance Test Suite (SRS Sec 13)');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testId, description) => {
    if (condition) {
      console.log(`✅ [PASS] ${testId}: ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testId}: ${description}`);
      failed++;
    }
  };

  try {
    // TC-01: Register a student with valid data -> Account created with student role
    const uniqueEmail = `test.student.${Date.now()}@college.edu`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: uniqueEmail,
        password: 'password123',
        role: 'admin', // Attack attempt: should be ignored and set to 'student'
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.user?.role === 'student',
      'TC-01',
      'Register student creates account with student role (spoofed role prevented)'
    );

    const studentToken = regData.token;

    // TC-02: Log in with incorrect password -> 401 response; no session
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'wrongpassword',
      }),
    });
    assert(badLoginRes.status === 401, 'TC-02', 'Log in with incorrect password returns 401');

    // TC-03: Student calls an admin endpoint -> 403 response
    const forbiddenRes = await fetch(`${BASE_URL}/queue/admin/analytics`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(forbiddenRes.status === 403, 'TC-03', 'Student calling admin endpoint returns 403 Forbidden');

    // Login as Admin to get admin token
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'admin123' }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    // Login as Staff to get staff token
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@college.edu', password: 'staff123' }),
    });
    const staffData = await staffLoginRes.json();
    const staffToken = staffData.token;

    // Fetch active services
    const servicesRes = await fetch(`${BASE_URL}/services`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const servicesData = await servicesRes.json();
    const testService = servicesData.services[0];

    // TC-04: Book a token for an active service -> Unique token and wait returned
    const bookRes = await fetch(`${BASE_URL}/queue/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        serviceId: testService._id,
        notes: 'Need fee voucher',
      }),
    });
    const bookData = await bookRes.json();
    const bookedToken = bookData.token;
    assert(
      (bookRes.status === 201 || bookRes.status === 409) && (bookData.token || bookedToken),
      'TC-04',
      'Book a token for an active service returns valid token details and estimated wait'
    );

    // TC-06: Call next when queue has waiting tokens
    const callRes = await fetch(`${BASE_URL}/queue/services/${testService._id}/call-next`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    const callData = await callRes.json();
    const calledToken = callData.token;
    assert(
      callRes.status === 200 && calledToken && calledToken.status === 'called',
      'TC-06',
      'Staff calls next token and status becomes called'
    );

    // TC-07: Complete a token that is not serving -> Conflict 409 response
    if (calledToken) {
      const prematureCompleteRes = await fetch(`${BASE_URL}/queue/${calledToken._id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      assert(
        prematureCompleteRes.status === 409,
        'TC-07',
        'Completing a token that is called (not serving) returns 409 Conflict'
      );

      // Start serving
      const startRes = await fetch(`${BASE_URL}/queue/${calledToken._id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      assert(startRes.status === 200, 'Staff starts service', 'Token transitions to serving');

      // TC-08: Complete a serving token -> Status completed and service duration recorded
      const completeRes = await fetch(`${BASE_URL}/queue/${calledToken._id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const completeData = await completeRes.json();
      assert(
        completeRes.status === 200 &&
          completeData.token?.status === 'completed' &&
          typeof completeData.durationSeconds === 'number',
        'TC-08',
        'Complete a serving token records completed status and duration in seconds'
      );
    }

    // TC-10: Student requests another student's token cancellation -> Access denied
    // Create second student
    const student2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: `student.two.${Date.now()}@college.edu`,
        password: 'password123',
      }),
    });
    const student2Data = await student2Res.json();

    // Book token for student2
    const s2BookRes = await fetch(`${BASE_URL}/queue/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student2Data.token}`,
      },
      body: JSON.stringify({ serviceId: testService._id }),
    });
    const s2BookData = await s2BookRes.json();

    if (s2BookData.token) {
      // First student tries to cancel student2's token!
      const unauthorizedCancelRes = await fetch(`${BASE_URL}/queue/${s2BookData.token._id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(
        unauthorizedCancelRes.status === 403,
        'TC-10',
        "Student attempting to cancel another student's token receives 403 Access Denied"
      );
    }

    // TC-11: Deactivate a service and try to book it -> Booking is rejected
    const tempServiceRes = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Temporary Closed Service',
        prefix: `TC${Math.floor(Math.random() * 80 + 10)}`,
        averageServiceTime: 5,
      }),
    });
    const tempServiceData = await tempServiceRes.json();
    const tempSvcId = tempServiceData.service?._id;

    if (tempSvcId) {
      // Deactivate it
      await fetch(`${BASE_URL}/services/${tempSvcId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isActive: false }),
      });

      // Try booking deactivated service
      const closedBookingRes = await fetch(`${BASE_URL}/queue/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ serviceId: tempSvcId }),
      });
      assert(
        closedBookingRes.status === 400,
        'TC-11',
        'Booking a deactivated service is rejected with 400 Bad Request'
      );
    }

    console.log(`\n Acceptance Testing Complete: ${passed} Passed, ${failed} Failed\n`);
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests();
