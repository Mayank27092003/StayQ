# Validation record

Prepared on 2026-10-07 against the supplied frontend ZIP. The original ZIP is unchanged. Its SHA-256 is `2b8ef53f0a6cfb0357a3877549eabb6080f9bc33e1a5f31a543015364fd568a6`.

## Checks executed

- Dart tree-sitter syntax parsing: **147 files passed**, including five new test files.
- Relative import/export/part resolution: **572 targets passed**.
- Imported package names match directly declared dependencies; no `any` constraints remain.
- Every declared asset directory exists; supplied media assets are retained.
- JSON/YAML/XML/plist/entitlements syntax parsing passed. Exact file counts are recorded in `SOURCE_CHECK_RESULTS.json`.
- iOS Google client IDs match the supplied Firebase plist; Android backup protection and external-app visibility declarations are checked.
- The source contains no distributed private signing keystore or Android key.properties; release configuration does not fall back to debug signing.
- The restored Gradle wrapper JAR contains GradleWrapperMain and matches its recorded SHA-256.
- An additional limited source check matched 128 constructor calls to 32 project constructor signatures and found no unknown named arguments. This does not resolve types, inherited/external APIs or replace the analyzer.
- The final ZIP is checked for readable CRCs, safe relative POSIX paths, expected source/assets and excluded private keys/build caches.

Re-run the source checker:

```bash
python -m pip install -r tools/requirements-audit.txt
python tools/verify_source.py --syntax --json
```

## Checks not executed

| Check | Status / reason |
|---|---|
| flutter pub get / dependency resolution | Unrun; Flutter/Dart unavailable. The old lockfile cannot represent the added plugins and was removed. |
| dart format / Flutter analyzer | Unrun; Dart/Flutter unavailable. Syntax parsing cannot establish type correctness or eliminate lint warnings. |
| flutter test | Unrun; regression tests are supplied but have not been executed. |
| Android debug/release / Gradle | Unrun; no Flutter/Gradle toolchain. Release requires private credentials. |
| Xcode/iOS Profile/Release/signing | Unrun; no macOS/Xcode/provisioning. |
| Backend DTO/API contract tests | Unrun; backend source/OpenAPI/fixtures were not supplied. |
| Physical-device payment/KYC/Google/push | Unrun; merchant/Firebase/native services and test devices were not available. |
| Web build or feature verification | Unrun; web remains outside the completed target scope. |

An SDK download could not complete in this environment. The result is a source repair package with explicit integration gates, not a claim that all native/runtime checks pass.

## Regression tests supplied

`test/api_client_test.dart` checks safe GET retries, single-send mutations, rejected/malformed success responses, 204 deletion, authentication enforcement and idempotency headers. `test/email_verification_test.dart` checks that both old fixed codes and network failures require server acceptance. Booking/model tests check unknown/payment-pending status, explicit paid evidence, decimal-string amounts, guest counts, full nested host/options and experience/media round trips. Payment-order tests reject missing sessions/nonpositive prices/invalid environments. The widget test checks explicit zero tax and an estimated total.

## Required integration scenarios

1. Switch A→signed out→B during slow profile, KYC, host, wallet and chat requests; B must receive no A data, drafts, socket messages or untargeted push.
2. Edit verified input/challenge while KYC is running; old responses must not verify the new value. Fail/timeout liveness, face match and uploads; no approval should be granted.
3. Exercise card/netbanking/UPI gateway flows, cancellation/app switching, webhook delays and lost order responses. The same durable booking/order must remain reconcilable and no duplicate charge should be created.
4. Reject booking creation, quote changes, pending payment and pending confirmation. Confirm that only verified paid/confirmed server state displays success/access details.
5. Try blocked/past/zero-length stays and concurrent capacity requests. Server inventory/quote checks must enforce policy atomically, including camping/RV add-ons and separate party counts.
6. Fail every host upload/draft/create/submit stage; restart/resume and verify all source fields, uploaded URLs and the same draft ID remain available. Add another property and verify a clean reset.
7. Reject host edit/delete/status and reward/tier/boost mutations; no local success/approval/credit should remain. Verify repeated financial/ticket/message attempt keys on lost responses.
8. Open chats A/B rapidly, receive the first message in an empty chat, disconnect the socket and fail message acknowledgment. Correct-thread data and pending/failed status must remain visible.
9. Reject support creation, authorize ticket retrieval by UID, inspect private document rules and verify wallet load failures/unavailable actions.
10. Run native Google login, encrypted draft write/read, APNs foreground/background/terminated behavior and signed release builds with actual provisioning.

Use `BACKEND_CONTRACT.md` and the original audit verification matrix for server/device acceptance. Debug/unsigned CI builds alone do not establish production merchant, privacy or provisioning correctness.
