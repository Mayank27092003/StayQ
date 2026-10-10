# Installation and database upgrade

## Runtime and configuration

Use Node.js 24 (the supplied Docker image) or a compatible Node version at least 22.12, npm, and PostgreSQL 16. Database server, application sessions, and scheduled jobs must use UTC. Calendar date strings represent UTC calendar days.

1. Extract the archive and enter `backend_fixed/`.
2. Copy `.env.example` to `.env` and fill the configuration. Never commit `.env` or service-account files.
3. Set a real DATABASE_URL. Percent-encode special characters in its password. With the supplied local Compose database, use the same password for POSTGRES_PASSWORD and DATABASE_URL.
4. Generate and securely back up DATA_ENCRYPTION_KEY, and generate an independent OTP_HMAC_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The first value is the encryption key; the second is the OTP secret. Store them in your deployment secret store. Losing or blindly replacing an encryption key makes previously encrypted records unreadable.

Configure Firebase Application Default Credentials and FIREBASE_PROJECT_ID. Alternatively, provide your own FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY through the secret store. Configure FIREBASE_STORAGE_BUCKET for uploads and account cleanup. Uploaded identity documents, signatures, and other user files must be protected by storage rules and placed under `users/<Firebase UID>/`. This backend cannot deploy your Firebase rules; verify them in your Firebase project.

For browser clients, CORS_ORIGINS contains comma-separated exact origins, including scheme and port. Production origins must use HTTPS. Set NODE_ENV=production for production deployments. Swagger is disabled by default; enable only where API documentation is intended to be exposed. PUBLIC_API_URL and PAYMENT_RETURN_URL must point to your deployment and app.

Cashfree checkout uses CASHFREE_PG_APP_ID / CASHFREE_PG_SECRET_KEY and CASHFREE_ENVIRONMENT. Identity/bank verification uses CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET and CASHFREE_ENV. Keep sandbox and production credentials separate. Supply the Verification Suite merchant public key if required by your account. Calendar and KYC portrait downloads require exact HTTPS hosts in CALENDAR_ALLOWED_HOSTS and KYC_PORTRAIT_HOSTS.

SMTP delivery needs SMTP_HOST, SMTP_USER, and SMTP_PASS. EMAIL_QUEUE_ENABLED should stay false unless you have configured the Firebase Trigger Email extension. AI endpoints need the DEEPSEEK_* settings; otherwise unavailable responses are intentional. No AI response can dispatch refunds or grant privileges.

The original upload contained real credentials and a private key. Rotate the original database, SMTP, merchant, service-account, and AI credentials before deployment. Remove or retire the old database dumps and copies of the original secrets from your own deployment/history. Public Firebase/Google Maps client identifiers remain in compiled assets; configure provider restrictions and rebuild those assets from their original frontend source for a different project.

## Fresh database

```bash
cp .env.example .env
# Edit .env before continuing.
docker compose up -d postgres
npm ci
npx prisma generate
npm run db:migrate
npm run build
npm run start:prod
```

Compose binds PostgreSQL to localhost and stores data in the named volume. It does not start the backend or run migrations automatically. Do not delete that volume to perform an upgrade. Without Docker, create the database separately and configure UTC server/session timezone.

`GET /api/v1/health` is a process-liveness check. Monitor database connectivity, job backlog, provider failures, and refund reconciliation separately.

## Existing database

Take a database backup using your normal PostgreSQL backup procedure, verify it can be restored, and rehearse the migration on a copy. Pause writes and background workers during the upgrade. The original supplied project had no corresponding migration history.

If your existing schema exactly matches the uploaded original Prisma schema and the baseline has not been recorded, mark only the supplied original baseline as applied:

```bash
npx prisma migrate resolve --applied 202610070001_original_baseline
npx prisma migrate deploy
npx prisma generate
npm run build
```

Do not resolve the repair migration as applied without executing it. If your deployed schema differs, reconcile that difference in the rehearsal database first. Do not use `prisma migrate reset` or an unreviewed `db push` on existing records. Migrate commands need an account with schema-change privileges; runtime access can use a separate application role.

The repair migration deliberately does the following:

