# StayQ Flutter frontend: deep code audit

Audited archive: `frontend_flutter.zip`  
Audit completed: 7 October 2026  
Archive SHA-256: `2b8ef53f0a6cfb0357a3877549eabb6080f9bc33e1a5f31a543015364fd568a6`

## Release assessment

**This version is not ready for a production release.** The archive contains eight broken imports, an Android private signing key together with working credentials, client-side verification bypasses, payment paths that never initiate the advertised payment, account state that survives logout, and several flows that report success after failure. Host submission can erase the only saved draft even when neither submission nor fallback succeeds.

This report records **70 source-backed findings**, grouped by the behavior they affect, plus a separate list of backend and platform questions. Some findings share a root cause, so the count is not a count of independent exploits. A confirmed client defect does not establish that the backend accepts unauthorized payments, KYC approvals, discounts, or access to another user's records.

Priority totals: **1 P0, 42 P1, and 27 P2**. Eleven additional questions require backend, cloud configuration, or native build/device verification.

No application source was changed. All 370 non-directory archive entries were compared with their extracted counterparts and matched byte for byte.

### Priority definitions

| Priority | Meaning |
|---|---|
| P0 | Contain exposed signing material immediately; determine whether the affected identity is used for a release. |
| P1 | Fix before production: build blockers, account isolation, verification, payment/booking integrity, lost submissions, or materially misleading success. |
| P2 | Fix before the affected feature is considered complete: reliability, data mapping, persistence, search, or platform configuration. |

Priorities assume the app's advertised booking, hosting, payment, verification, and account-management features are intended to work in production. Demonstration-only behavior must be isolated from release builds and clearly identified in the product.

### Most urgent findings

| Finding | Evidence | Consequence |
|---|---|---|
| F02: signing credentials included | `android/key.properties:1` and `android/app/upload-keystore.jks` | A private signing identity is exposed in the distributed source archive. |
| F01: imports point outside `lib` | Host Pro paywall lines 4–9; price radar lines 3–4 | Reachable source files cannot resolve eight imports. |
| F09 / F17: verification accepts fabricated success | Email service line 56; bank-details screen lines 520–559 | Email ownership and face verification can appear successful without valid verification. |
| F14 / F64: user state survives logout | App provider lines 1108–1135; messaging provider lines 22–57 | Another session on the same device can inherit personal state or an old chat connection. |
| F24–F29: payment and booking workflow is incomplete | Payment sheet lines 142–270; checkout lines 417–444 | Card/netbanking never start a payment; booking identity is not bound to the payment; confirmation precedes booking acceptance. |
| F30 / F31: booking status and access information are fabricated | Booking model lines 34–53; boarding-pass and confirmation screens | Unpaid bookings can appear confirmed; confirmation codes and door PINs are not authoritative. |
| F40: failed host submission destroys draft | Host onboarding provider lines 929–988 | Network/API failure can lose a host's submission while showing success. |
| F22 / F68: account deletion and support escalation can report false success | App provider lines 1138–1167; support screen lines 258–339 | Users may believe an account was deleted or a support ticket exists when neither operation succeeded. |

## What was inspected and verified

The archive contains 384 entries and 62,185,788 uncompressed bytes. `lib/` contains 136 Dart files and 50,671 lines. The review inventoried the complete source tree, checked local import resolution and literal asset references, parsed configuration files, and manually traced authentication, session persistence, KYC, payments, booking creation/status, host onboarding, host management, rewards, messaging, search/maps, support, and account settings. Platform configuration and dependency constraints were also examined.

| Check | Result |
|---|---|
| Relative Dart import/export/part targets | Eight missing targets, enumerated in F01. |
| Direct imported packages versus `pubspec.yaml` | `path` is used directly but is not declared directly. |
| Static literal asset references | No missing referenced literal asset found. Dynamically constructed paths are outside this result. |
| Configuration syntax | Five JSON, two YAML, seven XML, and five plist files parsed successfully. This does not validate their semantics. |
| Android keystore inspection | `keytool` successfully opened the supplied keystore using the included password and confirmed a private-key entry. Credentials are deliberately omitted from this report. |
| Source preservation | All 370 archive files matched extracted bytes. |
| Dart tests supplied | No `*_test.dart` files. The iOS test is an empty template. |
| Flutter/Dart/Gradle executables | Unavailable in the audit environment. |

**Not executed:** `flutter analyze`, Flutter unit/widget/integration tests, Android/iOS/web builds, emulator/device flows, Firebase security-rule tests, live backend calls, real OTP generation, payments, account deletion, or production mutations. Java/Python/Node availability does not substitute for the Flutter toolchain. No claim is made that every syntax, type, rendering, or backend error has been found.

Locations below refer to the unchanged files in the supplied archive. A location such as `file.dart:142` identifies the starting line of the relevant implementation. Failure scenarios are derived from control flow unless explicitly described as an executed static or configuration check.

## Build, release, and initialization

### F01 — P1 — Eight relative imports resolve outside `lib`

**Evidence:** `lib/screens/host/widgets/host_pro_paywall_sheet.dart:4–9`; `lib/screens/host/widgets/neighborhood_price_radar_widget.dart:3–4`.

These files are three directory levels below `lib`, but their imports use four parent traversals. The targets therefore resolve to nonexistent project-root `providers`, `services`, `theme`, and `widgets` directories. The paywall has six broken imports and the radar has two. These widgets are referenced by the host flows, so this is a reachable build blocker, not merely an unused file warning.

**Fix:** Replace `../../../../` with `../../../` for these imports, or use package imports consistently. Run the actual analyzer and builds afterward; the eight failures do not establish that there are no further compiler errors.

| File and line | Correct relative target |
|---|---|
| `host_pro_paywall_sheet.dart:4` | `../../../providers/app_provider.dart` |
| `host_pro_paywall_sheet.dart:5` | `../../../services/api/api_client.dart` |
| `host_pro_paywall_sheet.dart:6` | `../../../services/api/subscriptions_api.dart` |
| `host_pro_paywall_sheet.dart:7` | `../../../theme/app_colors.dart` |
| `host_pro_paywall_sheet.dart:8` | `../../../widgets/bouncing_widget.dart` |
| `host_pro_paywall_sheet.dart:9` | `../../../widgets/cashfree_payment_sheet.dart` |
| `neighborhood_price_radar_widget.dart:3` | `../../../theme/app_colors.dart` |
| `neighborhood_price_radar_widget.dart:4` | `../../../widgets/bouncing_widget.dart` |

### F02 — P0 — Android private signing material and working credentials are distributed

**Evidence:** `android/key.properties:1–4`; `android/app/upload-keystore.jks`.

The source archive includes the store password, key password, alias, and keystore path alongside the keystore. Inspection confirmed that the supplied store password works and that the keystore contains a private-key entry. This is stronger evidence than the presence of a Firebase public client configuration.

**Impact and fix:** Restrict circulation of this archive, remove signing material from future source packages and repository history, and put signing credentials in a controlled secret mechanism. Determine whether this key is an active app-signing key, a Play upload key, or an unused development identity. Follow the applicable key-reset or signing-continuity process if it is active. Production compromise, release certificate matching, and access to a publishing account were not established. Do not change signing identity blindly and break installed-app updates.

### F03 — P1 — Release builds silently fall back to debug signing

**Evidence:** `android/app/build.gradle.kts:49–56`.

When the configured release keystore does not exist, the release variant chooses the debug signing configuration. A missing secret in CI or an incorrect path can therefore produce a build described as release with the wrong signing identity. Such a build may not update an installed release and can be distributed accidentally.

