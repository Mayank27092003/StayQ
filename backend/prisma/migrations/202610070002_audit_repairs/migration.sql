BEGIN;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hostProExpiresAt" TIMESTAMP(3),
ADD COLUMN     "hostProPlanId" TEXT,
ADD COLUMN     "identityDeletionPending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHostPro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "accessInstructions" TEXT,
ADD COLUMN     "availabilityScheduleType" TEXT NOT NULL DEFAULT 'ALL_DAYS',
ADD COLUMN     "details" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "weekendSurchargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "wifiPassword" TEXT,
ADD COLUMN     "wifiSsid" TEXT;

-- AlterTable
ALTER TABLE "AvailabilityBlock" ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "accessPin" TEXT,
ADD COLUMN     "confirmationDispatchedAt" TIMESTAMP(3),
ADD COLUMN     "infants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "options" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "pets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pricingRules" JSONB,
ADD COLUMN     "requestHash" TEXT;

-- AlterTable
ALTER TABLE "LeaseAgreement" ADD COLUMN     "ownerSignatureUrl" TEXT,
ADD COLUMN     "ownerSignedAt" TIMESTAMP(3),
ADD COLUMN     "tenantSignatureUrl" TEXT,
ADD COLUMN     "tenantSignedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Backfill existing refunds before enforcing the application-managed timestamp.
ALTER TABLE "Refund" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "HostEarning" ADD COLUMN     "recoveryRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "clientMessageId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "pushSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "requestedRefundAmount" DECIMAL(65,30),
ADD COLUMN     "requestedResolution" TEXT;

-- AlterTable
ALTER TABLE "OtpSession" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consumedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "GatewayOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "sku" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "environment" TEXT NOT NULL,
    "paymentSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATING',
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "activationResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewayOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainJob" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" JSONB,

    CONSTRAINT "DomainJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequest" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "result" JSONB,
    "statusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostLead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "instagramHandle" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'WEBSITE_FORM',
    "status" TEXT NOT NULL DEFAULT 'FORM_SUBMITTED',
    "expectedPrice" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GatewayOrder_orderId_key" ON "GatewayOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayOrder_idempotencyKey_key" ON "GatewayOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GatewayOrder_ownerId_purpose_referenceId_idx" ON "GatewayOrder"("ownerId", "purpose", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "DomainJob_key_key" ON "DomainJob"("key");

-- CreateIndex
CREATE INDEX "DomainJob_completedAt_availableAt_idx" ON "DomainJob"("completedAt", "availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRequest_key_key" ON "ApiRequest"("key");

-- CreateIndex
CREATE INDEX "VerificationChallenge_userId_kind_inputHash_idx" ON "VerificationChallenge"("userId", "kind", "inputHash");

-- CreateIndex
CREATE INDEX "HostLead_status_createdAt_idx" ON "HostLead"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_senderId_clientMessageId_key" ON "Message"("senderId", "clientMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");


-- Historical refunds have no reliable confirmation state. Do not retry them automatically.
UPDATE "Refund" SET status = 'UNKNOWN';

-- The former API accepted client-supplied verification flags. Existing records
-- require fresh provider verification and manual document review before relisting.
-- Financial and reservation history is preserved.
UPDATE "HostPayoutAccount" SET verified = false, "verifiedAt" = NULL, "verifiedBy" = NULL;
UPDATE "Property" SET "propertyDocsVerified" = false, "propertyDocsVerifiedAt" = NULL,
  status = CASE WHEN status = 'ACTIVE' THEN 'PENDING_REVIEW'::"PropertyStatus" ELSE status END;
UPDATE "User" SET "isHostVerified" = false,
  "hostStatus" = CASE WHEN "hostStatus" = 'APPROVED' THEN 'PENDING'::"HostStatus" ELSE "hostStatus" END;

-- NOT VALID preserves legacy records for reconciliation while enforcing every
-- new insert/update. Validate these constraints after reviewing legacy data.
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_dates_and_party_check"
  CHECK ("checkOut" > "checkIn" AND "numberOfNights" > 0 AND adults > 0
    AND children >= 0 AND infants >= 0 AND pets >= 0) NOT VALID;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_amounts_check"
  CHECK ("nightlyRate" >= 0 AND subtotal >= 0 AND "cleaningFee" >= 0
    AND "serviceFee" >= 0 AND taxes >= 0 AND "couponDiscount" >= 0 AND "totalAmount" >= 0) NOT VALID;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amounts_check"
  CHECK (amount > 0 AND "platformCommission" >= 0 AND "hostPayout" >= 0 AND currency = 'INR') NOT VALID;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_amount_check" CHECK (amount > 0) NOT VALID;
ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_amount_check" CHECK (amount > 0) NOT VALID;
ALTER TABLE "GatewayOrder" ADD CONSTRAINT "GatewayOrder_amount_check" CHECK (amount > 0 AND currency = 'INR') NOT VALID;
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_inventory_check"
  CHECK ("totalRooms" > 0 AND "guestCapacity" > 0 AND "basePrice" > 0
    AND ("weekendPrice" IS NULL OR "weekendPrice" > 0)) NOT VALID;
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_dates_check"
  CHECK ("endDate" > "startDate") NOT VALID;

COMMIT;
