# Changelog - Stay Q Mobile Application

All notable changes and releases for the Stay Q mobile app will be documented in this file.
Versioning follows Semantic Versioning `MAJOR.MINOR.PATCH+BUILD`.

---

## [1.0.10+13] - 2026-10-03
### Changed
- Incremented build code to `13` (version `1.0.10`) for Google Play Store release.

### Fixed
- **Permission Cleanup:** Permanently removed `android.permission.FOREGROUND_SERVICE_LOCATION` and `GeolocatorLocationService` via `tools:node="remove"`, resolving Google Play's Android 14 foreground location policy block and demo video requirement.
- **Location Functionality:** Retained standard in-app location permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) for search, property mapping, and address auto-detection.

---

## [1.0.9+12] - 2026-10-02
### Fixed
- Manifest cleanup to remove unused `FOREGROUND_SERVICE_LOCATION` injected by `geolocator_android`.

---

## [1.0.9+11] - 2026-10-02
### Added
- **iOS Auth Support:** Added missing `CFBundleURLTypes` (with Google client reverse ID) and `ITSAppUsesNonExemptEncryption = false` to `ios/Runner/Info.plist` to prevent crash on Phone OTP and Google Sign-In redirect.
### Fixed
- **Phone OTP Verification:** Extended Firebase Phone Auth timeout to 120s (preventing premature expiration in India SMS delivery).
- **Auto-Verification Race Condition:** Handled Android SMS Retriever auto-completion in `verifyOTP` and `otp_screen.dart` so valid manual input does not trigger "code expired" error.

---

## [1.0.9+10] - 2026-10-01
### Status
- Approved and live on Google Play Store production track.
