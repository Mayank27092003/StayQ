import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import '../models/booking_model.dart';
import '../models/stay_model.dart';
import '../providers/app_provider.dart';
import '../widgets/cashfree_payment_sheet.dart';

/// One screen owns one pending booking; retrying payment does not create a second booking.
class BookingCheckout {
  BookingModel? _pending;
  String? _selection;
  String? _requestKey;
  bool busy = false;
  PaymentSuccessResult? payment;
  Future<BookingModel?> run(BuildContext context, AppProvider provider, StayModel stay,
      DateTimeRange dates, int guests, {required double estimate,
      Map<String, dynamic> options = const {}, List<DateTime> blockedDates = const []}) async {
    if (busy) return null;
    busy = true;
    try {
      final start = DateUtils.dateOnly(dates.start), end = DateUtils.dateOnly(dates.end);
      if (start.isBefore(DateUtils.dateOnly(DateTime.now())) || !end.isAfter(start)) throw StateError('Choose valid check-in and check-out dates.');
      if (blockedDates.any((d) => !DateUtils.dateOnly(d).isBefore(start) && DateUtils.dateOnly(d).isBefore(end))) throw StateError('This date range includes blocked nights.');
      final selection = jsonEncode([provider.userId, stay.id, dates.start.toIso8601String(),
        dates.end.toIso8601String(), guests, options]);
      if (_selection != selection) {
        _pending = null; payment = null; _selection = selection;
        _requestKey = 'booking-${List.generate(16, (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, "0")).join()}';
      }
      _pending ??= await provider.addBooking(stay, dates.start, dates.end, guests,
        totalAmount: estimate, options: options,
        idempotencyKey: _requestKey);
      if (!context.mounted) return null;
      if (_pending!.isConfirmed && _pending!.isPaid) return _pending;
      payment ??= await CashfreePaymentSheet.show(context, bookingId: _pending!.id,
        totalAmount: _pending!.totalAmount, propertyTitle: stay.title,
        customerName: provider.userName, customerEmail: provider.userEmail, customerPhone: provider.userPhone);
      if (payment == null || !context.mounted) return null;
      for (var attempt = 0; attempt < 3; attempt++) {
        _pending = await provider.refreshBooking(_pending!.id);
        if (_pending!.isConfirmed) return _pending!.copyWith(isPaid: true);
        if (attempt < 2) await Future<void>.delayed(const Duration(seconds: 2));
      }
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Payment received. Booking confirmation is pending. Check Trips for its status.')));
      return null;
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      return null;
    } finally { busy = false; }
  }
}
