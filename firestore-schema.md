# StayQ — Firestore Schema

Source: `Stay_Q_app_development_proposal.docx` (§2.2 backend, §3–6 feature scope) + current
`StayQ_Source.zip` (`StayModel`, `BookingModel`, `AppProvider`, `add_listing_wizard.dart`).
Backend per proposal is **Firebase (Auth + Firestore + Cloud Functions + FCM) + a lightweight
Node.js service for Razorpay/business logic** — this is a Firestore (NoSQL/document) schema, not
relational. Collection names differ slightly from your Dart classes on purpose — see mapping notes
inline.

## Collection map

| Collection | Purpose | Key relations |
|---|---|---|
| `users` | Guest + host profile (same account can be both) | — |
| `users/{uid}/private/*` | Contact info, payout/KYC details | owner + admin only |
| `users/{uid}/wishlist` | Saved properties | → `properties` |
| `users/{uid}/notifications` | Per-user notification feed | Cloud Functions write |
| `properties` | Listings (your `StayModel`) | → `users` (host) |
| `properties/{id}/availability` | Per-date block/book state | → `bookings` |
| `bookings` | Reservations (your `BookingModel`) | → `properties`, `users` |
| `payments` | Razorpay transactions + payouts | → `bookings` |
| `reviews` | Guest reviews + host replies | → `properties`, `bookings` |
| `conversations` / `messages` | Booking-linked chat | → `bookings` |
| `coupons` | Discount codes | referenced at checkout |
| `cms_pages` | Static admin-editable pages | — |
| `support_tickets` | Contact-form log (MVP support) | — |
| `broadcasts` | Admin push-notification log | fans out to `users/*/notifications` |

---

## `users/{uid}`
Doc ID = Firebase Auth UID. **Public-safe fields only** — see why under Private data below.

| Field | Type | Notes |
|---|---|---|
| displayName | string | |
| photoUrl | string | |
| roles | array\<string\> | `["guest"]` default; `"host"` appended on first listing; `"admin"` mirrored from a custom claim, never client-writable |
| hostProfile | map \| null | `{bio, isSuperhost, responseRate, responseTimeMins, memberSince}` — shown on property detail's "Host info" |
| status | string | `active` \| `suspended` — Admin User Management |
| createdAt / updatedAt | timestamp | |

**Subcollections**
- `private/contact` — `{email, phone, fcmTokens: array<string>}`. Owner-only. Split out of the main
  doc because Firestore rules can't mask individual fields — if email/phone lived on `users/{uid}`
  directly, the "any signed-in user can read a profile" rule needed for showing host info would also
  expose them.
- `private/payoutDetails` — `{bankAccountName, bankAccountLast4, ifscCode, govtIdType, govtIdDocUrl,
  verificationStatus: pending|verified|rejected, verifiedBy, verifiedAt}`. Owner + admin only. Store
  **last 4 digits only** — full account number isn't needed until Phase 2's automated payout API,
  which would hold it in Razorpay's vault, not Firestore.
- `wishlist/{propertyId}` — `{addedAt}`. Owner-only. Store the ID only, not a denormalized property
  snapshot — client fetches current property docs by ID so wishlisted items never show stale prices.
- `notifications/{id}` — `{type, title, body, data: map, read: bool, createdAt}`. Written by Cloud
  Functions only (booking/payment/cancellation/check-in/payout/new-request events, per proposal §3/§4).

---

## `properties/{id}`
Maps 1:1 to `StayModel`. Named `properties` (not `stays`) to match the proposal's own section
headers — your `StayModel` class name doesn't need to change, it's just the Dart-side wrapper.

| Field | Type | Notes |
|---|---|---|
| hostId | string | → `users/{uid}` |
| hostName, hostAvatarUrl | string | denormalized — avoids a `users` read per card in Explore/Search |
| title, description | string | |
| category | string | see **Category taxonomy** below |
| address | string | full text, from Places Autocomplete |
| city | string | lowercase, indexed — "search by city" |
| geopoint | GeoPoint | |
| geohash | string | needed for the Map Discovery screen's radius queries — native GeoPoint alone can't do "nearby" range queries efficiently |
| images | array\<string\> | array order = display order; reorder = rewrite array |
| amenities | array\<string\> | |
| houseRules | array\<string\> | |
| bedrooms, bathrooms, beds, maxGuests | number | |
| pricePerNight, cleaningFee | number | matches `PriceBreakdownAccordion` fields exactly |
| minStayNights, maxStayNights | number | |
| checkInTime, checkOutTime | string | `"15:00"` |
| rating | number | denormalized average — recomputed by a Cloud Function trigger on `reviews` writes, not by the client |
| reviewCount | number | same trigger |
| badges | map | `{isGuestFavorite, isSuperhost, isNew, isFeatured}` — `isFeatured` is admin-only write |
| status | string | `pending_review` \| `active` \| `rejected` \| `suspended` |
| rejectionReason | string \| null | admin-set on reject |
| createdAt / updatedAt | timestamp | |