**Fix:** Fail the release build with a clear error if the expected keystore or credentials are missing. Verify the resulting artifact's certificate as a release gate.

### F04 — P2 — Declared SDK support and dependency constraints do not describe the locked project

**Evidence:** `pubspec.yaml:environment`, dependencies at lines 15–50; `pubspec.lock:1528–1530`.

The manifest advertises Dart `>=3.0.0 <4.0.0`, while the lockfile records a resolved graph requiring Dart `>=3.11.0` and Flutter `>=3.41.0`. Many direct dependencies use `any`. A developer using the manifest's apparent minimum may get an incompatible graph or a fresh resolution different from the supplied lockfile.

**Fix:** State the actual minimum SDKs supported by the application, pin a Flutter version in the development/CI setup, use deliberate dependency constraints, and validate the checked-in lockfile on that version. This is a reproducibility/support-range defect, not proof that the project fails on the locked toolchain.

### F05 — P2 — A directly imported package is only present transitively

**Evidence:** `lib/providers/host_onboarding_provider.dart:7`; `pubspec.yaml:dependencies`.

The provider imports `package:path/path.dart`, but `path` is not a direct dependency. It currently appears transitively in the lockfile, so it may happen to resolve today. Changes to unrelated dependencies can remove it, and dependency linting should flag the direct use.

**Fix:** Add a compatible direct `path` dependency and run dependency/analyzer checks.

### F06 — P2 — External-app capability checks lack Android visibility declarations

**Evidence:** `android/app/src/main/AndroidManifest.xml:65–70`; `lib/widgets/cashfree_payment_sheet.dart:188–199`; `lib/screens/trips/trip_detail_screen.dart:47–80`; boarding-pass WhatsApp launch code.

The manifest's queries declare `PROCESS_TEXT`, but not the URL schemes tested with `canLaunchUrl`, including UPI and WhatsApp. The locked `url_launcher` documentation requires visibility declarations for these checks on Android 11 and later. The app can choose a fallback even when a suitable app is installed; the payment fallback itself is defective in F26.

**Fix:** Declare the specific checked intents/schemes, or attempt launch directly and handle a real failure where appropriate. Check iOS query declarations for every scheme used there as well. Device behavior was not executed. See reference R2.

### F07 — P2 — A notification backend request can block first-frame startup

**Evidence:** `lib/main.dart:75–88`; `lib/services/push_notification_service.dart:37–40,132–142`.

Before `runApp`, initialization awaits token synchronization. Its raw HTTP POST has no application timeout. For a returning authenticated user with notification permission, a stalled backend connection can delay the first app frame without a bounded startup path. The surrounding catch handles an eventual exception but does not impose a deadline.

**Fix:** Render the application independently of optional token synchronization; bound network waits and retry in the background. Show an explicit recoverable state for essential Firebase initialization failure.

### F08 — P2 — Global error handlers log failures without restoring valid state

**Evidence:** `lib/main.dart:63–79,100–102`; unawaited authentication in F12.

The platform handler returns `true` for every error, and the zone handler only logs the error text. These handlers do not complete failed transactions, undo optimistic changes, or restore a failed screen. Calling errors handled or recovered does not repair state, and stack information is not forwarded to a durable error-reporting mechanism.

**Fix:** Handle expected failures at each operation boundary with explicit results and rollback/retry. Preserve error and stack diagnostics for unexpected failures. Keep global handlers as a final reporting layer, not the success path for business operations.

## Authentication, account isolation, and verification

### F09 — P1 — Email verification accepts two fixed OTPs without contacting the server

**Evidence:** `lib/services/email_verification_service.dart:39–58`; callers in complete/edit profile.

`verifyOtp` returns success immediately for `123456` or `000000`, regardless of email or challenge. There is no debug-build guard. `sendOtp` also reports success and supplies a development code on exceptions. A user can therefore make the client display email ownership as verified without receiving an email, including while offline.

**Fix:** Remove release fallback acceptance entirely. Verification must be a server-authoritative result bound to the requested address, user, challenge, expiration, and attempts. Keep any demonstration behavior in an isolated development implementation. Backend privilege escalation through this client flag was not verified.

### F10 — P2 — Email OTP resend never becomes enabled

**Evidence:** `lib/services/email_verification_service.dart:146–162`.

The countdown starts at 60. While it is greater than 1, the loop decrements it. When it reaches 1, the loop condition becomes false, so the branch that sets `_canResend = true` is never reached. The user remains unable to resend after the displayed wait.

**Fix:** Count down to zero and set resend eligibility before terminating, preferably using a cancellable timer or elapsed-time deadline. Verify the 1-to-0 transition and disposal behavior.

### F11 — P1 — A nonempty stored email is treated as verified

**Evidence:** `lib/screens/auth/complete_profile_screen.dart:51–57`.

The profile screen sets `_isEmailVerified = true` and locks the field whenever it contains text. An email/password account can have an email address while its ownership is unverified; a cached or user-entered backend profile address has the same problem.

**Fix:** Initialize from an authoritative verification state for the exact address. A populated field should not imply ownership. Require verification again when the address changes.

### F12 — P1 — Login and sign-up navigate before authentication finishes

**Evidence:** `lib/screens/auth/login_screen.dart:279–290`; `lib/screens/auth/signup_screen.dart:164–191`; `lib/providers/app_provider.dart:1066–1105`.

The buttons call asynchronous provider methods without awaiting them, then immediately navigate or enable host mode. Wrong passwords, duplicate-email sign-up, and network failures can all lead to the next screen while the operation is still failing. Rethrown errors reach the global logger instead of the form.

**Fix:** Make handlers async, await a successful authentication result, show errors locally, disable repeated submissions, and navigate only after success and a mounted check. Server access control remains necessary; this finding does not prove server authentication bypass.

### F13 — P2 — Automatic phone verification skips the manual flow's completion work

**Evidence:** `lib/providers/app_provider.dart:948–1063`; `lib/screens/auth/phone_input_screen.dart:23–35`.

The automatic callback signs in but provides no completion callback to the screen and does not perform the profile synchronization used after manual OTP sign-in. Navigation is attached to `onCodeSent`. `verifyOTP` also returns success for any existing Firebase user before checking the current challenge, skipping its synchronization block.

**Fix:** Share one successful-authentication routine between automatic and manual verification. Track the phone challenge/session explicitly; an unrelated existing session must not stand in for verification of the current phone number. Complete profile synchronization and navigation once.

### F14 — P1 — User data and entitlements are not isolated across logout/login

**Evidence:** `lib/providers/app_provider.dart:151–206,450–485,1108–1135`; application-scoped providers in `lib/main.dart:89–95`.

Preferences use global keys for phone, biography, verification, identity/bank details, loyalty, and Host Pro. Logout removes only a subset of identity and draft keys and leaves many fields/preferences intact. The other host and messaging providers are not reset or recreated per user. Cached avatar/name fallbacks and late requests can repopulate previous-session state.

**Scenario:** Account A stores profile/KYC/Host Pro state, logs out, and account B signs in on the same device while refresh fails or is delayed. B can observe or inherit A's cached state. The client defect is confirmed; this does not prove B receives A's server permissions.

**Fix:** Scope caches and drafts by Firebase UID, synchronously clear all user state on identity changes, reset every session-owned provider, and reject responses from an old UID/session generation.

### F15 — P1 — Revoked verification states never clear cached success

**Evidence:** `lib/providers/app_provider.dart:236–293`.

