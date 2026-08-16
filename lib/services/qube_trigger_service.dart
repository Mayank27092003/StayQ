import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/custom_toast.dart';

// ───────────────────────────────────────────────────────────────
// QUBE TRIGGER SERVICE — Smart contextual nudge engine
// ───────────────────────────────────────────────────────────────
// This service monitors user behavior and triggers Toasts
// at the perfect moment to guide, celebrate, or nudge the user.
// ───────────────────────────────────────────────────────────────

class QubeTriggerService {
  QubeTriggerService._();
  static final QubeTriggerService instance = QubeTriggerService._();

  Timer? _browsingTimer;
  bool _hasShownBrowsingNudge = false;

  // ─── Keys for SharedPreferences ───
  static const _keyFirstBooking = 'qube_first_booking_shown';
  static const _keyWelcomeShown = 'qube_welcome_shown';
  static const _keyTripReminderShown = 'qube_trip_reminder_';

  // ─────────────────────────────────────────────
  // 1. BROWSING TOO LONG — "Need help finding something?"
  // ─────────────────────────────────────────────
  void startBrowsingTimer(BuildContext context, {int seconds = 60}) {
    _browsingTimer?.cancel();
    _hasShownBrowsingNudge = false;

    _browsingTimer = Timer(Duration(seconds: seconds), () {
      if (_hasShownBrowsingNudge) return;
      _hasShownBrowsingNudge = true;

      if (context.mounted) {
        CustomToast.show(
          context: context,
          title: 'Need help finding something? 🏠',
          subtitle: 'I can help you discover the perfect stay! Try filtering by price, location, or amenities.',
          durationSeconds: 12,
        );
      }
    });
  }

  void resetBrowsingTimer(BuildContext context, {int seconds = 60}) {
    _browsingTimer?.cancel();
    if (!_hasShownBrowsingNudge) {
      startBrowsingTimer(context, seconds: seconds);
    }
  }

  void stopBrowsingTimer() {
    _browsingTimer?.cancel();
  }

  // ─────────────────────────────────────────────
  // 2. TRIP IS TOMORROW — "Pack your bags!"
  // ─────────────────────────────────────────────
  Future<void> checkUpcomingTrips(
    BuildContext context, {
    required List<DateTime> tripStartDates,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final tomorrow = DateTime.now().add(const Duration(days: 1));

    for (final tripDate in tripStartDates) {
      if (tripDate.year == tomorrow.year &&
          tripDate.month == tomorrow.month &&
          tripDate.day == tomorrow.day) {
        final key = '$_keyTripReminderShown${tripDate.toIso8601String()}';
        if (prefs.getBool(key) == true) continue;

        await prefs.setBool(key, true);

        if (context.mounted) {
          CustomToast.show(
            context: context,
            title: 'Pack your bags! 🧳',
            subtitle: 'Your trip starts tomorrow! Make sure you have everything ready for an amazing experience.',
            type: ToastType.info,
          );
        }
        break; 
      }
    }
  }

  // ─────────────────────────────────────────────
  // 3. FIRST BOOKING EVER — Achievement celebration! 🎉
  // ─────────────────────────────────────────────
  Future<void> checkFirstBookingCelebration(
    BuildContext context, {
    required int totalBookings,
  }) async {
    if (totalBookings != 1) return; 

    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_keyFirstBooking) == true) return;

    await prefs.setBool(_keyFirstBooking, true);
    await Future.delayed(const Duration(milliseconds: 800));

    if (context.mounted) {
      CustomToast.show(
        context: context,
        title: '🎉 Welcome to the Traveler\'s Club!',
        subtitle: 'You just made your very first booking on Stay Q! You\'re officially a traveler. The world awaits!',
        type: ToastType.success,
      );
    }
  }

  // ─────────────────────────────────────────────
  // 4. AFTER CHECKOUT — "Leave a review" reminder
  // ─────────────────────────────────────────────
  void showReviewReminder(
    BuildContext context, {
    required String stayTitle,
    VoidCallback? onWriteReview,
  }) {
    CustomToast.show(
      context: context,
      title: 'How was $stayTitle? ✍️',
      subtitle: 'Your recent stay is complete! Share your experience to help other travelers and earn Stay Q rewards.',
      type: ToastType.success,
      durationSeconds: 15,
    );
  }

  // ─────────────────────────────────────────────
  // 5. WELCOME POPUP — First time opening the app
  // ─────────────────────────────────────────────
  Future<void> showWelcomeIfFirstTime(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_keyWelcomeShown) == true) return;

    await prefs.setBool(_keyWelcomeShown, true);
    await Future.delayed(const Duration(milliseconds: 1500));

    if (context.mounted) {
      CustomToast.show(
        context: context,
        title: 'Welcome to Stay Q! 🏨',
        subtitle: 'Discover amazing stays, get the best deals, and keep updated on your trips!',
        type: ToastType.info,
      );
    }
  }

  // ─────────────────────────────────────────────
  // 6. WISHLIST NUDGE — First wishlist item
  // ─────────────────────────────────────────────
  void showWishlistNudge(BuildContext context) {
    CustomToast.show(
      context: context,
      title: 'Great taste! ❤️',
      subtitle: 'I saved this to your wishlist. Want me to find similar stays nearby? I know all the hidden gems!',
      type: ToastType.success,
      durationSeconds: 8,
    );
  }

  // ─────────────────────────────────────────────
  // 7. HOST MODE ACTIVATED — Welcome to hosting
  // ─────────────────────────────────────────────
  void showHostModeWelcome(BuildContext context) {
    CustomToast.show(
      context: context,
      title: 'Welcome, Host! 🎩',
      subtitle: 'You\'ve activated Host Mode. From here you can manage your listings, accept bookings, and track your earnings.',
      type: ToastType.success,
    );
  }

  // ─────────────────────────────────────────────
  // 8. PRICE DROP ALERT
  // ─────────────────────────────────────────────
  void showPriceDropAlert(
    BuildContext context, {
    required String stayTitle,
    required double newPrice,
    required double oldPrice,
  }) {
    final savings = ((oldPrice - newPrice) / oldPrice * 100).toInt();
    CustomToast.show(
      context: context,
      title: 'Price Drop Alert! 🔥',
      subtitle: '$stayTitle just dropped $savings%! Now ₹${newPrice.toInt()}/night. This deal won\'t last long!',
      type: ToastType.info,
      durationSeconds: 10,
    );
  }

  void dispose() {
    _browsingTimer?.cancel();
  }
}
