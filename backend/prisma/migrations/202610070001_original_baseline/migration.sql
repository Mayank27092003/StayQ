BEGIN;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GUEST', 'HOST');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS', 'TRUST_SAFETY', 'FINANCE', 'MARKETING');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('EXPERIENCES', 'VILLA', 'APARTMENT', 'CABIN', 'COTTAGE', 'FARMHOUSE', 'PENTHOUSE', 'STUDIO', 'HOSTEL', 'HOMESTAY', 'HOTEL', 'CAMPING_SITE', 'RV', 'DORM', 'LONG_TERM_HOME');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('EXPERIENCES', 'VILLA', 'APARTMENT', 'CABIN', 'LAKEFRONT', 'MANSION', 'AMAZING_POOLS', 'BEACHFRONT', 'DESIGN', 'COUNTRYSIDE', 'TROPICAL', 'TREEHOUSE', 'CAMPING', 'SKIING', 'ARCTIC');

-- CreateEnum
CREATE TYPE "AvailabilityBlockType" AS ENUM ('BOOKED', 'HOST_BLOCKED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_HOST_APPROVAL', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CAPTURED', 'REFUNDED', 'RELEASED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'PROCESSING', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'PENDING_TENANT_SIGN', 'PENDING_OWNER_SIGN', 'ACTIVE', 'RENEWAL_PENDING', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ExperienceCategory" AS ENUM ('ADVENTURE', 'FOOD_AND_DRINK', 'ART_AND_CULTURE', 'NATURE', 'WELLNESS', 'SPORTS', 'NIGHTLIFE', 'SIGHTSEEING', 'WORKSHOPS', 'LOCAL_LIFE');

-- CreateEnum
CREATE TYPE "PropertyTagType" AS ENUM ('GUEST_FAVOURITE', 'PET_FRIENDLY', 'SUPERHOST', 'POPULAR_IN_AREA', 'PREMIUM', 'ZERO_BROKER', 'INSTANT_BOOK', 'NEW_LISTING', 'FAMILY_FRIENDLY', 'COUPLE_FRIENDLY', 'WORKCATION');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "WalletEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'SIGNED_UP', 'FIRST_BOOKING', 'REWARDED');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('PROPERTY_NOT_AS_DESCRIBED', 'CLEANLINESS_ISSUE', 'HOST_NO_SHOW', 'GUEST_DAMAGE', 'PAYMENT_ISSUE', 'SAFETY_CONCERN', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_GUEST_FAVOUR', 'RESOLVED_HOST_FAVOUR', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REQUEST', 'PAYMENT_CAPTURED', 'PAYOUT_RELEASED', 'NEW_MESSAGE', 'NEW_REVIEW', 'REVIEW_REMINDER', 'PRICE_DROP', 'PROMOTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContentReportTargetType" AS ENUM ('PROPERTY', 'PROPERTY_IMAGE', 'REVIEW', 'MESSAGE', 'USER_PROFILE');

-- CreateEnum
CREATE TYPE "ContentReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ContentReportReason" AS ENUM ('SPAM', 'OFFENSIVE_CONTENT', 'MISLEADING_INFORMATION', 'FRAUD_OR_SCAM', 'INAPPROPRIATE_IMAGERY', 'HARASSMENT', 'COPYRIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "HostStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "FeaturedPlacementType" AS ENUM ('HOME_HERO', 'HOME_CAROUSEL', 'CATEGORY_SPOTLIGHT', 'SEARCH_PROMOTED');

-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('HOME_TOP', 'HOME_MID', 'SEARCH_RESULTS', 'APP_LAUNCH');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportMessageAuthorType" AS ENUM ('ADMIN', 'REQUESTER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BulkOperationType" AS ENUM ('PROPERTY_STATUS_UPDATE', 'PROPERTY_IMPORT', 'PROPERTY_EXPORT', 'BOOKING_EXPORT', 'USER_EXPORT', 'USER_ROLE_UPDATE', 'REVIEW_MODERATION');

-- CreateEnum
CREATE TYPE "BulkOperationStatus" AS ENUM ('PENDING', 'VALIDATING', 'DRY_RUN_COMPLETE', 'RUNNING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BulkOperationItemStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('ON_DEMAND', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('CSV', 'JSON');

-- CreateEnum
CREATE TYPE "ReportRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportKind" AS ENUM ('BOOKINGS', 'REVENUE', 'PROPERTIES', 'USERS', 'PROMOTION_REDEMPTIONS', 'SUPPORT_TICKETS');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "AdminSettingValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('Q_STARTER', 'Q_PLUS', 'Q_PREMIUM');

-- CreateEnum
CREATE TYPE "PointsTransactionType" AS ENUM ('BOOKING_EARN', 'REVIEW_EARN', 'REFERRAL_EARN', 'PROFILE_EARN', 'REPEAT_STAY_EARN', 'TIER_PURCHASE_EARN', 'REDEEM', 'ADMIN_ADJUST', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CorridorRegion" AS ENUM ('NORTH_INDIA', 'SOUTH_INDIA', 'GUJARAT_RAJASTHAN', 'NORTH_EAST');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "displayName" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "roles" "UserRole"[] DEFAULT ARRAY['GUEST']::"UserRole"[],
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminRole" "AdminRole",
    "isSuperhost" BOOLEAN NOT NULL DEFAULT false,
    "isStarhost" BOOLEAN NOT NULL DEFAULT false,
    "isHostVerified" BOOLEAN NOT NULL DEFAULT false,
    "hostVerifiedAt" TIMESTAMP(3),
    "responseRate" DOUBLE PRECISION,
    "responseTime" INTEGER,
    "hostStatus" "HostStatus",
    "hostStatusReason" TEXT,
    "hostStatusUpdatedAt" TIMESTAMP(3),
    "hostStatusUpdatedById" TEXT,
    "referralCode" TEXT,
    "hostCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostPayoutAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "govIdType" TEXT,
    "govIdNumber" TEXT,
    "govIdDocUrl" TEXT,
    "upiId" TEXT,
    "passbookImageUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostPayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL,
    "category" "PropertyCategory" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "beds" INTEGER NOT NULL DEFAULT 1,
    "maxGuests" INTEGER NOT NULL DEFAULT 2,
    "amenities" TEXT[],
    "houseRules" TEXT,
    "checkInTime" TEXT NOT NULL DEFAULT '14:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "pricePerNight" DECIMAL(65,30) NOT NULL,
    "cleaningFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "weeklyDiscount" DOUBLE PRECISION,
    "monthlyDiscount" DOUBLE PRECISION,
    "instantBook" BOOLEAN NOT NULL DEFAULT true,
    "minStay" INTEGER NOT NULL DEFAULT 1,
    "maxStay" INTEGER,
    "longTermAvailable" BOOLEAN NOT NULL DEFAULT false,
    "monthlyRent" DECIMAL(65,30),
    "securityDeposit" DECIMAL(65,30),
    "leaseDurationMonths" INTEGER DEFAULT 11,
    "cancellationPolicy" TEXT NOT NULL DEFAULT 'flexible',
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "yearEstablished" INTEGER,
    "starRating" DOUBLE PRECISION,
    "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "partiesAllowed" BOOLEAN NOT NULL DEFAULT false,
    "pickupLocation" TEXT,
    "dropLocation" TEXT,
    "vehicleType" TEXT,
    "rvFacilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "terrainType" TEXT,
    "tentCapacity" INTEGER,
    "hasCampfire" BOOLEAN NOT NULL DEFAULT false,
    "bedCount" INTEGER,
    "dormType" TEXT,
    "hasLocker" BOOLEAN NOT NULL DEFAULT false,
    "ownershipType" TEXT,
    "isInsideGatedSociety" BOOLEAN NOT NULL DEFAULT false,
    "checkInType" TEXT,
    "electricityBillDocUrl" TEXT,
    "propertyRegistryDocUrl" TEXT,
    "leaseAgreementDocUrl" TEXT,
    "landlordNocDocUrl" TEXT,
    "societyNocDocUrl" TEXT,
    "tradeLicenseDocUrl" TEXT,
    "ownerIdProofDocUrl" TEXT,
    "selfieFaceProofDocUrl" TEXT,
    "propertyDocsVerified" BOOLEAN NOT NULL DEFAULT false,
    "propertyDocsVerifiedAt" TIMESTAMP(3),
    "propertyCode" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faultCount" INTEGER NOT NULL DEFAULT 0,
    "hasActiveFault" BOOLEAN NOT NULL DEFAULT false,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsoredTier" TEXT,
    "sponsoredUntil" TIMESTAMP(3),
    "searchRankBoost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyIncident" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT,
    "propertyId" TEXT NOT NULL,
    "reportedById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'MAINTENANCE',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalRooms" INTEGER NOT NULL DEFAULT 1,
    "guestCapacity" INTEGER NOT NULL DEFAULT 2,
    "roomSizeSqft" INTEGER,
    "bedType" TEXT,
    "bathroomType" TEXT,
    "amenities" TEXT[],
    "basePrice" DECIMAL(65,30) NOT NULL,
    "weekendPrice" DECIMAL(65,30),
    "extraGuestCharge" DECIMAL(65,30) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyBoost" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "tierName" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "paymentId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyTag" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tag" "PropertyTagType" NOT NULL,
    "autoApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "AvailabilityBlockType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "nightlyRate" DECIMAL(65,30) NOT NULL,
    "numberOfNights" INTEGER NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "cleaningFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "serviceFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "couponDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "confirmationCode" TEXT NOT NULL,
    "couponCode" TEXT,
    "cancellationPolicy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "idempotencyKey" TEXT,
    "roomTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseAgreement" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "leaseDurationMonths" INTEGER NOT NULL DEFAULT 11,
    "monthlyRent" DECIMAL(65,30) NOT NULL,
    "securityDeposit" DECIMAL(65,30) NOT NULL,
    "maintenanceCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "leaseStartDate" TIMESTAMP(3) NOT NULL,
    "leaseEndDate" TIMESTAMP(3) NOT NULL,
    "brokerFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(65,30) NOT NULL,
    "agreementDocUrl" TEXT,
    "status" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "tenantIdProofUrl" TEXT,
    "tenantAadhaarEncrypted" TEXT,
    "renewalReminderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "platformCommission" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "hostPayout" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "capturedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "razorpayRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostEarning" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "grossAmount" DECIMAL(65,30) NOT NULL,
    "platformFee" DECIMAL(65,30) NOT NULL,
    "taxDeducted" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netPayout" DECIMAL(65,30) NOT NULL,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payoutDate" TIMESTAMP(3),
    "payoutReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExperienceCategory" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "maxGroupSize" INTEGER NOT NULL,
    "pricePerPerson" DECIMAL(65,30) NOT NULL,
    "includes" TEXT[],
    "whatToBring" TEXT[],
    "location" TEXT NOT NULL,
    "meetingPoint" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceImage" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceSlot" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "spotsTotal" INTEGER NOT NULL,
    "spotsTaken" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExperienceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceReview" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "text" TEXT,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "text" TEXT,
    "photos" TEXT[],
    "hostReply" TEXT,
    "hostRepliedAt" TIMESTAMP(3),
    "visibleAt" TIMESTAMP(3),
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "reportReason" TEXT,
    "moderated" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    "moderationNote" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "category" "PropertyCategory",
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "minPrice" DECIMAL(65,30),
    "maxPrice" DECIMAL(65,30),
    "adults" INTEGER,
    "amenities" TEXT[],
    "lastMatchedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "bookingId" TEXT,
    "guestId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "imageUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bookingUpdates" BOOLEAN NOT NULL DEFAULT true,
    "messages" BOOLEAN NOT NULL DEFAULT true,
    "promotions" BOOLEAN NOT NULL DEFAULT false,
    "priceDrops" BOOLEAN NOT NULL DEFAULT true,
    "reviewReminders" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "minBookingAmount" DECIMAL(65,30),
    "maxDiscount" DECIMAL(65,30),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "applicableCategories" "PropertyCategory"[],
    "applicableCities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "WalletEntryType" NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referralCode" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "referrerReward" DECIMAL(65,30) NOT NULL DEFAULT 500,
    "referredReward" DECIMAL(65,30) NOT NULL DEFAULT 300,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "reason" "DisputeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT[],
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
    "category" TEXT,
    "assignedTo" TEXT,
    "resolution" TEXT,
    "firstRespondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "targetType" "ContentReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ContentReportReason" NOT NULL,
    "description" TEXT,
    "reportedById" TEXT,
    "status" "ContentReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedPlacement" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "placement" "FeaturedPlacementType" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "placement" "BannerPlacement" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" TEXT NOT NULL,
    "category" "PropertyCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "category" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorType" "SupportMessageAuthorType" NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperation" (
    "id" TEXT NOT NULL,
    "type" "BulkOperationType" NOT NULL,
    "status" "BulkOperationStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "sourceFileName" TEXT,
    "parameters" JSONB,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "succeededItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "skippedItems" INTEGER NOT NULL DEFAULT 0,
    "resultFileName" TEXT,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperationItem" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "targetId" TEXT,
    "payload" JSONB,
    "status" "BulkOperationItemStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkOperationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ReportKind" NOT NULL,
    "format" "ReportFormat" NOT NULL DEFAULT 'CSV',
    "frequency" "ReportFrequency" NOT NULL DEFAULT 'ON_DEMAND',
    "parameters" JSONB,
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "status" "ReportRunStatus" NOT NULL DEFAULT 'QUEUED',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "rowCount" INTEGER,
    "content" TEXT,
    "contentType" TEXT,
    "fileName" TEXT,
    "errorMessage" TEXT,
    "triggeredById" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QubeConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionLabel" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QubeConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QubeMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "latencyMs" INTEGER,
    "suggestedPropertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "helpful" BOOLEAN,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QubeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QubeKnowledgeEntry" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QubeKnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" "AdminSettingValueType" NOT NULL DEFAULT 'STRING',
    "group" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminStaff" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allowedModules" TEXT[],
    "phoneNumber" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "lastLogoutAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentSessionIp" TEXT,
    "sessionRevokedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffActivityLog" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "redeemedPoints" INTEGER NOT NULL DEFAULT 0,
    "tier" "LoyaltyTier" NOT NULL DEFAULT 'Q_STARTER',
    "tierExpiresAt" TIMESTAMP(3),
    "tierPurchasedAt" TIMESTAMP(3),
    "pointsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "profileCompletionRewarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "PointsTransactionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampervanCorridor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" "CorridorRegion" NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "durationMinDays" INTEGER NOT NULL,
    "durationMaxDays" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "stops" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "theme" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "permits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "advisoryNotes" TEXT,
    "badge" TEXT,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampervanCorridor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_hostCode_key" ON "User"("hostCode");

-- CreateIndex
CREATE INDEX "User_firebaseUid_idx" ON "User"("firebaseUid");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HostPayoutAccount_userId_key" ON "HostPayoutAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_propertyCode_key" ON "Property"("propertyCode");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_category_idx" ON "Property"("category");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_hostId_idx" ON "Property"("hostId");

-- CreateIndex
CREATE INDEX "Property_isSponsored_idx" ON "Property"("isSponsored");

-- CreateIndex
CREATE INDEX "Property_pricePerNight_idx" ON "Property"("pricePerNight");

-- CreateIndex
CREATE INDEX "Property_propertyCode_idx" ON "Property"("propertyCode");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyIncident_incidentCode_key" ON "PropertyIncident"("incidentCode");

-- CreateIndex
CREATE INDEX "PropertyIncident_propertyId_idx" ON "PropertyIncident"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyIncident_status_idx" ON "PropertyIncident"("status");

-- CreateIndex
CREATE INDEX "PropertyIncident_incidentCode_idx" ON "PropertyIncident"("incidentCode");

-- CreateIndex
CREATE INDEX "RoomType_propertyId_idx" ON "RoomType"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyBoost_propertyId_idx" ON "PropertyBoost"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyBoost_hostId_idx" ON "PropertyBoost"("hostId");

-- CreateIndex
CREATE INDEX "PropertyBoost_status_idx" ON "PropertyBoost"("status");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyTag_propertyId_tag_key" ON "PropertyTag"("propertyId", "tag");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_propertyId_idx" ON "AvailabilityBlock"("propertyId");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_startDate_endDate_idx" ON "AvailabilityBlock"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmationCode_key" ON "Booking"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_guestId_idx" ON "Booking"("guestId");

-- CreateIndex
CREATE INDEX "Booking_propertyId_idx" ON "Booking"("propertyId");

-- CreateIndex
CREATE INDEX "Booking_roomTypeId_idx" ON "Booking"("roomTypeId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_confirmationCode_idx" ON "Booking"("confirmationCode");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseAgreement_bookingId_key" ON "LeaseAgreement"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_razorpayOrderId_idx" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_razorpayRefundId_key" ON "Refund"("razorpayRefundId");

-- CreateIndex
CREATE UNIQUE INDEX "HostEarning_bookingId_key" ON "HostEarning"("bookingId");

-- CreateIndex
CREATE INDEX "HostEarning_hostId_idx" ON "HostEarning"("hostId");

-- CreateIndex
CREATE INDEX "HostEarning_payoutStatus_idx" ON "HostEarning"("payoutStatus");

-- CreateIndex
CREATE INDEX "Experience_hostId_idx" ON "Experience"("hostId");

-- CreateIndex
CREATE INDEX "Experience_category_idx" ON "Experience"("category");

-- CreateIndex
CREATE INDEX "ExperienceSlot_experienceId_date_idx" ON "ExperienceSlot"("experienceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceReview_experienceId_guestId_key" ON "ExperienceReview"("experienceId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_propertyId_idx" ON "Review"("propertyId");

-- CreateIndex
CREATE INDEX "Review_guestId_idx" ON "Review"("guestId");

-- CreateIndex
CREATE INDEX "Review_moderationStatus_idx" ON "Review"("moderationStatus");

-- CreateIndex
CREATE INDEX "Review_reported_idx" ON "Review"("reported");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_propertyId_key" ON "Wishlist"("userId", "propertyId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "Conversation_guestId_idx" ON "Conversation"("guestId");

-- CreateIndex
CREATE INDEX "Conversation_hostId_idx" ON "Conversation"("hostId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "WalletEntry_userId_idx" ON "WalletEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_bookingId_key" ON "Dispute"("bookingId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedTo_idx" ON "SupportTicket"("assignedTo");

-- CreateIndex
CREATE INDEX "Broadcast_status_createdAt_idx" ON "Broadcast"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "OtpSession_phone_otp_idx" ON "OtpSession"("phone", "otp");

-- CreateIndex
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReport_targetType_targetId_idx" ON "ContentReport"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "FeaturedPlacement_placement_displayOrder_idx" ON "FeaturedPlacement"("placement", "displayOrder");

-- CreateIndex
CREATE INDEX "FeaturedPlacement_active_startsAt_endsAt_idx" ON "FeaturedPlacement"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedPlacement_propertyId_placement_key" ON "FeaturedPlacement"("propertyId", "placement");

-- CreateIndex
CREATE INDEX "ContentBanner_placement_displayOrder_idx" ON "ContentBanner"("placement", "displayOrder");

-- CreateIndex
CREATE INDEX "ContentBanner_active_startsAt_endsAt_idx" ON "ContentBanner"("active", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCategory_category_key" ON "CatalogCategory"("category");

-- CreateIndex
CREATE INDEX "CatalogCategory_displayOrder_idx" ON "CatalogCategory"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_key_key" ON "Amenity"("key");

-- CreateIndex
CREATE INDEX "Amenity_category_displayOrder_idx" ON "Amenity"("category", "displayOrder");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx" ON "BookingStatusHistory"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOperation_idempotencyKey_key" ON "BulkOperation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BulkOperation_status_createdAt_idx" ON "BulkOperation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BulkOperation_createdById_idx" ON "BulkOperation"("createdById");

-- CreateIndex
CREATE INDEX "BulkOperationItem_operationId_status_idx" ON "BulkOperationItem"("operationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOperationItem_operationId_rowNumber_key" ON "BulkOperationItem"("operationId", "rowNumber");

-- CreateIndex
CREATE INDEX "ReportDefinition_kind_idx" ON "ReportDefinition"("kind");

-- CreateIndex
CREATE INDEX "ReportDefinition_active_nextRunAt_idx" ON "ReportDefinition"("active", "nextRunAt");

-- CreateIndex
CREATE INDEX "ReportRun_definitionId_createdAt_idx" ON "ReportRun"("definitionId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportRun_status_idx" ON "ReportRun"("status");

-- CreateIndex
CREATE INDEX "QubeConversation_userId_createdAt_idx" ON "QubeConversation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QubeConversation_createdAt_idx" ON "QubeConversation"("createdAt");

-- CreateIndex
CREATE INDEX "QubeMessage_conversationId_createdAt_idx" ON "QubeMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "QubeKnowledgeEntry_active_priority_idx" ON "QubeKnowledgeEntry"("active", "priority");

-- CreateIndex
CREATE INDEX "QubeKnowledgeEntry_topic_idx" ON "QubeKnowledgeEntry"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSetting_key_key" ON "AdminSetting"("key");

-- CreateIndex
CREATE INDEX "AdminSetting_group_idx" ON "AdminSetting"("group");

-- CreateIndex
CREATE UNIQUE INDEX "AdminStaff_staffId_key" ON "AdminStaff"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminStaff_email_key" ON "AdminStaff"("email");

-- CreateIndex
CREATE INDEX "AdminStaff_staffId_idx" ON "AdminStaff"("staffId");

-- CreateIndex
CREATE INDEX "AdminStaff_email_idx" ON "AdminStaff"("email");

-- CreateIndex
CREATE INDEX "AdminStaff_role_idx" ON "AdminStaff"("role");

-- CreateIndex
CREATE INDEX "AdminStaff_status_idx" ON "AdminStaff"("status");

-- CreateIndex
CREATE INDEX "AdminStaff_isOnline_idx" ON "AdminStaff"("isOnline");

-- CreateIndex
CREATE INDEX "StaffActivityLog_staffId_idx" ON "StaffActivityLog"("staffId");

-- CreateIndex
CREATE INDEX "StaffActivityLog_module_idx" ON "StaffActivityLog"("module");

-- CreateIndex
CREATE INDEX "StaffActivityLog_action_idx" ON "StaffActivityLog"("action");

-- CreateIndex
CREATE INDEX "StaffActivityLog_createdAt_idx" ON "StaffActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProfile_userId_key" ON "LoyaltyProfile"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyProfile_userId_idx" ON "LoyaltyProfile"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyProfile_tier_idx" ON "LoyaltyProfile"("tier");

-- CreateIndex
CREATE INDEX "PointsTransaction_loyaltyId_idx" ON "PointsTransaction"("loyaltyId");

-- CreateIndex
CREATE INDEX "PointsTransaction_type_idx" ON "PointsTransaction"("type");

-- CreateIndex
CREATE INDEX "PointsTransaction_createdAt_idx" ON "PointsTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampervanCorridor_slug_key" ON "CampervanCorridor"("slug");

-- CreateIndex
CREATE INDEX "CampervanCorridor_region_idx" ON "CampervanCorridor"("region");

-- CreateIndex
CREATE INDEX "CampervanCorridor_isActive_idx" ON "CampervanCorridor"("isActive");

-- CreateIndex
CREATE INDEX "CampervanCorridor_sortOrder_idx" ON "CampervanCorridor"("sortOrder");

-- AddForeignKey
ALTER TABLE "HostPayoutAccount" ADD CONSTRAINT "HostPayoutAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIncident" ADD CONSTRAINT "PropertyIncident_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIncident" ADD CONSTRAINT "PropertyIncident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyBoost" ADD CONSTRAINT "PropertyBoost_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTag" ADD CONSTRAINT "PropertyTag_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseAgreement" ADD CONSTRAINT "LeaseAgreement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseAgreement" ADD CONSTRAINT "LeaseAgreement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostEarning" ADD CONSTRAINT "HostEarning_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostEarning" ADD CONSTRAINT "HostEarning_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceImage" ADD CONSTRAINT "ExperienceImage_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceSlot" ADD CONSTRAINT "ExperienceSlot_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceReview" ADD CONSTRAINT "ExperienceReview_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedBy_fkey" FOREIGN KEY ("raisedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedPlacement" ADD CONSTRAINT "FeaturedPlacement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperationItem" ADD CONSTRAINT "BulkOperationItem_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "BulkOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QubeMessage" ADD CONSTRAINT "QubeMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "QubeConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyProfile" ADD CONSTRAINT "LoyaltyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "LoyaltyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