Backend synchronization turns verification flags on when a response is true, but does not consistently turn them off when a later response is false or revoked. A previously verified client can therefore continue to present stale approval. Aadhaar/PAN data also share a generic government-ID source rather than preserving separate typed identities.

**Fix:** Replace verification state from the authoritative response, including negative states and typed document identifiers. Distinguish unknown/loading, pending, approved, rejected, and revoked rather than only a persistent true flag.

### F16 — P2 — Raw financial and identity data are saved in ordinary preferences

**Evidence:** `lib/providers/host_onboarding_provider.dart:1076–1097`; `lib/providers/app_provider.dart:342–364`.

The onboarding draft persists the complete account number, account-holder name, IFSC, and UPI ID as JSON in SharedPreferences. PAN/personal details are also cached. Masking an account number elsewhere in the app does not mask this second copy. These values are globally keyed rather than owned by a UID.

**Fix:** Minimize stored sensitive fields, use appropriately protected storage when persistence is necessary, and clear/scope them per account. Review backup behavior and retention. This is a local storage/privacy exposure, not a demonstrated remote extraction.

### F17 — P1 — Face verification compares a selfie to itself and approves failures

**Evidence:** `lib/screens/host/onboarding/screens/bank_details_screen.dart:108–111,494–564`.

Selecting an image immediately sets the verified flag. The request then passes the same uploaded selfie URL as both `selfieImageUrl` and `idCardImageUrl`, so it does not compare the person with an identity-document portrait. The response is treated as successful without checking an approval boolean; missing scores default to 0.96. Any exception sets success with a fabricated 0.95 score. A saved selfie path also restores success.

**Fix:** Require a real server-approved comparison against the correct identity image and the intended liveness process. Represent upload, verification, rejection, and retry separately. A selected file or timeout must never produce verified status. Actual backend KYC approval through this path was not established.

### F18 — P1 — Aadhaar OTP errors are converted into an invented challenge

**Evidence:** `lib/screens/host/onboarding/screens/bank_details_screen.dart:594–648`.

Missing challenge identifiers are replaced with timestamp references. Broad errors containing `400` or `already` open the OTP dialog and can use the fixed reference `84796849`, while claiming that an OTP was sent. A bad request does not prove successful OTP dispatch or identify the user's valid challenge.

**Fix:** Require a genuine challenge/reference from a documented successful response. Handle specific structured error codes; do not infer dispatch from exception text. Clear previous references when the Aadhaar input changes.

### F19 — P1 — Verification flags are not invalidated when verified inputs change

**Evidence:** `lib/screens/host/onboarding/screens/bank_details_screen.dart:141–150` and bank/UPI/identity verification callbacks.

Input updates can replace account/IFSC/UPI/identity values while previously successful verification flags remain set. Asynchronous responses are not consistently tied to a snapshot of the submitted values, so an older request can mark newly edited values as verified.

**Fix:** Bind each verification result to the exact normalized value and a request generation. Editing that value must immediately invalidate the result and challenge reference. Discard an old response if the current input no longer matches.

### F20 — P1 — Host onboarding does not enforce its advertised mandatory checks

**Evidence:** `lib/screens/host/onboarding/host_onboarding_screen.dart:122–154`; `lib/providers/host_onboarding_provider.dart:245,453`.

The central validator checks only some nonempty profile, title, city/state, and payout strings. All other screens default to valid. It does not enforce verified identity/payout, required photo categories, ownership documents, or an explicit declaration before final submission. The legal-declaration boolean starts true.

**Fix:** Define category-specific submission requirements and validate the complete draft before submit, not just the current page. Require affirmative consent for declarations. Repeat all authorization and completeness checks on the server; the frontend cannot be the trust boundary.

### F21 — P2 — Profile saving reports success even when remote persistence fails

**Evidence:** `lib/providers/app_provider.dart:848–933`; `lib/screens/profile/edit_profile_screen.dart:121–136`; `lib/screens/auth/complete_profile_screen.dart:113–122`; avatar update at provider lines 416–447.

The provider writes local preferences before a backend PUT, ignores unsuccessful HTTP responses, and catches failures without returning a failure result. Screens then show success or move on. There is no durable pending-sync queue. Display-name changes can also be overwritten by an old Firebase display name on a later auth refresh; avatar updates use a separate persistence path.

**Fix:** Return a typed save result, check remote acceptance, reconcile Firebase/backend ownership of profile fields, and either roll back or explicitly represent a durable pending update. Do not label a local-only edit saved remotely.

### F22 — P1 — Account deletion can return success without deleting either account record

**Evidence:** `lib/providers/app_provider.dart:1138–1167`; deletion UI in security/profile.

The backend DELETE status is ignored and exceptions are swallowed. Firebase deletion exceptions, including a required recent sign-in, are also swallowed. The method then logs out and returns true. Both deletions can fail while the UI claims permanent deletion.

**Fix:** Reauthenticate when required, validate deletion results, and coordinate a resumable server deletion workflow. Distinguish completed, pending, and failed deletion. Logging out must not be presented as proof that personal records or authentication were removed.

### F23 — P1 — Security settings display protections that are not implemented

**Evidence:** `lib/screens/profile/security_screen.dart:25–35,65–109`.

The biometric and two-factor toggles only write preference booleans; no biometric authentication or MFA enforcement consumes them. Privacy switches have constant values and empty change handlers. Users can believe their account is protected when the displayed controls have no security effect.

**Fix:** Connect these controls to genuine enrollment/enforcement and authoritative status, or remove/disable them with an honest explanation. Password changes must also handle reauthentication; the current-password field is not used to establish a recent credential.

## Payments, bookings, rewards, and paid entitlements

### F24 — P1 — Card and netbanking controls never start their advertised payment

**Evidence:** `lib/widgets/cashfree_payment_sheet.dart:142–168,272–385,775–911`; `pubspec.yaml:dependencies`.

The client creates an order but does not use a payment-session credential, launch a gateway checkout, or submit a card/netbanking authorization. The card OTP dialog checks a local string length, then calls verification of an existing order. Netbanking likewise calls verification directly. There is no Cashfree SDK integration in the dependency list or an equivalent hosted-checkout launch in this flow.

**Fix:** Integrate an actual supported checkout using a backend-created order/session and provider callbacks. Let the gateway handle card authentication. Server verification must remain authoritative. The current sheet does check `isPaid` before returning success; this audit does not claim the verify endpoint automatically accepts an unpaid order. See R1.

### F25 — P1 — Failed payment-order creation leaves a live payment UI with a fabricated order

**Evidence:** `lib/widgets/cashfree_payment_sheet.dart:158–168`.

A missing `orderId` or an exception manufactures a timestamp ID and clears the loading state. QR/UPI/payment controls remain available against an order the gateway may never have created. This can send users into an unreconcilable flow after an API outage.

**Fix:** Require a validated order ID and payment session from a successful server response. Stop with a recoverable error if creation fails; do not offer payment controls on synthetic identifiers.

### F26 — P1 — UPI intent/QR and copied UPI ID use inconsistent, unsupported destinations

**Evidence:** `lib/widgets/cashfree_payment_sheet.dart:178–205`.

The intent and QR use a hardcoded merchant VPA. The copy fallback constructs a different VPA from the last six characters of the order ID. Neither value comes from the payment-order response. Copy and scan therefore instruct the user to pay different addresses, and a string derived from an order ID is not evidence of a valid gateway-issued VPA.

