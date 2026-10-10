# Backend integration contract

The ZIP contained frontend source and mobile configuration only. No backend implementation, DTO definitions, Firebase rules, merchant credentials or cloud-console permissions were supplied. The changes below are frontend expectations, not evidence that the deployed backend already implements them. A rejected/missing response stays an error or pending state. Confirm these contracts with backend fixtures before enabling production traffic.

## Common rules

Authenticated requests use a Firebase bearer ID token. Derive the actor UID from that token, authorize each booking/property/chat/ticket operation, and ignore client claims about approval, identity, entitlement or ranking. Client ownership guards only isolate local state; they do not replace server authorization.

Return JSON with the correct HTTP status; an explicit `success: false` fails even on HTTP 200. DELETE may return 204 with an empty body. Error responses should include a message. The frontend uses a 15-second request limit and never automatically replays a write.

Honor `Idempotency-Key` on creates, checkout sessions, submissions, messages, tickets and reward redemption. Store the actor/request/result relationship and return the same accepted result for the same attempt after a lost response. Reject reused keys with conflicting business inputs. The gateway order for a booking must be reconciled/reused safely; handle expired/failed sessions without charging a new unconnected booking. Client attempt keys currently persist for the active screen/session; process death still requires server-side status recovery and deduplication.

## Profile and verification

- `PUT /auth/sync-profile`, `GET/PUT /users/profile`: return actual persisted profile/verification/entitlement state. Email text or a client boolean must not grant email ownership. Profile sync should be idempotent by authenticated UID.
- `POST /auth/send-email-otp`: accept email/name and return `success: true` only after accepting the challenge request. `POST /auth/verify-email-otp`: validate the challenge and code, bind it to UID/email, enforce expiry/rate limits, and persist verified status. Hardcoded test OTPs are not accepted by the client.
- Existing verification endpoints in `lib/services/api/verification_api.dart` must return a real Aadhaar reference, affirmative bank/PAN/UPI results, a distinct verified-ID portrait and affirmative liveness/face-match results. Bind each verification to its exact input, UID and challenge; return explicit false/revoked status as well as true.
- `DELETE /users/me`: coordinate backend/Firebase account deletion or return an actionable failure. The frontend requires recent Firebase login and performs Firebase deletion after backend acceptance; a partial failure is reported and must be reconciled on the server. The frontend cannot prove deletion of retained cloud data by itself.

## Booking, quote and payment

`POST /bookings` receives propertyId, ISO checkIn/checkOut, guests (adults + children), separate adults/children/infants/pets, complete options and an optional **estimatedTotalAmount**. Derive the guest from the token. Validate dates, category capacity/minimum/maximum stay and paid-option eligibility. Calculate the authoritative currency/amount/taxes/fees/discounts and atomically reserve inventory. Never trust an estimated total as the charge amount.

Return `booking` (or the direct object) with `id`/`_id`, totalAmount, real dates/party/options, full nested property including host/check-in mode and a pending payment status. Confirmation code and accessPin must come from the backend; only expose access information to authorized confirmed/paid bookings.

`POST /payments/create-order` receives the durable bookingId. Resolve its price and customer from authoritative data. Return real `orderId`/`order_id`, `paymentSessionId`/`payment_session_id`, positive amount/order_amount and `environment: SANDBOX` or `PRODUCTION`. These must describe the same booking and gateway order. Client/customer fields are hints and cannot grant ownership or replace the server quote.

`GET /payments/verify/{orderId}` must query verified gateway state and return `isPaid: true` only for actual accepted payment, preferably with the exact orderId, paymentId and paymentMethod. Verify signed webhooks and payment status/amount/currency server-side; make booking confirmation and entitlement changes idempotent. A client SDK success callback is only a signal to reconcile, not proof of payment.

`GET /bookings/{id}`, `/bookings/my-bookings` and `/bookings/host-bookings` must expose authoritative pending/confirmed/cancelled/completed status, isPaid/paymentStatus, party/options and nested property identity. Lists currently expect arrays. `PUT /bookings/{id}/status` uses lower-case status values and must enforce actor permissions and permitted paid-state transitions. Refunds/cancellation and payouts require independent backend accounting; the frontend does not treat booking total as host payout.

## Paid entitlements and rewards

