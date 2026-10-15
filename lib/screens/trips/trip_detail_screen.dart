import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/booking_model.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../providers/messaging_provider.dart';
import '../../providers/app_provider.dart';
import '../../services/api/api_client.dart';
import '../../services/api/bookings_api.dart';
import '../../widgets/digital_boarding_pass_sheet.dart';
import '../inbox/chat_detail_screen.dart';
import '../listing/listing_detail_screen.dart';

class TripDetailScreen extends StatefulWidget {
  final BookingModel booking;

  const TripDetailScreen({super.key, required this.booking});

  @override
  State<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends State<TripDetailScreen> {
  late BookingModel _booking;
  bool _isCancelling = false;

  @override
  void initState() {
    super.initState();
    _booking = widget.booking;
  }

  String get _wifiSsid {
    final clean = _booking.stay.title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
    final prefix = clean.length > 8 ? clean.substring(0, 8) : clean;
    return '${prefix}_StayQ_5G';
  }

  String get _wifiPassword {
    final code = _booking.confirmationCode.isNotEmpty ? _booking.confirmationCode : 'GUEST';
    return 'StayQ@$code';
  }

  Future<void> _shareItinerary(BuildContext context) async {
    AppMotion.tapMedium();
    final stay = _booking.stay;
    final df = DateFormat('EEE, MMM dd, yyyy');
    final checkInStr = df.format(_booking.checkIn);
    final checkOutStr = df.format(_booking.checkOut);
    final nights = _booking.checkOut.difference(_booking.checkIn).inDays;
    final pin = _booking.accessPin?.isNotEmpty == true ? _booking.accessPin! : 'Awaiting host instructions';

    final itineraryText = '''STAYQ TRIP ITINERARY
Property: ${stay.title}
Location: ${stay.location}
Booking Code: ${_booking.confirmationCode}
Dates: $checkInStr to $checkOutStr ($nights nights)
Access: ${stay.isStayingWithHost ? "In-Person Check-in with ${stay.hostName}" : "Access: $pin"}
Wi-Fi: $_wifiSsid (Key: $_wifiPassword)
Booking total: ₹${_booking.totalAmount.toStringAsFixed(0)}
Official Desk: hello@stayq.space''';

    await Clipboard.setData(ClipboardData(text: itineraryText));

    final encoded = Uri.encodeComponent(itineraryText);
    final waUri = Uri.parse('whatsapp://send?text=$encoded');
    final webWaUri = Uri.parse('https://api.whatsapp.com/send?text=$encoded');

    try {
      if (await canLaunchUrl(waUri)) {
        await launchUrl(waUri, mode: LaunchMode.externalApplication);
      } else if (await canLaunchUrl(webWaUri)) {
        await launchUrl(webWaUri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Trip itinerary copied to clipboard! 📋'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Trip itinerary copied to clipboard! 📋'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _openDirections(BuildContext context) async {
    AppMotion.tapMedium();
    final stay = _booking.stay;
    final query = Uri.encodeComponent('${stay.title}, ${stay.location}');
    final mapsUri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    try {
      if (await canLaunchUrl(mapsUri)) {
        await launchUrl(mapsUri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Location: ${stay.location}')),
          );
        }
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location: ${stay.location}')),
        );
      }
    }
  }

  void _copyWifiPassword(BuildContext context) {
    AppMotion.tapMedium();
    Clipboard.setData(ClipboardData(text: _wifiPassword));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.wifi_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text('Wi-Fi Password ($_wifiPassword) copied! 📶')),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _openBoardingPass(BuildContext context) {
    AppMotion.tapHeavy();
    final stay = _booking.stay;
    final provider = context.read<AppProvider>();
    final guestName = _booking.guestName.isNotEmpty
        ? _booking.guestName
        : (provider.userName.isNotEmpty ? provider.userName : 'Valued Guest');

    DigitalBoardingPassSheet.show(
      context,
      accessPin: _booking.isConfirmed && _booking.isPaid ? _booking.accessPin : null,
      isPaid: _booking.isPaid,
      confirmationCode: _booking.confirmationCode,
      guestName: guestName,
      stayTitle: stay.title,
      stayLocation: stay.location,
      category: stay.category,
      checkIn: _booking.checkIn,
      checkOut: _booking.checkOut,
      totalAmount: _booking.totalAmount,
      hostName: stay.hostName,
      isStayingWithHost: stay.isStayingWithHost,
    );
  }

  void _showCancellationModal(BuildContext context) {
    AppMotion.tapSelection();
    final hoursUntilCheckIn = _booking.checkIn.difference(DateTime.now()).inHours;
    double refundPercent;
    String policyTitle;
    String policyDesc;

    if (hoursUntilCheckIn >= 48) {
      refundPercent = 1.0;
      policyTitle = '100% Full Refund Policy';
      policyDesc = 'Free cancellation applied because you are cancelling more than 48 hours prior to check-in.';
    } else if (hoursUntilCheckIn > 0) {
      refundPercent = 0.5;
      policyTitle = '50% Moderate Refund Policy';
      policyDesc = '50% refund applied because cancellation is requested within 48 hours of scheduled check-in.';
    } else {
      refundPercent = 0.0;
      policyTitle = 'Non-Refundable';
      policyDesc = 'No refund is eligible after scheduled check-in time has passed.';
    }

    final refundAmount = _booking.totalAmount * refundPercent;
    final feeAmount = _booking.totalAmount * (1.0 - refundPercent);

    String selectedReason = 'Change of travel plans';
    final reasons = [
      'Change of travel plans',
      'Medical or personal emergency',
      'Found alternative accommodation',
      'Booked wrong dates or location',
      'Other reason',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isDark = AppColors.isDark(ctx);

            return Container(
              decoration: BoxDecoration(
                color: AppColors.card(ctx),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: EdgeInsets.only(
                top: 16,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(ctx).padding.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white24 : Colors.black12,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Cancellation Request',
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.bold,
                            color: AppColors.text(ctx),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.close_rounded, color: AppColors.textSub(ctx)),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Policy Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: refundPercent > 0
                            ? AppColors.primary.withValues(alpha: isDark ? 0.15 : 0.08)
                            : Colors.red.withValues(alpha: isDark ? 0.15 : 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: refundPercent > 0
                              ? AppColors.primary.withValues(alpha: 0.3)
                              : Colors.red.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                refundPercent > 0 ? Icons.verified_rounded : Icons.warning_rounded,
                                color: refundPercent > 0 ? AppColors.primary : Colors.red,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                policyTitle,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: refundPercent > 0 ? AppColors.primary : Colors.red,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            policyDesc,
                            style: TextStyle(fontSize: 12.5, color: AppColors.text(ctx), height: 1.3),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Refund Calculation Breakdown
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface(ctx),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border(ctx)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'REFUND CALCULATION BREAKDOWN',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSub(ctx), letterSpacing: 0.8),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Original Booking Total', style: TextStyle(fontSize: 13, color: AppColors.textSub(ctx))),
                              Text('₹${_booking.totalAmount.toStringAsFixed(2)}', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.text(ctx))),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Cancellation / Host Fee', style: TextStyle(fontSize: 13, color: AppColors.textSub(ctx))),
                              Text('₹${feeAmount.toStringAsFixed(2)}', style: TextStyle(fontSize: 14, color: AppColors.textSub(ctx))),
                            ],
                          ),
                          Divider(height: 20, color: AppColors.border(ctx)),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Estimated Refund', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.text(ctx))),
                              Text(
                                '₹${refundAmount.toStringAsFixed(2)}',
                                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppColors.successGreen),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Refunds are credited to original payment source within 3-5 business days.',
                            style: TextStyle(fontSize: 11, color: AppColors.textSub(ctx)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Reason for cancellation',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.text(ctx)),
                    ),
                    const SizedBox(height: 8),
                    ...reasons.map((r) {
                      final isSelected = selectedReason == r;
                      return GestureDetector(
                        onTap: () {
                          setModalState(() => selectedReason = r);
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.08)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : AppColors.border(ctx),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                size: 18,
                                color: isSelected ? AppColors.primary : AppColors.textSub(ctx),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  r,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isSelected ? AppColors.primary : AppColors.text(ctx),
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 18),
                    // Confirm cancellation button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: _isCancelling
                            ? null
                            : () async {
                                final appProvider = context.read<AppProvider>();
                                final messenger = ScaffoldMessenger.of(context);
                                Navigator.pop(modalCtx);
                                setState(() => _isCancelling = true);
                                try {
                                  await BookingsApi(ApiClient.instance).cancelBooking(_booking.id);
                                  if (mounted) {
                                    setState(() {
                                      _booking = _booking.copyWith(status: BookingStatus.cancelled);
                                    });
                                    await appProvider.fetchBookings();
                                    messenger.showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          refundAmount > 0
                                              ? 'Reservation cancelled. Refund of ₹${refundAmount.toStringAsFixed(0)} will be credited soon.'
                                              : 'Reservation cancelled successfully.',
                                        ),
                                        backgroundColor: const Color(0xFF1E293B),
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  if (mounted) {
                                    messenger.showSnackBar(
                                      SnackBar(
                                        content: Text('Cancellation error: $e'),
                                        backgroundColor: Colors.red,
                                      ),
                                    );
                                  }
                                } finally {
                                  if (mounted) setState(() => _isCancelling = false);
                                }
                              },
                        child: _isCancelling
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('Confirm Cancellation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final stay = _booking.stay;
    final dateFormat = DateFormat('EEE, MMM dd, yyyy');
    final checkInStr = dateFormat.format(_booking.checkIn);
    final checkOutStr = dateFormat.format(_booking.checkOut);
    final nights = _booking.checkOut.difference(_booking.checkIn).inDays;
    final isDark = AppColors.isDark(context);
    final isCancelled = _booking.status == BookingStatus.cancelled;

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        title: const Text('Trip Details', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Share Itinerary',
            onPressed: () => _shareItinerary(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Property Hero Card
            GestureDetector(
              onTap: () {
                AppMotion.tapSelection();
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => ListingDetailScreen(stay: stay)),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.card(context),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.border(context)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SizedBox(
                        width: 90,
                        height: 90,
                        child: (stay.imageUrls.isNotEmpty && stay.firstImage.startsWith('http'))
                            ? Image.network(
                                stay.firstImage,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => Container(
                                  color: AppColors.surface(context),
                                  child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 32),
                                ),
                              )
                            : Container(
                                color: AppColors.surface(context),
                                child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 32),
                              ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isCancelled
                                      ? Colors.red.withValues(alpha: 0.12)
                                      : AppColors.successGreen.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  _booking.status.name.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: isCancelled ? Colors.red : AppColors.successGreen,
                                  ),
                                ),
                              ),
                              if (stay.isStayingWithHost) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'With Host',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            stay.title,
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.text(context)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            stay.location,
                            style: TextStyle(fontSize: 13, color: AppColors.textSub(context)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: AppColors.textSub(context)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Check-in & Check-out Dates Box
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.card(context),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.border(context)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('CHECK-IN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSub(context), letterSpacing: 1.0)),
                            const SizedBox(height: 4),
                            Text(checkInStr, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.text(context))),
                            const SizedBox(height: 2),
                            Text('From 2:00 PM', style: TextStyle(fontSize: 12, color: AppColors.textSub(context))),
                          ],
                        ),
                      ),
                      Container(height: 40, width: 1, color: AppColors.border(context)),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('CHECK-OUT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSub(context), letterSpacing: 1.0)),
                            const SizedBox(height: 4),
                            Text(checkOutStr, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.text(context))),
                            const SizedBox(height: 2),
                            Text('Until 11:00 AM', style: TextStyle(fontSize: 12, color: AppColors.textSub(context))),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Divider(height: 24, color: AppColors.border(context)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('$nights ${nights == 1 ? "night" : "nights"} • ${_booking.adults + _booking.children} guests', style: TextStyle(fontSize: 13, color: AppColors.textSub(context), fontWeight: FontWeight.w600)),
                      Text('Code: ${_booking.confirmationCode}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Door PIN & Access Info Box
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF052E16).withValues(alpha: 0.6) : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? const Color(0xFF166534) : const Color(0xFF86EFAC)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.key_rounded, color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF15803D), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        stay.isStayingWithHost ? 'HOST IN-PERSON CHECK-IN' : 'DIGITAL SELF CHECK-IN ACCESS',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF15803D), letterSpacing: 1.0),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (!stay.isStayingWithHost) ...[
                    Text(
                      (_booking.accessPin?.isNotEmpty == true ? 'Access PIN: ${_booking.accessPin}' : 'Awaiting host access instructions'),
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: isDark ? Colors.white : const Color(0xFF0F172A), letterSpacing: 1.5),
                    ),
                    const SizedBox(height: 4),
                    Text('Use only the access instructions supplied for this booking.', style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : const Color(0xFF64748B))),
                  ] else ...[
                    Text(
                      'Hosted Stay with ${stay.hostName}',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    Text('Direct key handover upon arrival. Host ${stay.hostName} will welcome you.', style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : const Color(0xFF64748B))),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 20),

            // WI-FI PASSWORD COPY CARD (Strict requirement)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.card(context),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border(context)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.wifi_rounded, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('PROPERTY HIGH-SPEED WI-FI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSub(context), letterSpacing: 0.8)),
                        const SizedBox(height: 2),
                        Text(_wifiSsid, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.text(context))),
                        const SizedBox(height: 2),
                        Text('Key: $_wifiPassword', style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () => _copyWifiPassword(context),
                    icon: const Icon(Icons.copy_rounded, size: 14),
                    label: const Text('Copy', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Quick Host Communication & Navigation
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                    label: const Text('Contact Host'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () async {
                      AppMotion.tapSelection();
                      final provider = Provider.of<AppProvider>(context, listen: false);
                      if (!provider.isLoggedIn) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please log in to chat with the host')),
                        );
                        return;
                      }

                      final messaging = Provider.of<MessagingProvider>(context, listen: false);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Connecting to ${stay.hostName}...'), duration: const Duration(seconds: 1)),
                      );

                      final convId = await messaging.createOrGetConversation(
                        hostId: stay.hostId,
                        propertyId: stay.id,
                        bookingId: _booking.id,
                      );

                      if (convId == null) {
                        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(messaging.error ?? 'Conversation could not be opened.')));
                        return;
                      }
                      if (context.mounted) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ChatDetailScreen(
                              chatId: convId,
                              otherUserName: stay.hostName.isNotEmpty ? stay.hostName : 'Host',
                              otherUserAvatar: stay.hostAvatar,
                            ),
                          ),
                        );
                      }
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.directions_rounded, size: 18),
                    label: const Text('Directions'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.text(context),
                      side: BorderSide(color: AppColors.border(context)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () => _openDirections(context),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Download Boarding Pass Action
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.confirmation_number_rounded, size: 18),
                label: const Text('View Official Stay Pass (QR)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF073359),
                  foregroundColor: const Color(0xFFC5A880),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                ),
                onPressed: () => _openBoardingPass(context),
              ),
            ),

            const SizedBox(height: 20),

            // Total Paid Details
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.card(context),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border(context)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Payment Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.text(context))),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_booking.isPaid ? 'Total Paid' : 'Booking total', style: TextStyle(fontSize: 14, color: AppColors.textSub(context))),
                      Text('₹${_booking.totalAmount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(_booking.isPaid ? 'Payment verified' : 'Payment status is available in Trips', style: TextStyle(fontSize: 11, color: AppColors.textSub(context))),
                ],
              ),
            ),

            // Cancellation Button if eligible
            if (!isCancelled && _booking.status != BookingStatus.completed) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: () => _showCancellationModal(context),
                  icon: const Icon(Icons.cancel_outlined, color: Colors.red, size: 18),
                  label: const Text(
                    'Cancel Booking & Check Refund Policy',
                    style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