**Fix:** Use provider-supported payment details bound to the real order/session. Never synthesize the destination. Validate reconciliation and refund handling in a sandbox. The audit did not transfer money or establish who controls either address.

### F27 — P2 — QR rendering discloses payment metadata to an unrelated service

**Evidence:** `lib/widgets/cashfree_payment_sheet.dart:183–185,714`.

The QR image is generated through `api.qrserver.com` with the complete UPI URI in the query. That URI contains order/reference, amount, merchant, and property-title information. Rendering also becomes dependent on that external service being available.

**Fix:** Generate the QR locally from gateway-approved payment data, or use the gateway's own supported artifact. Review what payment metadata is shared with third parties.

### F28 — P1 — A payment is not bound to the actual booking that is later created

**Evidence:** `lib/screens/booking/checkout_screen.dart:417–434`; RV checkout lines 724–740; camping checkout lines 137–155; `lib/providers/app_provider.dart:1253–1309`.

Checkout passes a new timestamp booking ID to order creation before a booking exists. After payment verification, `addBooking` creates a separate local/backend booking. Its payload does not include the successful payment order or payment ID, and it does not reuse the ID sent to payment creation.

**Fix:** Have the backend create a pending booking and authoritative quote first, create the payment for that stable booking, and confirm the same booking after server payment verification. Return the canonical booking to the UI. Backend behavior that happens to recover this association was not available for review.

### F29 — P1 — Booking confirmation is shown before booking creation succeeds

**Evidence:** `lib/screens/booking/checkout_screen.dart:427–444`; RV/camping equivalents; `lib/providers/app_provider.dart:1268–1309`.

Checkout does not await `addBooking`. It immediately navigates to confirmation. The provider inserts a local booking first, keeps it after null-token, HTTP failure, or exception, and only logs the failure. Even an accepted response updates only selected fields, leaving the initial local status pending.

**Fix:** Await a structured booking outcome, surface a failure or pending reconciliation state, and show confirmed only from the backend's confirmed booking. Retain recoverable payment evidence if payment succeeded but booking finalization failed.

### F30 — P1 — Unpaid, failed, and unknown booking statuses default to confirmed

**Evidence:** `lib/models/booking_model.dart:34–53`.

The parser initializes `calculatedStatus` as confirmed. It handles only exact lowercase `cancelled` and `confirmed`. `pending`, the default `pending_payment`, `failed`, uppercase variants, and other states fall through to confirmed. Date-derived states are applied only in one branch.

**Fix:** Normalize and explicitly map every contractual status; preserve unknown or unpaid as a nonconfirmed state. Keep payment/booking state distinct from whether a confirmed stay is upcoming, ongoing, or completed. Add parser cases for absent, pending, failed, cancelled, and case variants.

### F31 — P1 — Confirmation codes and smart-lock PINs are fabricated locally

**Evidence:** `lib/screens/booking/booking_confirmation_screen.dart:42–44`; `lib/widgets/digital_boarding_pass_sheet.dart:66–87`; `lib/screens/trips/trip_detail_screen.dart:28–36`.

The confirmation screen generates its own random reference instead of using the accepted booking's code. Access PINs are derived from code digits or a fixed fallback. The pass can describe payment as verified without receiving authoritative lock provisioning or a payment record. A guest can receive a pass/reference that a host or real lock does not recognize.

**Fix:** Pass a confirmed booking object into confirmation/pass screens. Retrieve access credentials only from an authorized backend after eligibility checks and show no PIN until provisioned. This is a false-credential defect, not a demonstrated ability to open a physical lock.

### F32 — P1 — Referral credit is invented and never consumed by checkout

**Evidence:** `lib/providers/app_provider.dart:574–590`; `lib/screens/booking/checkout_screen.dart:400–404`; project-wide callers of `deductReferralBalance`.

Referral balance starts at ₹500 rather than an authoritative earned balance. Checkout applies it to the payable amount, but no successful booking calls the deduction method. The same local credit remains reusable, and restarting restores the initial value.

**Fix:** Let a server ledger reserve and consume eligible credit atomically with booking/payment, and obtain the payable amount from the server quote. Do not trust the submitted total. Whether the backend rejects or grants the repeated discount is unverified.

### F33 — P1 — Rewards and membership updates report success after server rejection

**Evidence:** `lib/providers/app_provider.dart:1463–1606`; `lib/screens/rewards/rewards_screen.dart:363–379`.

Redemption creates local benefits even with no token, unsuccessful HTTP responses, or exceptions. Membership upgrades similarly alter local state on failure. Bonus claiming can add points after rejection, including a repeat claim rejected by the server. A separate upgrade-payment path uses a synthetic booking ID without passing payment evidence to the tier update.

**Fix:** Apply rewards, redemption, and membership state only from authoritative accepted responses. Make claims idempotent and refresh a server ledger. An offline state may be pending, but must not increase spendable balances or confer approval.

### F34 — P1 — Host Pro verifies a different order and activates despite verification failure

**Evidence:** `lib/screens/host/widgets/host_pro_paywall_sheet.dart:75–143`.

The paywall creates a subscription order, then passes it as a booking ID to a sheet that creates another general payment order. It later verifies the first subscription order instead of the returned payment order. Verification errors are swallowed and the response approval is not enforced before local `activateHostPro` runs. Subscription-order creation itself can also fall back to a synthetic ID.

**Fix:** Use one subscription-specific checkout/order/session and require an authoritative activated subscription response. Preserve the exact successful transaction identity. Do not persist an entitlement after rejected verification.

### F35 — P1 — Property boost activation has no intervening payment step

**Evidence:** `lib/screens/host/property_boost_screen.dart:105–125`.

The code requests boost checkout and immediately calls boost activation. It never opens the returned gateway session or takes payment between those calls, and can manufacture an order ID if the response lacks one.

**Fix:** Complete a real checkout and have the backend activate only after independently verifying that the correct property/tier order is paid. Handle rejected checkout/activation explicitly. A backend that already enforces this may reject all current attempts rather than grant free boosts.

### F36 — P1 — Charged camping/RV options are omitted from the booking payload

**Evidence:** `lib/screens/booking/camping_checkout_screen.dart:98–118,137–167`; `lib/screens/booking/rv_checkout_screen.dart:65–77,724–754`; `lib/providers/app_provider.dart:1282–1289`.

Totals include selected tents/add-ons or RV driver/insurance/mileage options, but the booking method accepts only stay, dates, guest count, and total. Selected fulfillment information is not sent. RV creation also hardcodes two guests and omits pickup/drop details used by the screen.

**Fix:** Define typed category-specific booking options, obtain a server quote for them, and persist the exact paid selections with the booking. Hosts must be able to see what was purchased.

### F37 — P1 — Date selection accepts invalid stays and checkout can bypass blocked dates

**Evidence:** `lib/widgets/animated_calendar_picker.dart:55–86,108–113,191–192`; `lib/screens/booking/checkout_screen.dart:301–305,395–404`.

The picker does not consistently reject past days or an end date equal to the start. Checkout substitutes one billable night for a zero-length stay but still sends equal check-in/out timestamps. Reopening checkout's picker does not pass the listing's blocked dates, so a previously constrained choice can be changed to blocked dates.

**Fix:** Enforce future eligible dates and `checkOut > checkIn`, preserve the same availability constraints on every date-edit path, and revalidate a server quote/reservation at checkout. Preventing concurrent double booking must be enforced on the backend.

### F38 — P2 — Price calculations have divergent sources and cannot express explicit zero tax

