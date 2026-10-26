const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api';

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting iMovies Automated End-to-End Test Suite');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.response?.data?.message || err.message);
      failed++;
    }
  };

  let userToken = '';
  let adminToken = '';
  let testMovieId = '';
  let testShowId = '';
  let lockedSeats = ['A1', 'A2'];
  let bookingId = '';

  // 1. Health check
  await test('GET /health - Server healthcheck', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.data.status !== 'ok') throw new Error('Status not ok');
  });

  // 2. Admin login
  await test('POST /auth/login - Admin authentication', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@imovies.com',
      password: 'AdminPassword@123'
    });
    if (!res.data.token || res.data.user.role !== 'admin') throw new Error('Admin auth failed');
    adminToken = res.data.token;
  });

  // 3. Demo user login
  await test('POST /auth/login - User authentication', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@imovies.com',
      password: 'UserPassword@123'
    });
    if (!res.data.token || res.data.user.role !== 'user') throw new Error('User auth failed');
    userToken = res.data.token;
  });

  // 4. User Registration (Unique user)
  await test('POST /auth/register - New user registration', async () => {
    const randomEmail = `testuser_${Date.now()}@test.com`;
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'Test Cinema Guy',
      email: randomEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      phone: '+91 99988 77766'
    });
    if (!res.data.token) throw new Error('Registration did not return token');
  });

  // 5. Get Movies Catalog
  await test('GET /movies - Fetch movie list', async () => {
    const res = await axios.get(`${BASE_URL}/movies`);
    if (!res.data.movies || res.data.movies.length === 0) throw new Error('No movies returned');
    testMovieId = res.data.movies[0]._id;
  });

  // 6. Get Single Movie
  await test('GET /movies/:id - Fetch movie details', async () => {
    const res = await axios.get(`${BASE_URL}/movies/${testMovieId}`);
    if (res.data.movie._id !== testMovieId) throw new Error('Wrong movie returned');
  });

  // 7. Get Theatres
  await test('GET /theatres - Fetch cinema theatres', async () => {
    const res = await axios.get(`${BASE_URL}/theatres`);
    if (!res.data.theatres || res.data.theatres.length === 0) throw new Error('No theatres returned');
  });

  // 8. Get All Shows
  await test('GET /shows - Fetch scheduled shows', async () => {
    const res = await axios.get(`${BASE_URL}/shows`);
    if (!res.data.shows || res.data.shows.length === 0) throw new Error('No shows returned');
    // Pick a future show (e.g. tomorrow or later) for valid booking and cancellation testing
    const todayStr = new Date().toISOString().split('T')[0];
    const futureShow = res.data.shows.find((s) => s.showDate > todayStr) || res.data.shows[res.data.shows.length - 1];
    testShowId = futureShow._id;
    testMovieId = futureShow.movie._id || futureShow.movie;
  });

  // 9. Get Single Show with Seating Grid
  await test('GET /shows/:id - Fetch show with seat matrix', async () => {
    const res = await axios.get(`${BASE_URL}/shows/${testShowId}`);
    if (!res.data.show.seats || res.data.show.seats.length === 0) throw new Error('Seats not populated');
  });

  // 10. Lock Seats
  await test('POST /bookings/lock-seats - Lock seats atomically', async () => {
    const res = await axios.post(
      `${BASE_URL}/bookings/lock-seats`,
      {
        showId: testShowId,
        seatNumbers: lockedSeats
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    if (!res.data.success || res.data.pricing.ticketCount !== 2) throw new Error('Lock seats failed');
  });

  // 11. Prevent Double-Locking
  await test('POST /bookings/lock-seats - Prevent double booking by another user', async () => {
    try {
      await axios.post(
        `${BASE_URL}/bookings/lock-seats`,
        {
          showId: testShowId,
          seatNumbers: lockedSeats
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      throw new Error('Should have rejected lock on already locked seats');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Expected conflict!
        return;
      }
      throw err;
    }
  });

  // 12. Create Payment Order
  await test('POST /payment/create-order - Generate payment order', async () => {
    const res = await axios.post(
      `${BASE_URL}/payment/create-order`,
      { amount: 500 },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    if (!res.data.orderId) throw new Error('No orderId returned');
  });

  // 13. Confirm Booking with Mock Payment
  await test('POST /bookings - Confirm booking & generate QR ticket', async () => {
    const res = await axios.post(
      `${BASE_URL}/bookings`,
      {
        showId: testShowId,
        seatNumbers: lockedSeats,
        paymentMethod: 'mock',
        paymentDetails: { mockRef: `TXN-${Date.now()}` }
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    if (!res.data.booking || !res.data.booking.bookingId) throw new Error('Booking creation failed');
    bookingId = res.data.booking._id;
  });

  // 14. Get User Bookings
  await test('GET /bookings/my-bookings - Retrieve booking history', async () => {
    const res = await axios.get(`${BASE_URL}/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (!res.data.bookings || res.data.bookings.length === 0) throw new Error('Bookings history empty');
  });

  // 15. Admin Dashboard Stats
  await test('GET /admin/stats - Admin analytics and revenue', async () => {
    const res = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.stats || res.data.stats.totalBookings === 0) throw new Error('Admin stats failed');
  });

  // 16. Cancel Booking & Verify Seat Release
  await test('PATCH /bookings/:id/cancel - Cancellation and seat release', async () => {
    const res = await axios.patch(
      `${BASE_URL}/bookings/${bookingId}/cancel`,
      { reason: 'User test cancel' },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    if (res.data.booking.bookingStatus !== 'cancelled') throw new Error('Status not cancelled');

    // Verify seats in show are available again
    const showRes = await axios.get(`${BASE_URL}/shows/${testShowId}`);
    const seatA1 = showRes.data.show.seats.find((s) => s.seatNumber === 'A1');
    if (seatA1.status !== 'available') throw new Error('Seat was not released back to available');
  });

  console.log('====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
