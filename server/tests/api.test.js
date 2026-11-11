const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const { User } = require('../models/User');
const { Restaurant } = require('../models/Restaurant');
const { Review } = require('../models/Review');
const { seedDatabase } = require('../scripts/seed');
const { setTestMailSink } = require('../services/emailService');

let mongod;
const sentEmails = [];

const extractCookies = (res) => {
  const raw = res.headers['set-cookie'] || [];
  const cookieMap = {};
  for (const entry of raw) {
    const [pair] = entry.split(';');
    const eqIndex = pair.indexOf('=');
    if (eqIndex > -1) {
      const key = pair.slice(0, eqIndex).trim();
      const val = pair.slice(eqIndex + 1).trim();
      cookieMap[key] = val;
    }
  }
  const cookieHeader = Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return { cookieMap, cookieHeader };
};

const loginAgent = async (email, password) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  assert.equal(res.status, 200, `Login failed for ${email}: ${res.text}`);
  assert.equal(res.body.user.password, undefined, 'Password must never be exposed');
  const { cookieMap, cookieHeader } = extractCookies(res);
  return {
    user: res.body.user,
    cookieHeader,
    csrfToken: res.body.csrfToken || cookieMap['XSRF-TOKEN'],
  };
};

describe('Restaurant Rating & Review Platform API Integration Tests', () => {
  before(async () => {
    setTestMailSink(sentEmails);
    mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 60000,
      },
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    await Promise.all([
      User.syncIndexes(),
      Restaurant.syncIndexes(),
      Review.syncIndexes(),
    ]);
  });

  after(async () => {
    setTestMailSink(null);
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  });

  it('seeds database idempotently without creating duplicates', async () => {
    const first = await seedDatabase();
    assert.equal(first.usersCount, 11);
    assert.equal(first.restaurantsCount, 12);
    assert.ok(first.newReviewsCount > 0);

    const second = await seedDatabase();
    assert.equal(second.newReviewsCount, 0);

    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    assert.equal(totalUsers, 11);
    assert.equal(totalRestaurants, 12);
  });

  it('enforces registration password rules, email OTP verification, email uniqueness, and password exclusion', async () => {
    const weakRes = await request(app).post('/api/auth/register').send({
      name: 'Weak Pass',
      email: 'weak@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    assert.equal(weakRes.status, 400);

    const mismatchRes = await request(app).post('/api/auth/register').send({
      name: 'Mismatch',
      email: 'mismatch@example.com',
      password: 'Valid@1234',
      confirmPassword: 'Other@1234',
    });
    assert.equal(mismatchRes.status, 400);

    sentEmails.length = 0;

    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Clara Dawson',
      email: 'clara@example.com',
      password: 'Valid@1234',
      confirmPassword: 'Valid@1234',
      role: 'ADMIN', // Attempted role escalation must be ignored
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.requiresVerification, true);
    assert.equal(regRes.body.email, 'clara@example.com');
    assert.equal(regRes.body.expiresInMinutes, 10);
    assert.equal(regRes.body.user, undefined);
    assert.equal(regRes.headers['set-cookie'], undefined);

    const dbUser = await User.findOne({ email: 'clara@example.com' }).select(
      '+password +emailOtpHash +emailOtpExpiresAt'
    );
    assert.equal(dbUser.role, 'CUSTOMER');
    assert.equal(dbUser.isEmailVerified, false);
    assert.ok(dbUser.password.startsWith('$2'));
    assert.ok(dbUser.emailOtpHash);
    assert.ok(dbUser.emailOtpExpiresAt > new Date());

    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].to, 'clara@example.com');
    const otpMatch = sentEmails[0].text.match(/OTP:\s*(\d{6})/);
    assert.ok(otpMatch, 'Verification email must contain a 6-digit OTP');
    const extractedOtp = otpMatch[1];

    // Unverified login must be blocked until OTP is confirmed
    const blockedLoginRes = await request(app).post('/api/auth/login').send({
      email: 'clara@example.com',
      password: 'Valid@1234',
    });
    assert.equal(blockedLoginRes.status, 403);
    assert.equal(blockedLoginRes.body.requiresVerification, true);

    // Resend OTP cooldown must block rapid immediate retries
    const cooldownRes = await request(app)
      .post('/api/auth/resend-otp')
      .send({ email: 'clara@example.com' });
    assert.equal(cooldownRes.status, 429);
    assert.ok(cooldownRes.body.retryAfterSeconds > 0);

    // Wrong OTP must fail with 400
    const wrongOtp = extractedOtp === '000000' ? '111111' : '000000';
    const wrongOtpRes = await request(app).post('/api/auth/verify-otp').send({
      email: 'clara@example.com',
      otp: wrongOtp,
    });
    assert.equal(wrongOtpRes.status, 400);

    // Valid OTP verifies account, sets cookies, and sends confirmation email once
    const verifyRes = await request(app).post('/api/auth/verify-otp').send({
      email: 'clara@example.com',
      otp: extractedOtp,
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.user.role, 'CUSTOMER');
    assert.equal(verifyRes.body.user.isEmailVerified, true);
    assert.equal(verifyRes.body.user.password, undefined);
    assert.ok(verifyRes.headers['set-cookie'], 'Auth cookies should be issued after OTP verification');

    const verifiedUser = await User.findOne({ email: 'clara@example.com' });
    assert.equal(verifiedUser.isEmailVerified, true);

    assert.equal(sentEmails.length, 2);
    assert.equal(sentEmails[1].to, 'clara@example.com');
    assert.ok(sentEmails[1].subject.includes('Successfully logged into Atithi'));

    const dupRes = await request(app).post('/api/auth/register').send({
      name: 'Clara Clone',
      email: 'clara@example.com',
      password: 'Valid@1234',
      confirmPassword: 'Valid@1234',
    });
    assert.equal(dupRes.status, 409);

    const reverifyRes = await request(app).post('/api/auth/verify-otp').send({
      email: 'clara@example.com',
      otp: extractedOtp,
    });
    assert.equal(reverifyRes.status, 400);
  });

  it('validates search, location filter, cuisine filter, and unreviewed restaurants', async () => {
    const searchRes = await request(app).get('/api/restaurants?search=Deccan');
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.restaurants.length, 1);
    assert.equal(searchRes.body.restaurants[0].name, 'Deccan Nizami Kitchen');

    const locRes = await request(app).get(
      `/api/restaurants?location=${encodeURIComponent('Jubilee Hills, Hyderabad')}`
    );
    assert.equal(locRes.status, 200);
    assert.ok(locRes.body.restaurants.length >= 2);
    assert.ok(
      locRes.body.restaurants.every((r) => r.location === 'Jubilee Hills, Hyderabad')
    );

    const cuisineRes = await request(app).get('/api/restaurants?cuisine=Hyderabadi');
    assert.equal(cuisineRes.status, 200);
    assert.ok(cuisineRes.body.restaurants.length >= 2);
    assert.ok(
      cuisineRes.body.restaurants.every((r) => r.cuisine.includes('Hyderabadi'))
    );

    // Unreviewed restaurant must return averageRating: null and full 5..1 zero-count distribution
    const marigold = await Restaurant.findOne({ name: 'Marigold Botanical Cafe' });
    const detailRes = await request(app).get(`/api/restaurants/${marigold._id}`);
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.restaurant.averageRating, null);
    assert.equal(detailRes.body.restaurant.totalReviews, 0);
    assert.equal(detailRes.body.restaurant.ratingDistribution.length, 5);
    assert.ok(
      detailRes.body.restaurant.ratingDistribution.every((d) => d.count === 0)
    );
  });

  it('enforces CSRF protection, duplicate review prevention, ownership isolation, and live rating aggregation', async () => {
    const customerA = await loginAgent('clara@example.com', 'Valid@1234');
    const customerB = await loginAgent('customer1@atithi.com', 'Customer@1234');
    const marigold = await Restaurant.findOne({ name: 'Marigold Botanical Cafe' });

    // Missing CSRF header must be blocked on cookie-authenticated POST
    const noCsrfRes = await request(app)
      .post('/api/reviews')
      .set('Cookie', customerA.cookieHeader)
      .send({
        restaurant: marigold._id.toString(),
        rating: 5,
        comment: 'Fresh grain bowls!',
      });
    assert.equal(noCsrfRes.status, 403);

    // Invalid decimal rating must return 400
    const badRatingRes = await request(app)
      .post('/api/reviews')
      .set('Cookie', customerA.cookieHeader)
      .set('X-CSRF-Token', customerA.csrfToken)
      .send({
        restaurant: marigold._id.toString(),
        rating: 4.5,
        comment: 'Half star test',
      });
    assert.equal(badRatingRes.status, 400);

    // Valid review creation
    const createRes = await request(app)
      .post('/api/reviews')
      .set('Cookie', customerA.cookieHeader)
      .set('X-CSRF-Token', customerA.csrfToken)
      .send({
        restaurant: marigold._id.toString(),
        rating: 5,
        comment: 'Vibrant botanical menu and warm coffee.',
      });
    assert.equal(createRes.status, 201);
    const reviewId = createRes.body.review._id;
    assert.equal(createRes.body.ratingStats.averageRating, 5);
    assert.equal(createRes.body.ratingStats.totalReviews, 1);

    // Duplicate review attempt by same customer -> 409 Conflict
    const dupReviewRes = await request(app)
      .post('/api/reviews')
      .set('Cookie', customerA.cookieHeader)
      .set('X-CSRF-Token', customerA.csrfToken)
      .send({
        restaurant: marigold._id.toString(),
        rating: 3,
        comment: 'Trying a second review',
      });
    assert.equal(dupReviewRes.status, 409);

    // Database-level compound unique index verification
    await assert.rejects(
      () =>
        Review.create({
          customer: customerA.user._id,
          restaurant: marigold._id,
          rating: 4,
          comment: 'Direct DB duplicate attempt',
        }),
      (err) => err.code === 11000
    );

    // Customer A's myRating appears in restaurant listing
    const listRes = await request(app)
      .get('/api/restaurants?search=Marigold')
      .set('Cookie', customerA.cookieHeader);
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.restaurants[0].myRating, 5);

    // Customer B cannot edit or delete Customer A's review
    const otherEditRes = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Cookie', customerB.cookieHeader)
      .set('X-CSRF-Token', customerB.csrfToken)
      .send({ rating: 1, comment: 'Tampered comment' });
    assert.equal(otherEditRes.status, 403);

    const otherDelRes = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Cookie', customerB.cookieHeader)
      .set('X-CSRF-Token', customerB.csrfToken);
    assert.equal(otherDelRes.status, 403);

    // Customer A updates own review -> rating immediately recalculates
    const updateRes = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Cookie', customerA.cookieHeader)
      .set('X-CSRF-Token', customerA.csrfToken)
      .send({ rating: 4, comment: 'Updated to 4 stars after second visit.' });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.ratingStats.averageRating, 4);

    // Customer A deletes own review -> returns to null / 0 reviews
    const deleteRes = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Cookie', customerA.cookieHeader)
      .set('X-CSRF-Token', customerA.csrfToken);
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.ratingStats.averageRating, null);
    assert.equal(deleteRes.body.ratingStats.totalReviews, 0);
  });

  it('enforces restaurant owner boundaries and permissions', async () => {
    const owner = await loginAgent('owner1@atithi.com', 'Owner@1234');
    const customer = await loginAgent('customer1@atithi.com', 'Customer@1234');

    // Customer blocked from owner endpoints
    const custOwnerRes = await request(app)
      .get('/api/owner/dashboard')
      .set('Cookie', customer.cookieHeader);
    assert.equal(custOwnerRes.status, 403);

    // Owner dashboard & restaurant retrieval
    const dashRes = await request(app)
      .get('/api/owner/dashboard')
      .set('Cookie', owner.cookieHeader);
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.restaurant.name, 'Deccan Nizami Kitchen');
    assert.ok(dashRes.body.stats.ratingCounts[5] >= 1);

    // Owner cannot modify ownership or role or activation status
    const hijackRes = await request(app)
      .put('/api/owner/restaurant')
      .set('Cookie', owner.cookieHeader)
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ owner: customer.user._id });
    assert.equal(hijackRes.status, 403);

    // Owner can update permitted details
    const validUpdateRes = await request(app)
      .put('/api/owner/restaurant')
      .set('Cookie', owner.cookieHeader)
      .set('X-CSRF-Token', owner.csrfToken)
      .send({ phone: '+91 40 2335 0999' });
    assert.equal(validUpdateRes.status, 200);
    assert.equal(validUpdateRes.body.restaurant.phone, '+91 40 2335 0999');

    // Owner cannot access admin endpoints or submit/delete reviews
    const adminCheck = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', owner.cookieHeader);
    assert.equal(adminCheck.status, 403);

    const anyReview = await Review.findOne();
    const ownerDelRev = await request(app)
      .delete(`/api/reviews/${anyReview._id}`)
      .set('Cookie', owner.cookieHeader)
      .set('X-CSRF-Token', owner.csrfToken);
    assert.equal(ownerDelRev.status, 403);
  });

  it('enforces administrator operations: KPIs, user activation, restaurant creation, owner creation/assignment, and review moderation', async () => {
    const admin = await loginAgent('admin@atithi.com', 'Admin@1234');

    const dashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Cookie', admin.cookieHeader);
    assert.equal(dashRes.status, 200);
    assert.ok(dashRes.body.kpis.totalUsers >= 11);
    assert.ok(dashRes.body.kpis.totalRestaurants >= 12);
    assert.equal(dashRes.body.ratingDistribution.length, 5);

    // Create restaurant as admin
    const newRestRes = await request(app)
      .post('/api/restaurants')
      .set('Cookie', admin.cookieHeader)
      .set('X-CSRF-Token', admin.csrfToken)
      .send({
        name: 'Telangana Spice Courtyard',
        description: 'Authentic regional Telangana dishes with stone-ground spices and wood-fired rotis.',
        location: 'Somajiguda, Hyderabad',
        address: 'Raj Bhavan Road, Somajiguda, Hyderabad, Telangana 500082',
        cuisine: ['Telangana', 'South Indian'],
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
        phone: '+91 40 2331 0144',
        priceRange: '$$',
      });
    assert.equal(newRestRes.status, 201);
    const createdRestId = newRestRes.body.restaurant._id;

    // Create owner and assign restaurant
    const newOwnerRes = await request(app)
      .post('/api/admin/owners')
      .set('Cookie', admin.cookieHeader)
      .set('X-CSRF-Token', admin.csrfToken)
      .send({
        name: 'Diego Morales',
        email: 'diego.owner@atithi.com',
        password: 'Owner@1234',
        restaurantId: createdRestId,
      });
    assert.equal(newOwnerRes.status, 201);
    assert.equal(newOwnerRes.body.owner.password, undefined);
    assert.equal(newOwnerRes.body.owner.assignedRestaurant._id, createdRestId);

    // Deactivate customer & verify deactivated user cannot log in
    const targetCustomer = await User.findOne({ email: 'clara@example.com' });
    const statusRes = await request(app)
      .put(`/api/admin/users/${targetCustomer._id}/status`)
      .set('Cookie', admin.cookieHeader)
      .set('X-CSRF-Token', admin.csrfToken)
      .send({ isActive: false });
    assert.equal(statusRes.status, 200);

    const blockedLogin = await request(app).post('/api/auth/login').send({
      email: 'clara@example.com',
      password: 'Valid@1234',
    });
    assert.equal(blockedLogin.status, 403);

    // Admin removes a review
    const reviewToMod = await Review.findOne();
    const modRes = await request(app)
      .delete(`/api/admin/reviews/${reviewToMod._id}`)
      .set('Cookie', admin.cookieHeader)
      .set('X-CSRF-Token', admin.csrfToken);
    assert.equal(modRes.status, 200);
  });
});