**Evidence:** `lib/screens/booking/checkout_screen.dart:395–404`; RV/camping total calculations; `lib/widgets/price_breakdown_accordion.dart:33–36`.

The flows independently calculate fees/discounts with different formulas. The accordion interprets `taxes == 0` as a request to invent an 18% fallback, so it cannot display an intentional zero-tax quote. A presentation component should not derive a new charge that differs from the accepted price.

**Fix:** Render one authoritative quoted breakdown and use an explicit nullable/optional value if fallback is truly needed. Keep display totals, order amount, and booked amount identical. This finding does not assert what tax rate is legally applicable.

### F39 — P1 — Automatic retries of mutating requests lack idempotency

**Evidence:** `lib/services/api/api_client.dart:52–79,91–115`.

The shared retry helper applies to POST/PUT as well as reads. A timed-out client future does not establish that the server rejected or cancelled the original operation. Retrying can create multiple orders or repeat other mutations if the first request completed remotely. The client supplies no common idempotency key for the retries.

**Fix:** Retry only safe operations by default. Give payment/order/redemption mutations stable idempotency keys and server deduplication, and reconcile ambiguous timeouts before repeating them. Server-side deduplication was not inspected, so actual duplicate charges are not asserted.

## Host onboarding, listings, and reservations

### F40 — P1 — Failed host submission clears the draft and returns success

**Evidence:** `lib/providers/host_onboarding_provider.dart:929–988`; `lib/screens/host/onboarding/host_onboarding_screen.dart:153–170`.

The submit response is not checked after draft creation. Rejected draft creation falls back to a lead request whose status is also ignored. Even if both requests throw, the final fallback clears the preferences and returns true. The outer catch does the same. The caller then displays the host success screen.

**Fix:** Return distinct saved-draft, submitted-for-review, lead-created, pending, and failed outcomes. Clear the local draft only after a verified successful durable save of the intended submission. Preserve the draft and upload references for retry after any ambiguous or failed result.

### F41 — P1 — Failed document uploads become device-local paths in remote URL fields

**Evidence:** `lib/providers/host_onboarding_provider.dart:995–1005,890–897,921`.

The document upload helper returns the original local path on failure. Callers then send it as a document URL. The bank-passbook field is also sent as a local image path without corresponding upload in that payload flow. A server/reviewer cannot retrieve `/data/...` or other device-local files from an unrelated machine.

**Fix:** Return an explicit upload failure, require successful remotely accessible references for mandatory documents, and upload the passbook through the intended protected document workflow. Never send a local path as a successful uploaded artifact.

### F42 — P2 — Advertised draft autosave omits important onboarding fields

**Evidence:** `lib/providers/host_onboarding_provider.dart:1011–1200`.

Save/restore omit fields used in submission, including blocked dates and scheduling/surcharge fields, videos, some uploaded/category references, ownership/check-in/legal document state, and government-ID details. Restoring the saved page can therefore resume an incomplete draft even though the UI implied the preceding work was saved.

**Fix:** Use one versioned draft model for save and restore, include every editable submission field, and validate local media references after restart. Persist successful upload references so work does not have to be repeated.

### F43 — P1 — Several configured host policies never reach submission

**Evidence:** draft persistence at `lib/providers/host_onboarding_provider.dart:1066–1075,1094`; submission map at lines 845–925.

Quiet hours, government-ID requirement, unregistered guests, pool/kitchen/child/commercial-shoot rules, and the enabled short-stay security-deposit amount are saved locally but missing from the submitted property map. Lease duration is also not submitted. A different long-term `securityDeposit` field does not preserve the configured short-stay amount.

**Fix:** Align form, persisted draft, request DTO, backend storage, and guest-visible policies. Verify each policy round-trip; do not silently substitute fields with similar names.

### F44 — P1 — Starting a new property retains state from the previous property

**Evidence:** `lib/providers/host_onboarding_provider.dart:1218–1249`.

`resetForNewProperty` resets basic text, location, some media, and prices, but leaves property type, room categories, videos, blocked dates, ownership/legal-document paths/URLs, and numerous rules/settings untouched. A second listing can inherit unrelated photos/documents or category-specific data.

**Fix:** Construct a fresh property draft from defaults. Preserve only explicitly user-owned host profile information; all property-owned fields must be reset together. Also apply the UID isolation required by F14.

### F45 — P2 — Category-specific host forms collect values that are never persisted

**Evidence:** `lib/screens/host/onboarding/screens/rv_details_screen.dart:1–65`; camping-details toggles around lines 219–343; onboarding screen list at `host_onboarding_screen.dart:66–70`.

RV details are local widget fields/controllers without a connection to `HostOnboardingProvider`, so the user-entered RV details do not become the submitted draft. Several camping toggles similarly update local state only. Provider step descriptions for hostel/dorm/lease details do not correspond to complete category-specific capture screens in the selected flow.

**Fix:** Bind each supported category's fields to a typed draft and confirm that every control survives navigation/restart and reaches the request. Hide unsupported setup steps until they are implemented.

### F46 — P2 — Unsupported property types are silently categorized as villas

**Evidence:** `lib/providers/host_onboarding_provider.dart:1272–1279`; submission map line 850; `lib/models/stay_model.dart:232–234`.

The mapping explicitly handles only a few types and defaults all others to `VILLA`. RV, hotel/resort, treehouse, homestay, hostel, and dorm selections can therefore receive a villa category. The submitted `type` versus parsed `propertyType` naming also needs a backend contract round-trip check.

**Fix:** Use an exhaustive canonical property-type/category mapping and reject unsupported values. Separate display labels from API enum values. Verify read/write DTO names with backend fixtures.

### F47 — P1 — Host availability starts from mock blocked dates and saves incomplete settings

**Evidence:** `lib/screens/host/host_availability_screen.dart:24–30,427–432`; `lib/providers/app_provider.dart:1342–1360`.

Every opening seeds the 10th through 24th of the current month rather than fetching the property's actual blocked dates. Saving passes only the date list, does not supply a selected property identity, omits selected surcharge/preset values, and announces synced success before awaiting acceptance. Opening and saving can overwrite a schedule with mock data.

**Fix:** Select the intended property, load its authoritative availability, edit a complete typed schedule, and await a successful save. Retain unsaved changes on failure.

### F48 — P2 — Updating one availability field erases an existing maximum stay

**Evidence:** `lib/providers/host_onboarding_provider.dart:649–660`; calls in availability-setup screen.

Most optional fields are updated only when supplied, but `maxStay = max` runs unconditionally. Changing check-in/out or instant-book without specifying `max` sets a previously configured maximum stay to null.

**Fix:** Distinguish an omitted update from an explicit request to clear a value, for example through a typed patch or a sentinel. Verify that unrelated edits preserve the maximum.

### F49 — P1 — The older add-listing route submits local photo paths and announces premature publishing

**Evidence:** `lib/screens/host/add_listing_wizard.dart:97–120`; its route in `lib/navigation/app_router.dart`.

The wizard builds a listing with image-picker file paths as image URLs and does not upload those files. It calls asynchronous listing creation without awaiting an accepted result and reports publishing success. This route still exists even though another host onboarding flow is available.

**Fix:** Either retire the route or make it use the same upload, validation, and accepted-submission workflow as the main host flow. Only a remotely saved, valid listing should be reported published.

### F50 — P1 — Host reservations read a list that is never populated

**Evidence:** `lib/screens/host/host_reservations_screen.dart:35–45`; `lib/providers/app_provider.dart:118,611`; all writes to `_hostBookings`.