- `POST /subscriptions/create-order`: create a real order for planId, with the same payment-session response shape. `POST /subscriptions/verify`: accept the exact paid orderId/planId and return both paid evidence and `isActive: true` or `subscription.status: ACTIVE`. Persist entitlement expiry and authorize Pro services on the server.
- `POST /properties/{id}/boost/checkout`: create the selected tier order; `POST /properties/{id}/boost/activate`: authorize owner and verify paid orderId/tierId, then return active boost evidence. The server controls actual ranking and duration.
- **Additional required membership route:** `POST /loyalty/upgrade-tier/create-order` must create the real gateway order for the selected tier. If it is absent, membership checkout reports an error and cannot simulate a free upgrade. `POST /loyalty/upgrade-tier` must consume the same verified paid orderId and update the tier once.
- `GET /loyalty/profile` supplies actual points, creditEquivalent, transactions, tier/expiry, referralBalance and referralCode. `POST /loyalty/redeem` and `/loyalty/claim-profile-bonus` must atomically authorize/apply or reject the reward; return `success: true` only for an accepted result. Check one-time bonus eligibility and balance on the server.
- Checkout referral redemption, wallet top-ups/withdrawals and review submission rewards remain unavailable in this source. Do not enable them with a local balance setter or success toast. Implement a priced/authorized transaction contract first.

## Host listings, documents and availability

`POST /properties/onboarding/draft` accepts the full draft policies/category detail/document URL payload and returns a durable property ID. `PATCH /properties/{id}` updates that owned draft; `POST /properties/{id}/submit` must verify mandatory KYC/payout/document/policy conditions independently and return explicit success or a SUBMITTED/PENDING_REVIEW/UNDER_REVIEW status. The client clears its encrypted draft only after that acknowledgment. Do not treat any client verification flag or DRAFT/status value as approval to publish.

The experience `POST /properties` path requests a draft and requires a saved ID/returned status; do not publish it solely because a title/photo is present. Validate host eligibility and geocode/validate its actual location on the server; zero coordinates represent unknown location, not a real mapped property.

`GET /properties/{id}` returns blockedDates (including explicit `[]`), availabilityScheduleType and weekendSurchargePercent. Missing/malformed availability blocks reservation/editing rather than being interpreted as an empty trusted calendar. `POST /host/availability` includes propertyId, blockedDates, availabilityScheduleType and weekendSurchargePercent. Authorize the owner, persist all fields consistently and enforce the same data at booking time. A weekends-only preset must be enforced by schedule rules beyond any finite list generated by the client.

Preserve room/bed/long-term terms, RV pickup/drop/mileage/driver/insurance, camping capacity/tent/add-ons, host presence, security deposit, house rules and document categories from the submitted payload. Accept/validate the emitted property type/category names; reject unsupported types explicitly rather than coercing them to villa.

Sensitive ID/financial/legal documents are uploaded to UID-scoped Firebase Storage paths. Enforce private access, controlled server processing and lifecycle cleanup in Storage rules/backend. A download URL alone is not an access-control policy. Uploaded local-file references in resumed drafts can be stale; the client requires valid files or completed uploaded references and reports missing uploads.

## Messaging and support

`POST /messaging/conversations` accepts actual hostId/propertyId/bookingId and returns a real conversation ID. For host-to-guest booking chat, derive the other participant from the booking, authorize both parties and do not trust a property ID as a user ID. Authenticate the socket and every conversation/message operation.

`POST /messaging/conversations/{id}/messages` accepts text + clientMessageId, returns the acknowledged message ID and preserves clientMessageId in socket echoes. Deduplicate the same actor/clientMessageId. The socket is receive-only for client sends, and detail loads must return the real authorized message list. The client displays unacknowledged sends as pending/failed; cross-process retry/reconciliation remains a backend responsibility.

`POST /support/tickets` derives ownership from the token, accepts contact/issue/category/priority/transcript and returns a real ticketRef. `GET /support/tickets` returns only that actor's tickets. An editable email is contact information, not authorization. `/support/ai-triage` requires an authenticated real reply; failures present an unavailable state without claiming an agent dispatch.

## Native and remaining integration work

Configure APNs/provisioning and Firebase providers, protect Firebase/Maps credentials with the actual package/bundle/certificate restrictions and verify private Storage/Firestore rules. Include the target Firebase UID in push data.userId; messages without a matching UID are suppressed to avoid cross-account delivery. Define booking/chat deep-link destinations; navigation is not implemented by this ZIP. Validate gateway app switching and cancellation/reconciliation on physical Android/iOS devices. Web needs its own native-API replacements and Firebase/Maps/payment setup.
