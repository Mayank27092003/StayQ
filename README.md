# StayQ — repaired frontend source

This archive updates the supplied Flutter project. It contains source repairs for audit findings F01–F70, five focused regression-test files, native configuration repairs, a source-integrity checker and an optional GitHub Actions workflow. Read `FIXES.md` for the finding-by-finding status and `BACKEND_CONTRACT.md` for integration requirements.

This is a source delivery, not a verified production build. Flutter, Dart and Xcode were unavailable in the repair environment. No dependency resolution, Flutter analyzer, Flutter test, Android build, iOS build or real payment/KYC exercise was run. The passing checks in `VALIDATION.md` concern source syntax and archive/configuration integrity only.

## Toolchain and first run

The supplied lockfile required Dart 3.11 / Flutter 3.41. Direct dependencies are now pinned to their supplied versions, with Cashfree checkout and secure storage added. Use Flutter **3.41.0** (Dart 3.11), Java 17, Android SDK and, for iOS, Xcode/CocoaPods. Android minimum SDK is at least 23; iOS deployment target is 15.5.

The old `pubspec.lock` was removed because it does not contain the added plugins. Resolve dependencies in the actual Flutter environment, review and commit the newly generated application lockfile before release:

```bash
flutter --version
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
# On macOS:
flutter build ios --debug --no-codesign
```

The optional `.github/workflows/verify.yml` runs dependency resolution, analyzer error checks, regression tests and unsigned/debug native builds. Analyzer warnings and infos are reported without failing that workflow; use the full analyzer command above for the complete lint review. The workflow was supplied but not executed here.

Run against your backend with:

```bash
flutter run --dart-define=STAYQ_API_BASE_URL=https://YOUR_BACKEND/api/v1 --dart-define=CASHFREE_ENVIRONMENT=SANDBOX
```

If omitted, the API URL retains the supplied project's backend. Cashfree defaults to sandbox unless an authoritative order specifies its environment. The backend must create the actual payment session and reconcile payments with bookings. Do not change only the client environment to switch to production.

## Android signing

Private signing credentials and the keystore from the original ZIP have been removed. `android/key.properties.example` documents the fields to supply privately. Release tasks require a real, complete release signing configuration and cannot fall back to debug signing. Debug builds remain usable without it.

Reset/replace the exposed upload credential through your distribution account before another release. Removing the credential from this ZIP does not revoke the previously exposed key. Preserve the application's established signing identity through the appropriate distribution process.

The missing Gradle wrapper JAR was restored from the official Gradle `v8.14.0` source tag. Its SHA-256 is `7d3a4ac4de1c32b59bc6a4eb8ecb8e612ccd0cf1ae1e99f66902da64df296172`. The machine-specific Android `local.properties` and historical build caches are excluded; Flutter generates local paths on the build machine.

## Supported scope and honest feature states

Android and iOS are the intended verification targets. The supplied `web/` directory remains, but web is not a completed target: native file/MLKit/payment behavior and Firebase/Maps web setup require separate implementation.

Wallet top-ups/withdrawals, biometric/consent settings, review submission rewards and checkout referral redemption are explicitly unavailable where a real server workflow was absent. They no longer report fabricated success. MFA status is read from Firebase; password changes require real reauthentication. Server-backed profile rewards and membership/order flows reject unconfirmed results.

Host drafts are encrypted and scoped to the Firebase user. Approval flags are not restored from drafts; the host must obtain fresh server verification after resuming. A failed upload or submission preserves the draft and presents the error. Switching account disposes the old account's host/chat state. Legacy unowned personal preferences are discarded rather than assigned to a different user.

Native Google sign-in client configuration, deployment targets, Android visibility queries and iOS entitlements were updated. APNs provisioning, Firebase console settings, storage rules, gateway credentials, server authorization and device behavior still need integration validation. Notification ownership/token lifecycle is improved; booking/chat deep-link navigation remains a product integration task.

## Files included

- `FIXES.md`: all 70 original findings mapped to the repaired code or a feature mitigation.
- `BACKEND_CONTRACT.md`: request/response shapes and server invariants required by the frontend.
- `VALIDATION.md` and `SOURCE_CHECK_RESULTS.json`: checks actually run and checks still outstanding.
- `test/`: transaction, OTP, booking/model, payment-session and zero-tax regression cases.
- `tools/verify_source.py`: repeatable source-integrity checks; not a replacement for Flutter analysis.
- `ORIGINAL_AUDIT.md`: original audit, retaining original-file line references for context.
- `CHANGED_FILES.json`: relative source/configuration paths changed, added or removed.