The reservations screen consumes `AppProvider.hostBookings`. That list is initialized empty and has no fetch/population path; its other mutations only update existing entries. The separate host dashboard provider's fetched reservations are not used here. The full reservations view therefore remains empty regardless of existing server bookings.

**Fix:** Give the screen a single authenticated host-reservations repository/provider and load the actual bookings with explicit loading/error states. Avoid maintaining disconnected duplicate reservation sources.

### F51 — P1 — Host status, listing, and edit actions keep optimistic success after API failure

**Evidence:** `lib/providers/host_dashboard_provider.dart:141–163`; `lib/providers/host_listings_provider.dart:54–81`; edit save in `lib/screens/host/manage_listings_screen.dart:565–580`.

Booking status, listing visibility/deletion, and some editing paths change local state or announce success without consistently validating HTTP acceptance and rolling back. Rejected deletion can make a listing disappear locally while remaining live. Status APIs also differ across providers in verb and casing, which needs contract verification.

**Fix:** Centralize mutations in typed services, inspect accepted response data, and roll back or retain a visible pending state on failure. Confirm that edits use contractual field names rather than a divergent price/status representation.

## Models, search, maps, and content accuracy

### F52 — P2 — Booking numeric parsing crashes on string-encoded decimals

**Evidence:** `lib/models/booking_model.dart:69–85`; contrasting price parsing in `lib/models/stay_model.dart:132–145`.

Booking totals, rates, rating, and coordinates use direct `as num` casts. A payload with `totalAmount: "1000.00"` or a string decimal rate throws instead of parsing, whereas `StayModel` already handles numeric strings for prices. The actual backend encoding was not supplied, so this is a confirmed input-handling defect with a contract-dependent trigger.

**Fix:** Define and test the backend DTO, normalize numeric inputs consistently, and isolate invalid records from an entire feed. Reject malformed required amounts explicitly instead of silently inventing a valid booking.

### F53 — P1 — Booking property reconstruction drops host identity and check-in mode

**Evidence:** `lib/models/booking_model.dart:65–80`; chat/access callers in trips and host reservations, including `host_reservations_screen.dart:218–228`.

The embedded `StayModel` is rebuilt without `hostId`, `isStayingWithHost`, or the full check-in/presence information. Defaults can make a host-accompanied stay look like self check-in. Chat paths can then fall back to a property ID as a host ID or fabricate a conversation reference after conversation creation fails.

**Fix:** Parse the property through one complete contract-aware model and preserve host/check-in identity. Require an actual conversation ID and eligible access mode instead of unrelated identifier fallbacks.

### F54 — P2 — Stay image/tag parsing is incompatible with common and locally emitted shapes

**Evidence:** `lib/models/stay_model.dart:149–155,190–193,253–275`; `lib/providers/app_provider.dart:493–507`.

The reader assumes every image is a map with `url` and every tag is a map with `tag`. The writer emits `images` as a list of strings. A string-list payload therefore fails to round-trip; a malformed record can throw during mapping and fail an entire fetch. Booking image parsing already supports both shapes.

**Fix:** Establish one read/write schema, normalize contractual alternatives deliberately, and handle one invalid listing without losing all valid listings. Include serializer round-trip and representative backend fixture cases.

### F55 — P2 — Experience classification and capacity do not survive data round trips

**Evidence:** `lib/models/stay_model.dart:228,237–238,253–275`; `lib/providers/app_provider.dart:634–635`; add-experience flow.

`fromJson` hardcodes `isExperience` false, regardless of the response. Experience-only filtering rejects loaded records. The writer also omits spot-capacity fields that the experience form/model use, and duration is not restored consistently.

**Fix:** Parse and serialize the actual experience type, duration, and capacity, or use a separate experience DTO. Verify creating an experience, fetching it again, filtering it, and checking remaining spots.

### F56 — P1 — All fetched listings receive invented ratings and review counts

**Evidence:** `lib/models/stay_model.dart:211–212`; top-rated category filtering.

Every parsed listing gets a 4.8 rating and 15 reviews, even when the response contains different data or none. This fabricates social proof. A filter requiring at least 4.9 can never include those loaded listings regardless of real reviews. Default amenities can similarly present unverified property facilities.

**Fix:** Preserve authoritative ratings/counts and distinguish unrated from rated. Do not substitute invented reviews or amenities for missing data. Filters must operate on the actual values.

### F57 — P2 — Display category labels are compared directly with API categories

**Evidence:** `lib/widgets/category_selector.dart:21–30`; `lib/providers/app_provider.dart:628`; RV/map category setters.

The UI chooses labels such as `RVs`, `Cabins`, and `Camping`, while API/model categories use values such as `RV`, `CABIN`, and `CAMPING`. Exact case-sensitive comparison rejects matching properties. Different screens attempt different normalizations, so the behavior depends on which path opens search.

**Fix:** Store canonical category enums/IDs and map them to display labels. Apply one shared filter rather than screen-specific string conversions.

### F58 — P2 — Search dates and guest count do not affect returned stays

**Evidence:** `lib/providers/app_provider.dart:625–650`; inputs in `lib/screens/search/search_filter_modal.dart`.

The computed filter handles category, price, experience, host presence, and destination text. It does not use selected dates, adult/child count, property capacity, or inventory availability. The UI accepts these search parameters but can return an overcapacity or unavailable stay unchanged.

**Fix:** Search with a backend contract that includes dates and party composition, or clearly distinguish preliminary discovery from availability results. Revalidate capacity and inventory at booking; a frontend filter alone cannot prevent overbooking.

### F59 — P2 — Current-location search treats latitude as destination text

**Evidence:** `lib/screens/auth/location_permission_screen.dart:113–116`; `lib/providers/app_provider.dart:640–645`.

The permission flow sets the destination to a `lat, lng` string. Search then takes the first comma-separated segment and looks for that numeric latitude in location/city/state/title text. It does not perform a nearby-distance query, so location permission can result in empty or irrelevant discovery.

**Fix:** Store coordinates separately from a human destination label and implement a real proximity query/filter. Reverse-geocode only for display if needed.

### F60 — P1 — Manually entered addresses default to Delhi coordinates

**Evidence:** `lib/screens/host/onboarding/screens/property_location_screen.dart:110–129`.

Any text edit updates the location with fixed Delhi latitude/longitude if coordinates were previously unset. A manually entered address in Goa or another city can therefore be submitted with Delhi map coordinates. Optional later GPS/search selection may correct it, but ordinary text entry does not.

**Fix:** Keep unresolved coordinates null, geocode the actual address or require confirmed map selection, and invalidate coordinates when an address materially changes. Validate that submitted address and location describe the same property.

### F61 — P2 — Map markers are not rebuilt when provider results change

**Evidence:** `lib/screens/map/map_discovery_screen.dart:29–61,92–119`.

The provider listener moves the camera but does not rebuild markers. Markers are rebuilt at initialization and some user interactions, so fetched or filtered cards can diverge from existing pins. Marker callbacks retain old list indexes and can select the wrong current card after a result change.

**Fix:** Rebuild markers when the result set changes, reconcile selection by stay ID, and discard stale asynchronous marker generations. Bound the selected card index after filtering.

### F62 — P2 — Map disposal looks up an ancestor provider from a deactivated context

**Evidence:** `lib/screens/map/map_discovery_screen.dart:85–89`.

The `dispose` method calls `Provider.of(context)` to remove its listener. Ancestor lookup during disposal can trigger a deactivated-widget assertion. The Google map controller is also not disposed in this path. The post-frame listener registration needs a mounted guard if the screen is removed immediately.