**Subcollection:** `availability/{yyyy-mm-dd}` — **sparse**: one doc per *unavailable* night only.
`{state: "booked"|"blocked", bookingId: string|null}`. No doc for a date = available. ISO date IDs
sort correctly for range reads (host calendar rendering). This is what actually prevents
double-booking: booking confirmation writes one doc per night inside a single Firestore transaction,
which atomically fails if any night in the range is already taken. Host "block/unblock dates" writes
`state:"blocked"` the same way.

### Category taxonomy — fix needed
Your listing wizard's categories and your home-screen filter chips don't overlap:

- Wizard (`add_listing_wizard.dart`): Villa, Apartment, Cabin, Lakefront, Mansion
- Filter chips (`category_selector.dart`): Amazing Pools, Beachfront, Cabins, Design *(+ "All Stays"/"Trending", which are UI filters, not stored values)*

A property published through the wizard today can't match any filter chip except a near-miss on
Cabin/Cabins. Suggested single canonical list for the `category` field (merge, dedupe the
singular/plural mismatch):
`Villa, Apartment, Cabin, Lakefront, Mansion, Amazing Pools, Beachfront, Design`
Both screens should read from this one list — happy to patch `category_selector.dart` and the wizard
to match once you confirm the final set.

---

## `bookings/{id}`
Maps to `BookingModel`, with one deliberate deviation — see note below the table.

| Field | Type | Notes |
|---|---|---|
| confirmationCode | string | `"SQ-XXXXXX"` format, matches existing code |
| propertyId | string | → `properties` |
| propertyTitle, propertyImage, propertyCity | string | **snapshot at booking time** — if a host edits the listing later, past bookings must still show what the guest actually booked |
| hostId | string | denormalized from property, for host-side queries without a join |
| guestId, guestName, guestAvatarUrl | string | |
| checkIn, checkOut | timestamp | |
| adults, children, nights | number | |
| nightlyRate, subtotal, cleaningFee, serviceFee, taxes | number | snapshot values, mirrors `PriceBreakdownAccordion` |
| couponCode, discountAmount | string\|null, number | |
| totalAmount | number | |
| status | string | `pending_payment` \| `confirmed` \| `cancelled` — see note |
| cancelledBy, cancellationReason, cancelledAt | string\|null, string\|null, timestamp\|null | |
| paymentId | string | → `payments` |
| createdAt / updatedAt | timestamp | |

**On `status` — recommend simplifying vs. your current `BookingStatus` enum.** Your Dart enum has
`confirmed / upcoming / completed / cancelled` as four flat, stored-looking values. `upcoming` and
`completed` aren't independent states though — they're `confirmed` bookings bucketed by comparing
`checkIn`/`checkOut` to "now". Storing them as separate values means something has to remember to
flip them (a scheduled job, easy to get wrong around time zones). Cleaner: store only
`pending_payment | confirmed | cancelled`; derive the Trips screen's Upcoming/Ongoing/Completed tabs
client-side from `status=='confirmed'` + date comparison. A review's eligibility check becomes a
one-line rule (`status=='confirmed' && checkOut < request.time`) instead of depending on a background
job having run. Your `BookingStatus` enum can stay as-is in the UI layer — just compute it from
`{status, checkIn, checkOut}` instead of reading it as a stored field.

`pending_payment` exists to **hold the dates during Razorpay checkout**: the booking doc and its
`availability` writes happen together in one transaction the moment checkout starts, before payment
completes. This stops two guests from both reaching checkout for the same dates. Give these a short
TTL (Firestore has a native TTL policy field) so an abandoned checkout releases the hold automatically.

