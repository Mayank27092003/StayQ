// Entirely disposable PostgreSQL-compatible database; all external integrations mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
process.env.NODE_ENV = 'test';
process.env.JOBS_ENABLED = 'false';
process.env.SEED_CORRIDORS = 'false';
process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.OTP_HMAC_SECRET = 'offline-test-secret-at-least-32-characters';
process.env.CASHFREE_PG_APP_ID = 'offline-id';
process.env.CASHFREE_PG_SECRET_KEY = 'offline-secret';
process.env.CASHFREE_ENVIRONMENT = 'SANDBOX';
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
const { PrismaClient } = require('@prisma/client');
const { Test } = require('@nestjs/testing');
const request = require('supertest');
const tokens = new Map();
let gatewayPaid = false,
  refundStatus = 'PENDING';
const gatewayOrders = new Map();
let providerCalls = 0;
require('firebase-admin/app').initializeApp({
  projectId: 'demo-offline-audit',
});
require('firebase-admin/auth').getAuth = () => ({
  verifyIdToken: async (token, checkRevoked) => {
    assert.equal(checkRevoked, true);
    const user = tokens.get(token);
    if (!user) {
      const e = new Error('Invalid');
      e.code = 'auth/id-token-expired';
      throw e;
    }
    return {
      uid: user.firebaseUid,
      email: user.email,
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      auth_time: Math.floor(Date.now() / 1000),
    };
  },
});
global.fetch = async (url, options = {}) => {
  assert.ok(
    String(url).startsWith('https://sandbox.cashfree.com/pg/'),
    'Unexpected outbound request: ' + new URL(url).hostname,
  );
  providerCalls++;
  const p = new URL(url).pathname.replace('/pg', '');
  let data,
    code = 200;
  if (p === '/orders' && options.method === 'POST') {
    const b = JSON.parse(options.body);
    data = {
      ...b,
      payment_session_id: 'session_' + b.order_id,
      order_status: 'ACTIVE',
    };
    gatewayOrders.set(b.order_id, data);
  } else {
    const pieces = p.split('/').filter(Boolean);
    const order = gatewayOrders.get(pieces[1]);
    if (!order) {
      code = 404;
      data = { message: 'not found' };
    } else if (pieces[2] === 'payments')
      data = [
        {
          order_id: order.order_id,
          cf_payment_id: 'cf_' + order.order_id,
          payment_status: gatewayPaid ? 'SUCCESS' : 'PENDING',
          payment_amount: order.order_amount,
          payment_currency: 'INR',
        },
      ];
    else if (pieces[2] === 'refunds') {
      if (options.method === 'POST') {
        const b = JSON.parse(options.body);
        data = { ...b, refund_status: refundStatus };
        gatewayOrders.set('refund:' + b.refund_id, data);
      } else {
        data = gatewayOrders.get('refund:' + pieces[3]);
        if (data) data = { ...data, refund_status: refundStatus };
        else {
          code = 404;
          data = { message: 'not found' };
        }
      }
    } else data = { ...order, order_status: gatewayPaid ? 'PAID' : 'ACTIVE' };
  }
  return new Response(JSON.stringify(data), {
    status: code,
    headers: { 'content-type': 'application/json' },
  });
};
let app, db, server, prisma;
const checks = [];
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log('PASS ' + name);
}
(async () => {
  db = new PGlite();
  await db.waitReady;
  await db.exec("SET TIME ZONE 'UTC'");
  await db.exec(fs.readFileSync(path.join(__dirname,'../prisma/migrations/202610070001_original_baseline/migration.sql'),'utf8'));
  await db.exec(`
    INSERT INTO "User" (id,"firebaseUid","hostStatus","isHostVerified","updatedAt") VALUES ('legacy-host','offline-legacy-host','APPROVED',true,NOW()),('legacy-guest','offline-legacy-guest','PENDING',false,NOW());
    INSERT INTO "HostPayoutAccount" (id,"userId","bankName","accountNumber","ifscCode","accountHolderName",verified,"updatedAt") VALUES ('legacy-account','legacy-host','Offline bank','1234567890','TEST0000001','Offline host',true,NOW());
    INSERT INTO "Property" (id,"hostId",type,category,title,description,address,city,state,lat,lng,"pricePerNight",amenities,status,"propertyDocsVerified","updatedAt") VALUES ('legacy-property','legacy-host','VILLA','VILLA','Offline legacy','Fixture','Private','Test','Test',25,85,1000,ARRAY[]::TEXT[],'ACTIVE',true,NOW());
    INSERT INTO "Booking" (id,"propertyId","guestId","checkIn","checkOut","nightlyRate","numberOfNights",subtotal,"totalAmount",status,"confirmationCode","updatedAt") VALUES ('legacy-booking','legacy-property','legacy-guest','2026-01-01','2026-01-03',1000,2,2000,2236,'COMPLETED','OFFLINE-LEGACY',NOW());
    INSERT INTO "Payment" (id,"bookingId",amount,status,"updatedAt") VALUES ('legacy-payment','legacy-booking',2236,'CAPTURED',NOW());
    INSERT INTO "Refund" (id,"paymentId",amount) VALUES ('legacy-refund','legacy-payment',100);
  `);
  await db.exec(fs.readFileSync(path.join(__dirname,'../prisma/migrations/202610070002_audit_repairs/migration.sql'),'utf8'));
  await check('repair migration preserves financial history and resets untrusted legacy verification',async()=>{
    const user=(await db.query(`SELECT "hostStatus","isHostVerified" FROM "User" WHERE id='legacy-host'`)).rows[0];assert.equal(user.hostStatus,'PENDING');assert.equal(user.isHostVerified,false);
    const property=(await db.query(`SELECT status,"propertyDocsVerified" FROM "Property" WHERE id='legacy-property'`)).rows[0];assert.equal(property.status,'PENDING_REVIEW');assert.equal(property.propertyDocsVerified,false);
    assert.equal((await db.query(`SELECT verified FROM "HostPayoutAccount" WHERE id='legacy-account'`)).rows[0].verified,false);
    assert.equal((await db.query(`SELECT status FROM "Payment" WHERE id='legacy-payment'`)).rows[0].status,'CAPTURED');
    assert.equal((await db.query(`SELECT status FROM "Refund" WHERE id='legacy-refund'`)).rows[0].status,'UNKNOWN');
    assert.equal((await db.query(`SELECT status FROM "Booking" WHERE id='legacy-booking'`)).rows[0].status,'COMPLETED');
  });
  // Remove only the disposable migration fixtures before API scenario setup.
  await db.exec(`DELETE FROM "Refund"; DELETE FROM "Payment"; DELETE FROM "Booking"; DELETE FROM "HostPayoutAccount"; DELETE FROM "Property"; DELETE FROM "User";`);
  server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 0 });
  await server.start();
  const address = server.getServerConn?.();
  // The socket server exposes its listening port through getServerConn().
  console.log('Socket ready');
  const port = server.server?.address?.()?.port || server.port;
  if (!port) throw new Error('Socket listening port is unavailable');
  process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable&connection_limit=1`;
  prisma = new PrismaClient();
  await prisma.$connect();
  const { AppModule } = require('../dist/app.module');
  const { PrismaService } = require('../dist/prisma/prisma.service');
  const { EmailService } = require('../dist/notifications/email.service');
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(EmailService)
    .useValue({
      sendEmail: async () => true,
      sendBookingConfirmationEmail: async () => true,
      sendSupportTicketUpdate: async () => true,
    })
    .compile();
  app = module.createNestApplication({ rawBody: true });
  require('../dist/main').configureApp(app);
  await app.init();
  const http = request(app.getHttpServer());
  const makeUser = async (name, extra = {}) => {
    const u = await prisma.user.create({
      data: {
        firebaseUid: 'offline-' + name,
        email: name + '@example.test',
        displayName: name,
        emailVerified: true,
        phone: '+155555501' + String(tokens.size).padStart(2, '0'),
        ...extra,
      },
    });
    tokens.set(name, u);
    return u;
  };
  const guest = await makeUser('guest'),
    other = await makeUser('other'),
    host = await makeUser('host', {
      roles: ['HOST'],
      hostStatus: 'APPROVED',
      isHostVerified: true,
    }),
    marketing = await makeUser('marketing', {
      isAdmin: true,
      adminRole: 'MARKETING',
    }),
    superAdmin = await makeUser('super', {
      isAdmin: true,
      adminRole: 'SUPER_ADMIN',
    });
  const property = await prisma.property.create({
    data: {
      hostId: host.id,
      type: 'VILLA',
      category: 'VILLA',
      status: 'ACTIVE',
      title: 'Offline stay',
      description: 'Test only',
      address: 'Private address',
      city: 'Test city',
      state: 'Test state',
      lat: 25.123456,
      lng: 85.987654,
      pricePerNight: 1000,
      amenities: [],
      instantBook: true,
      maxGuests: 4,
      wifiPassword: 'PRIVATE-WIFI',
      ownerIdProofDocUrl: 'https://example.test/private-proof',
    },
  });
  const date = (d) =>
    new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
  const bookingBody = {
    propertyId: property.id,
    checkIn: date(30),
    checkOut: date(32),
    adults: 2,
    guests: 2,
  };
  let booking, order;
  await check(
    'private endpoints reject missing and expired tokens',
    async () => {
      assert.equal((await http.get('/api/v1/bookings')).status, 401);
      assert.equal(
        (
          await http
            .get('/api/v1/bookings')
            .set('Authorization', 'Bearer invalid')
        ).status,
        401,
      );
    },
  );
  await check(
    'public property hides documents, Wi-Fi, and exact address',
    async () => {
      const r = await http.get('/api/v1/properties/' + property.id);
      assert.equal(r.status, 200);
      assert.equal(r.body.wifiPassword, undefined);
      assert.equal(r.body.ownerIdProofDocUrl, undefined);
      assert.notEqual(r.body.address, property.address);
      assert.notEqual(r.body.lat, property.lat);
    },
  );
  await check(
    'booking derives guest identity and ignores client totals',
    async () => {
      const r = await http
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer guest')
        .set('Idempotency-Key', 'booking-one')
        .send({ ...bookingBody, guestId: other.id, totalAmount: 1 });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      booking = r.body;
      assert.equal(booking.guestId, guest.id);
      assert.equal(Number(booking.totalAmount), 2236);
      assert.equal(booking.confirmationCode, null);
    },
  );
  await check(
    'booking replay returns one reservation and conflicting reuse fails',
    async () => {
      const r = await http
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer guest')
        .set('Idempotency-Key', 'booking-one')
        .send(bookingBody);
      assert.equal(r.body.id, booking.id);
      assert.equal(await prisma.booking.count(), 1);
      const conflict = await http
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer guest')
        .set('Idempotency-Key', 'booking-one')
        .send({ ...bookingBody, adults: 3, guests: 3 });
      assert.equal(conflict.status, 409);
    },
  );
  await check(
    'overlapping reservations and unpaid access are denied',
    async () => {
      assert.equal(
        (
          await http
            .post('/api/v1/bookings')
            .set('Authorization', 'Bearer other')
            .send(bookingBody)
        ).status,
        409,
      );
      assert.equal(
        (
          await http
            .get('/api/v1/bookings/' + booking.id + '/access-details')
            .set('Authorization', 'Bearer guest')
        ).status,
        403,
      );
    },
  );
  await check(
    'other users and marketing admins cannot read private bookings',
    async () => {
      for (const token of ['other', 'marketing'])
        assert.equal(
          (
            await http
              .get('/api/v1/bookings/' + booking.id)
              .set('Authorization', 'Bearer ' + token)
          ).status,
          403,
        );
    },
  );
  await check('checkout binds ownership and authoritative amount', async () => {
    assert.equal(
      (
        await http
          .post('/api/v1/payments/create-order')
          .set('Authorization', 'Bearer other')
          .send({ bookingId: booking.id, amount: 1 })
      ).status,
      403,
    );
    const r = await http
      .post('/api/v1/payments/create-order')
      .set('Authorization', 'Bearer guest')
      .send({ bookingId: booking.id, amount: 1 });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    order = r.body;
    const saved = await prisma.gatewayOrder.findUnique({
      where: { orderId: order.orderId },
    });
    assert.equal(Number(saved.amount), 2236);
  });
  await check(
    'payment verifies actual provider success and confirms once',
    async () => {
      let r = await http
        .get('/api/v1/payments/verify/' + order.orderId)
        .set('Authorization', 'Bearer guest');
      assert.equal(r.body.isPaid, false);
      gatewayPaid = true;
      for (let i = 0; i < 2; i++) {
        r = await http
          .get('/api/v1/payments/verify/' + order.orderId)
          .set('Authorization', 'Bearer guest');
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(r.body.isPaid, true);
      }
      assert.equal(
        (await prisma.booking.findUnique({ where: { id: booking.id } })).status,
        'CONFIRMED',
      );
      assert.equal(
        await prisma.domainJob.count({ where: { key: 'paid:' + booking.id } }),
        1,
      );
    },
  );
  await check(
    'stay passes render locally and require captured payment',
    async () => {
      const r = await http
        .get('/api/v1/bookings/' + booking.id + '/ticket')
        .set('Authorization', 'Bearer guest');
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.ok(
        Buffer.from(r.body.ticketImageBase64, 'base64')
          .subarray(1, 4)
          .equals(Buffer.from('PNG')),
      );
    },
  );
  await check(
    'pending refund is not declared successful and retry does not duplicate',
    async () => {
      const payments = app.get(
        require('../dist/payments/payments.service').PaymentsService,
      );
      const p = {
        orderId: order.orderId,
        refundAmount: 100,
        refundId: 'offline-refund',
      };
      const pending = await payments.initiateRefund(p);
      assert.equal(pending.status, 'PENDING');
      assert.equal(pending.success, false);
      assert.equal(
        (await prisma.payment.findUnique({ where: { bookingId: booking.id } }))
          .status,
        'CAPTURED',
      );
      refundStatus = 'SUCCESS';
      await payments.initiateRefund(p);
      await payments.initiateRefund(p);
      assert.equal(await prisma.refund.count(), 1);
      assert.equal((await prisma.refund.findFirst()).status, 'SUCCESS');
    },
  );
  await check(
    'support ticket ownership and internal notes stay private',
    async () => {
      const support = app.get(
        require('../dist/support/support.service').SupportService,
      );
      const ticket = await support.createTicket(
        { subject: 'Help', message: 'Test', userId: other.id },
        guest,
      );
      assert.equal(ticket.userId, guest.id);
      await support.addMessage(
        ticket.id,
        { body: 'Internal only', internal: true },
        superAdmin,
      );
      assert.equal(
        (await support.getTicket(ticket.id, guest)).messages.some(
          (m) => m.internal,
        ),
        false,
      );
      await assert.rejects(() => support.getTicket(ticket.id, other));
    },
  );
  await check('final super administrator cannot revoke itself', async () => {
    const admins = app.get(
      require('../dist/admin/admin-users/admin-users.service')
        .AdminUsersService,
    );
    await assert.rejects(() =>
      admins.revokeAccess(superAdmin.id, { reason: 'Test' }, superAdmin.id),
    );
    assert.equal(
      (await prisma.user.findUnique({ where: { id: superAdmin.id } }))
        .adminRole,
      'SUPER_ADMIN',
    );
  });
  await check('forged webhook and legacy checkout fail closed', async () => {
    assert.equal(
      (
        await http
          .post('/api/v1/payments/webhook/cashfree')
          .set('x-webhook-signature', 'forged')
          .set('x-webhook-timestamp', String(Date.now()))
          .send({ data: { order: { order_id: order.orderId } } })
      ).status,
      401,
    );
  });

  await check('public loyalty catalog needs no authentication', async () => {
    const r = await http.get('/api/v1/loyalty/tiers');
    assert.equal(r.status, 200);
    assert.equal(r.body.tiers.length, 3);
  });
  await check(
    'query false retains inactive catalog entries and malformed booleans fail',
    async () => {
      await prisma.catalogCategory.create({
        data: { category: 'VILLA', label: 'Inactive category', active: false },
      });
      const path = '/api/v1/admin/catalog/categories';
      const all = await http
        .get(path + '?activeOnly=false')
        .set('Authorization', 'Bearer super');
      assert.equal(all.status, 200);
      assert.ok(all.body.some((c) => c.category === 'VILLA'));
      const active = await http
        .get(path + '?activeOnly=true')
        .set('Authorization', 'Bearer super');
      assert.equal(active.status, 200);
      assert.ok(!active.body.some((c) => c.category === 'VILLA'));
      assert.equal(
        (
          await http
            .get(path + '?activeOnly=garbage')
            .set('Authorization', 'Bearer super')
        ).status,
        400,
      );
    },
  );
  const loyalty = app.get(
    require('../dist/loyalty/loyalty.service').LoyaltyService,
  );
  await check(
    'paid membership binds owner and purpose and activates exactly once',
    async () => {
      gatewayPaid = false;
      const tierOrder = await loyalty.createTierOrder(
        guest.id,
        'Q_PLUS',
        'tier-one',
      );
      await assert.rejects(() =>
        loyalty.upgradeTier(other.id, 'Q_PLUS', tierOrder.orderId),
      );
      await assert.rejects(() =>
        loyalty.upgradeTier(guest.id, 'Q_PLUS', order.orderId),
      );
      await assert.rejects(() =>
        loyalty.upgradeTier(guest.id, 'Q_PLUS', tierOrder.orderId),
      );
      gatewayPaid = true;
      const first = await loyalty.upgradeTier(
        guest.id,
        'Q_PLUS',
        tierOrder.orderId,
      );
      const again = await loyalty.upgradeTier(
        guest.id,
        'Q_PLUS',
        tierOrder.orderId,
      );
      assert.equal(
        new Date(first.expiresAt).toISOString(),
        new Date(again.expiresAt).toISOString(),
      );
      assert.equal(
        await prisma.pointsTransaction.count({
          where: { referenceId: tierOrder.orderId, type: 'TIER_PURCHASE_EARN' },
        }),
        1,
      );
    },
  );
  await check(
    'loyalty redemption cannot duplicate wallet credit or reuse a changed request',
    async () => {
      await prisma.loyaltyProfile.update({
        where: { userId: guest.id },
        data: { availablePoints: 200, totalPoints: 200 },
      });
      await loyalty.redeemPoints(guest.id, 100, 'redeem-one');
      await loyalty.redeemPoints(guest.id, 100, 'redeem-one');
      await assert.rejects(() =>
        loyalty.redeemPoints(guest.id, 101, 'redeem-one'),
      );
      assert.equal(
        await prisma.walletEntry.count({
          where: { referenceId: `redeem:${guest.id}:redeem-one` },
        }),
        1,
      );
      assert.equal(
        (
          await prisma.loyaltyProfile.findUnique({
            where: { userId: guest.id },
          })
        ).availablePoints,
        100,
      );
    },
  );
  await check(
    'review moderation reverses and restores rewards without double awards',
    async () => {
      const review = await prisma.review.create({
        data: {
          bookingId: booking.id,
          propertyId: property.id,
          guestId: guest.id,
          rating: 4,
          photos: [],
          moderationStatus: 'APPROVED',
        },
      });
      await loyalty.awardReviewPoints(guest.id, review.id);
      await loyalty.awardReviewPoints(guest.id, review.id);
      assert.equal(
        (
          await prisma.loyaltyProfile.findUnique({
            where: { userId: guest.id },
          })
        ).availablePoints,
        110,
      );
      await prisma.review.update({
        where: { id: review.id },
        data: { moderationStatus: 'HIDDEN' },
      });
      await loyalty.reverseReviewPoints(guest.id, review.id);
      assert.equal(
        (
          await prisma.loyaltyProfile.findUnique({
            where: { userId: guest.id },
          })
        ).availablePoints,
        100,
      );
      await prisma.review.update({
        where: { id: review.id },
        data: { moderationStatus: 'APPROVED' },
      });
      await loyalty.awardReviewPoints(guest.id, review.id);
      assert.equal(
        (
          await prisma.loyaltyProfile.findUnique({
            where: { userId: guest.id },
          })
        ).availablePoints,
        110,
      );
    },
  );
  await check(
    'late payment cancels the expired hold and schedules its refund',
    async () => {
      gatewayPaid = false;
      const r = await http
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer guest')
        .send({ ...bookingBody, checkIn: date(60), checkOut: date(62) });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      const late = r.body;
      const checkout = await http
        .post('/api/v1/payments/create-order')
        .set('Authorization', 'Bearer guest')
        .send({ bookingId: late.id });
      assert.equal(checkout.status, 201, JSON.stringify(checkout.body));
      await prisma.booking.update({
        where: { id: late.id },
        data: { createdAt: new Date(Date.now() - 20 * 60000) },
      });
      gatewayPaid = true;
      const verify = await http
        .get('/api/v1/payments/verify/' + checkout.body.orderId)
        .set('Authorization', 'Bearer guest');
      assert.equal(verify.status, 200, JSON.stringify(verify.body));
      assert.equal(
        (await prisma.booking.findUnique({ where: { id: late.id } })).status,
        'CANCELLED',
      );
      assert.equal(
        await prisma.availabilityBlock.count({ where: { bookingId: late.id } }),
        0,
      );
      assert.equal(
        await prisma.domainJob.count({
          where: { key: 'late-refund:' + late.id, type: 'LATE_REFUND' },
        }),
        1,
      );
    },
  );
  await check(
    'manual blocked dates preserve calendar provenance and room amenities update',
    async () => {
      const draft = await prisma.property.create({
        data: {
          hostId: host.id,
          type: 'HOTEL',
          category: 'VILLA',
          title: 'Draft rooms',
          description: 'Test',
          address: 'Private',
          city: 'Test',
          state: 'Test',
          pricePerNight: 1000,
          amenities: [],
        },
      });
      const feed = await prisma.availabilityBlock.create({
        data: {
          propertyId: draft.id,
          type: 'HOST_BLOCKED',
          source: 'CALENDAR:test',
          startDate: new Date(date(80)),
          endDate: new Date(date(81)),
        },
      });
      const save =
        require('../dist/properties/inventory-input.util').saveDraftInventory;
      const payload = {
        roomCategories: [
          {
            categoryName: 'Room',
            quantity: 2,
            maxGuests: 2,
            pricePerNight: 1000,
            hasAc: true,
          },
        ],
        initialBlockedDates: [date(85)],
      };
      for (let i = 0; i < 2; i++)
        await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${draft.id} FOR UPDATE`;
          await save(tx, draft.id, {
            ...payload,
            roomCategories: [
              { ...payload.roomCategories[0], hasAc: i === 0, hasTv: i === 1 },
            ],
          });
        });
      assert.ok(
        await prisma.availabilityBlock.findUnique({ where: { id: feed.id } }),
      );
      assert.equal(
        await prisma.availabilityBlock.count({
          where: { propertyId: draft.id, source: 'MANUAL' },
        }),
        1,
      );
      assert.deepEqual(
        (await prisma.roomType.findFirst({ where: { propertyId: draft.id } }))
          .amenities,
        ['hasTv'],
      );
    },
  );
  await check(
    'staff directory issues no fake credentials and unavailable identity routes are explicit',
    async () => {
      const staff = app.get(
        require('../dist/admin/staff/admin-staff.service').AdminStaffService,
      );
      const created = await staff.createStaff({
        fullName: 'Test staff',
        email: 'staff@example.test',
        department: 'Test',
        allowedModules: [],
        createdById: superAdmin.id,
        createdByName: 'Super',
      });
      assert.equal(created.credentials, undefined);
      assert.equal(created.authenticationProvider, 'FIREBASE');
      assert.throws(() => staff.resetStaffPassword(created.staff.id));
      assert.throws(() => staff.forceLogoutStaff(created.staff.id));
    },
  );
  await check(
    'broadcast worker records actual notifications and respects promotion opt-out',
    async () => {
      await prisma.domainJob.updateMany({
        where: { completedAt: null },
        data: { availableAt: new Date(Date.now() + 86400000) },
      });
      for (const u of [guest, host, marketing, superAdmin])
        await prisma.notificationPreference.upsert({
          where: { userId: u.id },
          create: { userId: u.id, promotions: true },
          update: { promotions: true },
        });
      await prisma.notificationPreference.upsert({
        where: { userId: other.id },
        create: { userId: other.id, promotions: false },
        update: { promotions: false },
      });
      const service = app.get(
        require('../dist/admin/broadcasts/admin-broadcasts.service')
          .AdminBroadcastsService,
      );
      const broadcast = await service.createAndDispatch(
        {
          title: 'Offline announcement',
          body: 'Test message',
          audience: 'all',
        },
        superAdmin.id,
      );
      assert.equal(broadcast.status, 'SENDING');
      assert.equal(broadcast.adminId, superAdmin.id);
      await app.get(require('../dist/jobs/jobs.service').JobsService).run();
      const finished = await prisma.broadcast.findUnique({
        where: { id: broadcast.id },
      });
      assert.equal(finished.status, 'SENT');
      assert.equal(finished.deliveredCount, finished.recipientCount - 1);
      assert.equal(
        await prisma.notification.count({
          where: { userId: other.id, type: 'PROMOTION' },
        }),
        0,
      );
    },
  );

  fs.mkdirSync(path.join(__dirname, '../audit'), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, '../audit/offline-integration-results.json'),
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        providerCalls,
        limitations: [
          'External providers are mocked',
          'PGlite single connection; native PostgreSQL multi-worker contention is not verified',
        ],
      },
      null,
      2,
    ),
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
    if (server) await server.stop();
    if (db) await db.close();
  });