**Fix:** Retain the provider reference while the element is active, unsubscribe through that reference, guard deferred registration, and dispose owned controllers. Verify repeated open/close and navigation before the first post-frame callback. See R5 for Flutter's state/subscription lifecycle guidance.

### F63 — P2 — Premium/live market and AI content is hardcoded or unverified

**Evidence:** `lib/screens/host/widgets/neighborhood_price_radar_widget.dart:32–34,62` onward; `lib/screens/host/onboarding/widgets/qube_ai_listing_assistant_widget.dart:33–75`; fallback in `lib/services/qube_api_service.dart`.

The radar forces Pro/founding-state values and displays constructed competitor/occupancy benchmarks instead of fetched market data. The listing assistant produces keyword templates, and planner fallback responses can name stays or amenities without database grounding. These paths are presented as live or property-specific capabilities rather than clearly labelled examples.

**Fix:** Obtain real entitlement/market data, identify unavailable data honestly, and ground recommendations/descriptions in actual property facts. Require host review before saving generated claims; missing data must not become invented amenities or market measurements.

## Messaging

### F64 — P1 — An authenticated chat socket survives account changes

**Evidence:** `lib/providers/messaging_provider.dart:22–57`; global provider in `lib/main.dart:95`; logout in `app_provider.dart:1108–1135`.

`initializeSocket` returns immediately when an existing socket is connected, without checking which UID owns it. `disposeSocket` has no call site, and provider disposal/account logout does not clean it up. Conversations/messages also remain cached after failed fetches. Account B can therefore continue using a connection originally authenticated as A on the same app process.

**Fix:** Own sockets and chat caches by UID, dispose and clear them on sign-out/identity changes, reconnect with fresh credentials, and add provider teardown. Independently validate server socket authorization and token expiry.

### F65 — P2 — The first incoming message in an empty conversation is ignored

**Evidence:** `lib/providers/messaging_provider.dart:40–45`.

Incoming messages are appended only when `_currentMessages` is already nonempty and its first message identifies the conversation. An open empty conversation has no first message, so the first incoming message is not shown even when it belongs to the active thread.

**Fix:** Track the active conversation ID directly rather than infer it from a stored message. Append/deduplicate incoming messages against that identity.

### F66 — P1 — Message sending duplicates transport attempts and hides delivery failures

**Evidence:** `lib/providers/messaging_provider.dart:150–192` and incoming handler at lines 40–45.

Every send adds a local temporary message, emits over a connected socket, and also posts over REST. The two requests share no stable client-message ID, and the server's REST response/status is ignored. A socket echo can append another version without replacing the temporary one. Depending on backend behavior, one action can persist twice or look sent after both deliveries fail.

**Fix:** Use one acknowledged delivery path or a genuine fallback after timeout, with a stable idempotent message ID. Reconcile the optimistic item with accepted server data and show pending/failed/retry states. Actual backend duplication was not exercised.

### F67 — P2 — Overlapping conversation requests can display messages from the wrong thread

**Evidence:** `lib/providers/messaging_provider.dart:121–147`.

All conversation detail requests write into the same `_currentMessages` list with no active-thread or request-generation guard. Open A, then B; if A's slower response arrives last, it replaces B's messages. The same general problem exists across account changes if old authenticated requests finish after logout.

**Fix:** Key message stores by conversation and UID, and only commit a response to the currently active request generation. Cancel or ignore obsolete work.

## Support, wallet UI, and lifecycle

### F68 — P1 — Support ticket creation fabricates a registered ticket after failure

**Evidence:** `lib/screens/profile/support_screen.dart:258–339,779–795`.

Non-success HTTP results and exceptions manufacture an `OPEN` ticket reference. The button then announces registration; its caller can also show that message after the method returned early for missing fields. There is no durable outbox proving that the invented ticket will ever reach an agent.

**Fix:** Show registered only after receiving a real server ticket ID. Return a typed validation/network/server result and preserve unsent issue text for retry. A pending local draft must not claim support escalation has occurred.

### F69 — P1 — Wallet add-funds and withdrawal controls only show success messages

**Evidence:** `lib/screens/profile/payments_screen.dart:197–220,258–263`.

The financial action handlers show snackbars without creating a payment or withdrawal request. The amount field is not wired to an action value. The displayed result therefore does not correspond to movement of funds or an accepted transaction.

**Fix:** Implement amount capture, validation, an authenticated transaction workflow, and authoritative status, or remove the success claims and clearly mark the feature unavailable. No real debit/credit was demonstrated by this UI.

### F70 — P2 — Several asynchronous callbacks can update disposed screens

**Evidence:** `lib/screens/profile/kyc_verification_screen.dart:132,155`; IFSC callback in `lib/screens/host/onboarding/screens/bank_details_screen.dart:176–201`; `lib/screens/host/property_boost_screen.dart:89–102`; listing availability loading in `lib/screens/listing/listing_detail_screen.dart:50–65`.

Some success, catch, or finally paths call `setState` or use navigation/context after awaited work without a mounted check. Starting a request and navigating back before completion can trigger `setState() called after dispose` or an ancestor-lookup error; a catch path that also calls unguarded `setState` can fail again.

**Fix:** Guard every post-await screen mutation, including errors and finally, and prefer cancellable/request-owned work. The phone verification navigation callbacks need the same lifecycle protection. Test leaving each screen during a slow request.

## Questions requiring backend, native builds, or external configuration

These are **not counted as demonstrated backend vulnerabilities or completed runtime failures**. They should be resolved alongside the source fixes.

| Question | Source evidence | Required verification |
|---|---|---|
| C01: iOS Google sign-in client setup | `ios/Runner/Info.plist` lacks `GIDClientID`; `GoogleSignIn.instance.initialize()` receives no client ID in `app_provider.dart:781`. A GoogleService plist and reversed URL scheme are present. | Locked plugin guidance requires an Info.plist client ID or explicit initialization configuration. Check the built bundle and actual plugin behavior rather than assume the separate Firebase plist satisfies it. Test sign-in on a native device. R3. |
| C02: iOS push/APNs setup | No Runner entitlements file, `CODE_SIGN_ENTITLEMENTS`, or `aps-environment` declaration found in the supplied project. | Confirm Push Notifications/Background Modes capabilities, the signed app's entitlements, APNs key configuration in Firebase, provisioning, and token delivery. These external settings are not established by the ZIP. R4. |
| C03: iOS deployment-target mismatch | `project.pbxproj:357` uses 13.0 for Profile; Debug/Release use 15.5 at lines 483/534. `Podfile` sets 15.5. | Align intended targets and run Profile/Release with the locked plugins. No Xcode build was possible here. |
| C04: Web target is incomplete | Firebase startup has no explicit web options; no `firebase_options.dart`, messaging worker, or Maps JavaScript setup was found; code calls native `Platform`/file APIs. | If web is supported, add browser-specific configuration and conditional native operations, then build and exercise login, maps, uploads, and push. Presence of `web/` alone does not prove the target is intended or functional. |
| C05: Support tickets lack authenticated retrieval | `support_screen.dart:349` GETs tickets using the editable email query without an Authorization header. | A secure endpoint may reject this request; an endpoint that trusts the email may expose other users' tickets. Verify UID-based authorization in the backend. Do not label this a proven IDOR from frontend evidence alone. |
| C06: Divergent API contracts | `AuthApi` POSTs `/users/sync-profile`; provider PUTs `/auth/sync-profile`. Booking-status mutations differ by path/verb/case. Price/type/guest field names also vary. | Compare against backend DTOs/OpenAPI and fixtures, then consolidate callers. Both endpoint forms might exist; source differences alone do not prove a 404. |
| C07: Availability has two data sources | Listing detail reads Firestore availability; host availability updates a REST endpoint. Failed Firestore read can leave an empty blocked-date list. | Establish whether REST mirrors into Firestore, enforce server-side atomic capacity/date reservation, and test concurrent checkout. No backend inventory implementation or Firestore rules were supplied. |
| C08: Server trust boundaries | Client sends total, user/host IDs, discount-derived values, and verification/entitlement-related requests. | Server must derive actor identity from verified tokens, authorize object ownership, calculate amounts, and independently check gateway/KYC results. Inspect DTO validation, webhook signatures, replay protection, and idempotency. Client defects do not prove the server trusts these fields. |
| C09: Firebase/Maps/Storage access and credential restrictions | Public Firebase/mobile configuration and Maps keys are in platform files; document uploads use Firebase Storage. | Check Firebase rules, document privacy, API-key package/bundle/certificate restrictions, quotas, and enabled providers. A public client key is not itself a secret-server-key leak. No rules or cloud-console configuration were available. |
| C10: Historical Kotlin failures | Archived `.kotlin/errors` contain incremental-cache failures referring to different Windows drive roots; `android/gradle.properties:4` already disables Kotlin incremental compilation. | Treat logs as prior build evidence. Reproduce from a clean pinned environment before claiming the current project still has that platform failure. |
| C11: Push navigation and lifecycle | Notification-open handlers log messages but do not route to booking/chat content. Token registration/removal uses separate raw requests. | Define the intended destination behavior, verify signed-out/account-switch handling, bound token removal, and test foreground/background/terminated delivery. |