- Preserves users' record identities and booking/payment history.
- Clears old bank/document/host verification flags that the original API could set from client input. Previously ACTIVE properties become PENDING_REVIEW; approved hosts return to PENDING. Existing reservations remain intact. Arrange fresh provider verification and document review before republishing or releasing payouts.
- Marks existing refunds UNKNOWN. Reconcile them against actual merchant receipts before any further refunds or payouts for the same booking. UNKNOWN refunds are not retried by the worker.
- Adds CHECK constraints as NOT VALID to preserve legacy rows while protecting new inserts and updates. Review legacy dates, amounts, and capacity records before validating those constraints. Invalid legacy rows may need correction before updates can succeed.

Original payouts, subscriptions, sponsored listings, wallet credits, and loyalty balances may include unverified or simulated activity. Compare these against actual receipts and ledger evidence during the rehearsal; this archive cannot establish that historical provider events occurred. Unfunded entitlements or balances should be corrected through reviewed operator migrations before reopening writes.

Encrypt legacy bank/government-ID columns after migrating and building:

```bash
npm run db:encrypt-legacy
ALLOW_MAINTENANCE=true CONFIRM_DB_NAME=stayq_db npm run db:encrypt-legacy -- --apply
```

The first command is a dry run. The second requires the exact database name and applies encryption under row locks. It does not print sensitive values. Back up the encryption key and database first. Existing `enc:v1:` records are authenticated with the configured key; a wrong key fails instead of rewriting them. This command covers HostPayoutAccount.accountNumber and govIdNumber. Review any other historical identity fields and external backups separately.

## First super administrator

Create/sign in with your chosen Firebase identity, verify its email, and call an authenticated backend endpoint so its User record exists. Then run locally against the intended database:

```bash
TARGET_FIREBASE_UID=your_uid CONFIRM_ADMIN_UID=your_uid npm run admin:bootstrap
```

This verifies the Firebase account, requires both UIDs to match, creates an audit record, and works only when no active SUPER_ADMIN already exists. It does not create a password or a Firebase account. Further administrators must be granted explicit roles by an existing super administrator. The final super administrator cannot be deleted or demoted.

The staff directory records employee metadata only. Its role/module labels do not grant API privileges. Grant and revoke Firebase-backed User.adminRole through admin-users. Password reset and identity-token revocation must use Firebase; the old staff routes do not pretend to perform those actions.

## Workers, payment confirmation, and payouts

Keep JOBS_ENABLED=true on a server with continuous CPU execution. For platforms that suspend idle CPU, schedule POST `/api/v1/webhooks/jobs/run` and pass the secret in the `x-stayq-task-secret` header. CLOUD_TASKS_SECRET must contain at least 32 random characters. Keep it out of URLs. Inspect incomplete DomainJob rows and lastError values; do not mark jobs complete to silence failures.

Configure Cashfree's signed webhook to POST `/api/v1/payments/webhook/cashfree`. The server verifies raw-body HMAC and rechecks actual provider order/payment details. Client status and amounts cannot mark an order paid. Checkout response includes `orderId` and `paymentSessionId`. Pass the order ID back for owner-scoped verification. A late payment after a 15-minute hold is canceled and scheduled for refund; it cannot reclaim sold inventory.

External delivery is retried and can be at least once. In-app notifications and financial intent use durable keys. Provider timeouts are reconciled using the same order/refund IDs, not by manufacturing a successful response.

PAYOUT_MODE is DISABLED by default. MANUAL records an already completed external transfer with its real unique reference; it does not send money to a bank. Finance must reconcile captured amounts, successful/pending/unknown refunds, disputes, escrow dates, and verified payout details first. Refunded earnings stay on hold for reviewed settlement. Refunds after completed transfers set recoveryRequired and preserve the original transfer history.

For paid Host Pro, property boosts, and loyalty tiers, use the purpose-specific create-order and activation routes. The same paid order cannot be activated for another owner, purpose, property, or tier. Idempotent activation does not extend expiry repeatedly. Loyalty redemption requires an Idempotency-Key; reuse it only for the same points amount.

Use property-specific availability endpoints. Manual blocks and imported calendar blocks have separate provenance. Room inventory with booking history requires a reviewed edit; the draft bulk replacement path rejects it rather than deleting historical room IDs.

## Verification before deployment

```bash
npm run check
npm run lint
```

The first command validates schema, compiles, runs unit tests, and runs the disposable integration suite. The configured strict lint rules still report typing debt; see AUDIT_REPORT.md and audit/lint-findings.json. Native PostgreSQL multi-worker contention, live merchant receipt formats, Firebase storage/FCM/identity cleanup, SMTP, and Docker image execution need environment-specific staging verification. No production services were changed during this audit.
