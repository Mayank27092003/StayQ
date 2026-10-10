# StayQ backend — audited revision

This archive contains the complete NestJS backend source, Prisma schema and migrations, corrected server configuration, bundled admin assets, and reproducible regression checks. The original upload is preserved separately. Private credentials, private keys, database dumps, installed dependencies, and generated build output are excluded.

Start with [SETUP.md](SETUP.md). Read [AUDIT_REPORT.md](AUDIT_REPORT.md) before upgrading an existing database: the repair migration requires fresh host verification and document review, preserves financial history, and marks historical refunds for manual reconciliation.

```bash
npm ci
npx prisma generate
npm run db:migrate
npm run build
npm run start:prod
```

Configure `.env` from `.env.example` first. Fresh databases apply both supplied migrations. Existing databases need the baseline procedure in SETUP.md; do not run a reset against existing records.

```bash
npm test -- --runInBand
npm run test:e2e
```

The integration runner uses an entirely disposable PGlite database with mocked Firebase and Cashfree providers. It does not use your DATABASE_URL or send real payments, notifications, or email. Its result is written to `audit/offline-integration-results.json`.

`npm run check` also validates the Prisma schema and builds the project. Schema validation needs a configured DATABASE_URL, but does not connect to that database. `npm run lint` remains a separate diagnostic: outstanding TypeScript typing and lint findings are disclosed in the audit report and `audit/lint-findings.json`.

The API defaults to `/api/v1`, with liveness at `/api/v1/health`. Firebase ID tokens authorize private endpoints. Cashfree Payment Gateway handles supported checkout flows; Verification Suite uses separate credentials. Durable jobs handle refunds, booking events, messaging, broadcasts, and identity cleanup.

Several formerly simulated features now return explicit unavailable errors until their actual integrations exist. These include standalone experience checkout, wallet top-up/withdrawal, recurring rent collection, automatic legal documents, reverse penny-drop, bulk imports, and legacy staff password/session administration. The audit report explains the behavior and remaining verification work.

The compiled `public/` admin interface is retained. Its editable source was absent from the upload, so it has not been rebuilt to reflect the stricter backend contracts. Staff authentication must use Firebase and explicitly assigned administrator roles.