## Recommended repair order

1. **Contain and establish a build baseline:** resolve F02 signing exposure, remove debug release fallback, correct all F01 imports, align SDK/dependencies, and obtain successful analyzer plus Android/iOS builds on a pinned toolchain.
2. **Restore account and verification integrity:** isolate all caches/providers/sockets by UID, invalidate old responses, remove fixed OTPs and fabricated KYC success, validate edited inputs, and enforce complete onboarding requirements.
3. **Rebuild payment-to-booking handoff:** authoritative quote → durable pending booking → real gateway order/session → gateway checkout → server verification → confirmation of the same booking. Keep failure/pending states recoverable and idempotent.
4. **Make mutations truthful:** booking, host submission, listing updates, account deletion, ticket creation, rewards, and paid entitlements must return typed accepted/failed/pending outcomes. Preserve drafts and payment evidence until the intended operation is durably accepted.
5. **Repair models and feature wiring:** canonical enums/DTOs, numeric/media parsing, category-specific host/booking options, complete draft persistence, search parameters, maps, and genuine data behind security/wallet/premium controls.
6. **Run the verification matrix below:** resolve C01–C11 with backend contracts and native devices, then add CI gates for analyzer, tests, dependency lock consistency, signing configuration, and secret scanning.

## Verification matrix for the repaired implementation

These checks are recommendations, **not tests executed during this audit**. They target concrete risks in the source and should use a test backend/payment sandbox with suitable fixtures.

| Scenario | Required result |
|---|---|
| Clean checkout of source on the pinned SDK | No unresolved imports; analyzer and supported platform builds pass. |
| Missing release keystore in CI | Release build fails rather than using debug signing. |
| Invalid/offline email OTP | No verified state; resend becomes available after its deadline. |
| Automatic phone verification and manual OTP | Same completed profile-sync/navigation flow; unrelated existing user does not satisfy a new challenge. |
| A logs out, B logs in; refresh fails | No A profile, bank, KYC, rewards, Host Pro, listing draft, conversations, or socket survives into B. |
| Old A request finishes after B signs in | Response is discarded or stored only in A's isolated cache. |
| Verification approved, then edited/revoked | Approval clears and must be re-established for the exact current value. |
| Face match rejects/times out/upload fails | Pending/failed result, no invented score or verified flag. |
| Order creation fails or omits session/ID | Payment UI stops and offers retry; no synthetic order/VPA. |
| Card/netbanking/UPI checkout | Actual gateway flow runs; accepted payment is reconciled to the same durable booking. |
| Payment succeeds, booking finalization fails | Recoverable pending resolution; no unsupported confirmed booking/pass. |
| Timeout after a server accepted mutation | One order/message/claim only through stable idempotency and reconciliation. |
| Booking status fixtures | Pending, missing, failed, cancelled, case variants, and unknown states never become paid/confirmed by default. |
| Booking/stay DTO fixtures | Numeric/string decimals, valid image/tag shapes, host identity, check-in mode, and experience fields parse as contracted. |
| Past/same-day/blocked/overcapacity booking | Rejected before payment and independently rejected by the backend; concurrent reservations cannot oversell. |
| Camping/RV paid options | Quote, payment, persisted booking, and host fulfillment show exactly the same options and party. |
| Host submission with 4xx/5xx/timeout | Honest failed/pending result; complete draft and successful uploads remain available for retry. |
| Kill/restart draft and start second property | All first draft fields restore correctly; a fresh property inherits no property-owned state. |
| Host reservations and rejected listing mutation | Real bookings load; unsuccessful mutation rolls back or shows pending/error. |
| Empty chat and rapid A→B thread switch | First incoming message appears in the correct thread; late responses never replace the active thread. |
| Socket echo plus REST retry | One reconciled message; failed deliveries show failed/pending with retry. |
| Delete account needs reauthentication; backend rejects | No permanent-deletion success until the required workflow succeeds. |
| Ticket creation fails or validation rejects | No fabricated registered ticket; entered issue is retained. |
| Map filters change; leave screen during KYC/boost/load | Pins match current result IDs; no disposed-state/context errors. |
| Native Google sign-in, push, app links | Correct device behavior and signed entitlements on each supported platform. |

## Primary documentation consulted

These references support integration requirements; application-specific findings are grounded in the supplied code. Documentation was checked during the audit. No private source, credential, or user data was submitted to these sites.

- **R1:** [Cashfree's official Flutter payment SDK repository](https://github.com/cashfree/flutter-cashfree-pg-sdk). Its payment session is built from order ID, payment-session ID, and environment before checkout.
- **R2:** [Flutter-maintained `url_launcher` 6.3.2 documentation](https://pub.dev/packages/url_launcher/versions/6.3.2). Documents Android package visibility and iOS query-scheme requirements for capability checks.
- **R3:** [Flutter-maintained `google_sign_in_ios` 6.3.6 integration documentation](https://pub.dev/packages/google_sign_in_ios/versions/6.3.6). Describes Info.plist client-ID configuration or explicit initialization and the required URL scheme.
- **R4:** [Firebase Cloud Messaging setup for Flutter](https://firebase.google.com/docs/cloud-messaging/flutter/get-started). Describes platform configuration and Apple push prerequisites.
- **R5:** [Flutter `State.dispose` lifecycle documentation](https://api.flutter.dev/flutter/widgets/State/dispose.html). Describes teardown and subscription ownership across state lifecycle methods.

## Limits of the conclusion

The confirmed source defects already justify holding a production release. Resolving them will require actual analyzer/build feedback and representative backend/device tests. This audit does not certify backend authorization, gateway reconciliation, cloud rules, store readiness, or the absence of further errors. It identifies reproducible source-level failure paths and a concrete repair/verification backlog without changing the supplied project.