**Admin manual entry** (§5 Booking Management) is a second write path into this collection — an
admin recording a phone/cash booking, which skips Razorpay and can go straight to `status:'confirmed'`.
`firestore.rules` allows it, but neither this nor guest checkout should write `bookings` directly
from a client in production: both need to go through **one callable Cloud Function** that writes
the booking doc and its `availability` date-blocks in the same transaction — otherwise a manual
entry can silently double-book a date that guest checkout would have caught. The client rule is a
backstop, not the intended path.

---

## `payments/{id}`
**Client never writes to this collection — Node.js service only** (Admin SDK, after verifying the
Razorpay webhook signature server-side). This is exactly the "business logic that needs to sit
outside client-side rules" the proposal calls out in §2.2.

| Field | Type | Notes |
|---|---|---|
| bookingId, guestId | string | |
| amount, currency | number, string | |
| razorpayOrderId, razorpayPaymentId | string | |
| method | string | `upi` \| `card` \| `netbanking` \| `other` |
| status | string | `created` \| `authorized` \| `captured` \| `failed` \| `refunded` \| `partially_refunded` |
| refunds | array\<map\> | `{amount, reason, razorpayRefundId, refundedBy, refundedAt}` |
| platformCommissionAmount | number | 15% — inferred from your own wizard's payout estimate (`pricePerNight * 20 * 0.85`) |
| hostPayoutAmount | number | amount − commission − refunds |
| payoutStatus | string | `pending` \| `released` |
| payoutReleasedBy, payoutReleasedAt | string\|null, timestamp\|null | manual release action, proposal §2.4/§5 |
| createdAt / updatedAt | timestamp | |

---

## `reviews/{id}`
| Field | Type | Notes |
|---|---|---|
| propertyId, bookingId, guestId | string | `bookingId` proves an actual completed stay |
| rating | number | 1–5 |
| text | string | |
| photos | array\<string\> | |
| hostReply | map\|null | `{text, repliedAt}` |
| moderationStatus | string | `visible` \| `hidden` \| `reported` — Admin "remove inappropriate/reported reviews" |
| createdAt | timestamp | |

Writing this triggers the Cloud Function that recomputes `properties/{id}.rating` / `.reviewCount`.

---

## `conversations/{id}` + `conversations/{id}/messages/{id}`
Matches the `_ChatModel` shape already in `inbox_screen.dart`, made persistent and booking-linked
per proposal §3/§4.

`conversations`: `{participantIds: [guestId, hostId], propertyId, bookingId, lastMessage,
lastMessageAt, unreadCount: {uid: number}, createdAt}`

`messages` (subcollection): `{senderId, text, imageUrl: string|null, sentAt}`

---

## `coupons/{code}`
Doc ID = the coupon code itself (uppercase) — checkout does a direct `get`, no query needed.

`{discountType: percentage|flat, discountValue, maxDiscountAmount, minBookingAmount, validFrom,
validTo, usageLimit, usedCount, applicablePropertyIds: array<string>, isActive, createdBy}`

`usedCount` increments inside a transaction at redemption so two guests can't both slip past a
usage limit in a race.

## `cms_pages/{slug}`
`slug ∈ {home, about, contact, faq, privacy-policy, terms}`. `{title, content, updatedAt, updatedBy}`.

## `support_tickets/{id}`
`{name, email, subject, message, status: new|read|resolved, userId: string|null, createdAt}`.

## `broadcasts/{id}`
`{title, body, audience: all|guests|hosts, sentBy, sentAt, recipientCount}`. A Cloud Function fans
this out to the matching users' `notifications` subcollection + FCM.

---

## Auth / role strategy
`request.auth.token.admin == true` (a **custom claim**, set only via a server-side script/Cloud
Function) gates every admin action in `firestore.rules` — never the `users.roles` array field
itself. If admin status were checked from a plain Firestore field, any signed-in user could edit
their own doc to add `"admin"` unless every single rule remembered to lock that one field; a custom
claim can't be set by a client at all, so it's the single point of enforcement instead of one you
have to re-verify per collection.

## Files delivered
- `firestore-schema.md` — this document
- `firestore.rules` — deployable security rules implementing everything above
- `firestore.indexes.json` — composite indexes the listed queries need

Drop the last two straight into a Firebase project root and `firebase deploy --only
firestore:rules,firestore:indexes`.
